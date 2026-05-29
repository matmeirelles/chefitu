#!/usr/bin/env python3
"""
Spec Writer — turns rough Linear issues into production-ready specs.
Usage: npm run spec-writer -- CHE-XX
"""

import sys
import os
import re
import anyio
import requests
from pathlib import Path
from dotenv import load_dotenv
from claude_agent_sdk import query, ClaudeAgentOptions
from claude_agent_sdk.types import ResultMessage, AssistantMessage, RateLimitEvent

load_dotenv()

LINEAR_API_KEY = os.environ["LINEAR_API_KEY"]
LINEAR_API_URL = "https://api.linear.app/graphql"
PROJECT_ROOT = Path(__file__).parent

# Remove ANTHROPIC_API_KEY so the Agent SDK uses Claude Code OAuth (Pro plan)
# instead of billing against API credits
os.environ.pop("ANTHROPIC_API_KEY", None)

SYSTEM_PROMPT = """You are a Spec Writer agent that helps turn rough feature ideas into production-ready specs for engineering handoff.

When given a Linear issue, follow these steps in order:

**Step 1 — Codebase analysis check:**
Ask the user: "Should I analyze the full codebase for this issue? Skip if it's a small, isolated change."
- If yes: use the Bash tool to run `npx repomix --output repomix-output.xml` in the project root, then use the Read tool to read repomix-output.xml.
- If no: proceed directly to the next step.

**Step 2 — Load the spec template:**
Use the Read tool to read Instructions.md from the project root.
If the issue involves UI changes, also read docs/design-system.md to reference the correct components, tokens, and patterns.

**Step 3 — Analyze and identify gaps:**
Using the codebase snapshot (if taken) and the issue, identify:
- Which files/modules are affected and existing patterns
- Technical impacts, edge cases, and dependencies
- Open decisions, ambiguities, or potential regressions (performance, security, UX)

If the issue contains images, treat them as the source of truth for the UI. The spec must explicitly state that the implementation should match the design in the images pixel-by-pixel, and include the image references inside the spec so the developer sees them before coding.

**Step 4 — Ask clarifying questions:**
Ask the user targeted questions to fill gaps. Ask at most 5 questions per round, numbered and grouped by theme. Do not write the spec until all critical decisions are resolved.

**Step 5 — Confirm before writing:**
Summarize your understanding and all resolved decisions. Ask the user to explicitly confirm before writing.

**Step 6 — Write the spec:**
Write the completed spec in English using the Instructions.md template.
Wrap the final spec in <spec> tags so the system can save it to Linear automatically:

<spec>
[your spec here]
</spec>

IMPORTANT: If the original issue description contains images (markdown image syntax like ![...](...)), preserve them at the top of the spec inside the <spec> tags.

Never guess on decisions — surface them explicitly. Never skip the confirmation step."""


def linear_request(query_str: str, variables: dict = None) -> dict:
    response = requests.post(
        LINEAR_API_URL,
        headers={"Authorization": LINEAR_API_KEY, "Content-Type": "application/json"},
        json={"query": query_str, "variables": variables or {}},
    )
    if not response.ok:
        raise RuntimeError(f"Linear API {response.status_code}: {response.text}")
    data = response.json()
    if "errors" in data:
        raise RuntimeError(f"Linear API error: {data['errors']}")
    return data


def fetch_issue(identifier: str) -> dict:
    try:
        team_key, number_str = identifier.split("-")
        number = int(number_str)
    except ValueError:
        print(f"Invalid identifier: {identifier}. Expected format: CHE-13")
        sys.exit(1)

    data = linear_request(
        """
        query($filter: IssueFilter) {
          issues(filter: $filter) {
            nodes { id identifier title description url }
          }
        }
        """,
        {"filter": {"number": {"eq": number}, "team": {"key": {"eq": team_key}}}},
    )
    nodes = data["data"]["issues"]["nodes"]
    if not nodes:
        print(f"Issue {identifier} not found in Linear.")
        sys.exit(1)
    return nodes[0]


