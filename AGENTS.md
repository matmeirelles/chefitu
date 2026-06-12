# Chefitu — Agent Instructions

See also `CLAUDE.md` for stack, changelog, and branch naming conventions.

## Spec Writer mode

When a Linear issue comment contains `/spec-writer` or `continuar spec-writer`:

1. Follow `.cursor/skills/spec-writer/SKILL.md` exactly.
2. **Do NOT** implement code, create branches, or open pull requests.
3. **Your response is synced to Linear** — output Impact Reports, questions, and specs directly; do not wait for Linear MCP.
4. Read the full comment thread from the issue context provided by the integration.
5. Write the final spec to the issue description using the template in `Instructions.md` (via MCP, `linear:update` script, or manual paste fallback).
6. Use targeted repo search — never run repomix.

Invocation from Linear:

```
@Cursor /spec-writer [repo=matmeirelles/chefitu]
```

After PM answers questions:

```
@Cursor continuar spec-writer
```