def update_issue(issue_id: str, description: str) -> bool:
    data = linear_request(
        """
        mutation($id: String!, $input: IssueUpdateInput!) {
          issueUpdate(id: $id, input: $input) {
            success
          }
        }
        """,
        {"id": issue_id, "input": {"description": description}},
    )
    return data["data"]["issueUpdate"]["success"]


def extract_spec(text: str) -> str | None:
    match = re.search(r"<spec>(.*?)</spec>", text, re.DOTALL)
    return match.group(1).strip() if match else None


def make_options() -> ClaudeAgentOptions:
    return ClaudeAgentOptions(
        system_prompt=SYSTEM_PROMPT,
        max_turns=30,
        cwd=str(PROJECT_ROOT),
        permission_mode="bypassPermissions",
        disallowed_tools=["AskUserQuestion", "Task"],
    )


async def run_turn(prompt: str) -> str:
    """Runs one turn and returns the assistant response text."""
    response_parts = []

    async for message in query(prompt=prompt, options=make_options()):
        if isinstance(message, RateLimitEvent):
            info = message.rate_limit_info
            if info.status != "allowed":
                print(f"[rate limit] type={info.rate_limit_type} status={info.status}")
        elif isinstance(message, AssistantMessage):
            for block in message.content:
                if hasattr(block, "text"):
                    response_parts.append(block.text)
        elif isinstance(message, ResultMessage):
            if message.is_error:
                print(f"[result error] subtype={message.subtype} errors={message.errors}")

    return "\n".join(response_parts).strip()


async def main():
    if len(sys.argv) < 2:
        print("Usage: npm run spec-writer -- CHE-XX")
        sys.exit(1)

    identifier = sys.argv[1].upper()

    print(f"\nFetching {identifier} from Linear...")
    issue = fetch_issue(identifier)

    print(f"\n{'─' * 60}")
    print(f"  {issue['identifier']} — {issue['title']}")
    print(f"{'─' * 60}")
    print(f"\n{issue.get('description') or '(no description)'}\n")
    print(f"{'─' * 60}\n")

    initial_prompt = (
        f"Here's the Linear issue to spec:\n\n"
        f"**{issue['identifier']} — {issue['title']}**\n\n"
        f"{issue.get('description') or '(no description)'}\n\n"
        f"Let's start."
    )

    print("Spec Writer ready. Press Enter twice to send. Type 'exit' to quit.\n")

    history: list[str] = []
    first_prompt = f"Issue to spec:\n\n**{issue['identifier']} — {issue['title']}**\n\n{issue.get('description') or '(no description)'}\n\nLet's start."

    response = await run_turn(first_prompt)
    if response:
        print(f"Spec Writer: {response}\n")
    history.append(f"User: {first_prompt}\nAssistant: {response}")

    while True:
        try:
            print("You: ", end="", flush=True)
            lines = []
            while True:
                line = input()
                if line == "" and lines and lines[-1] == "":
                    break
                lines.append(line)
            user_input = "\n".join(lines).strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nSession ended.")
            break

        if not user_input or user_input.lower() in ["exit", "quit"]:
            print("\nSession ended.")
            break

        context = "\n\n".join(history)
        prompt = f"Conversation so far:\n\n{context}\n\nUser: {user_input}"
        response = await run_turn(prompt)

        if response:
            spec = extract_spec(response)
            if spec:
                clean_response = re.sub(r"<spec>.*?</spec>", "", response, flags=re.DOTALL).strip()
                if clean_response:
                    print(f"\nSpec Writer: {clean_response}\n")
                print("\n[saving spec to Linear...]")
                success = update_issue(issue["id"], spec)
                print("✓ Spec saved to Linear." if success else "✗ Failed to save to Linear.")
                break
            else:
                print(f"\nSpec Writer: {response}\n")
            history.append(f"User: {user_input}\nAssistant: {response}")


if __name__ == "__main__":
    anyio.run(main)
