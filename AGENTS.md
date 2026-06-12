# Chefitu — Agent Instructions

See also `CLAUDE.md` for stack, changelog, and branch naming conventions.

## Spec Writer mode

When a Linear issue comment contains `/spec-writer` or `continuar spec-writer`:

1. Follow `.cursor/skills/spec-writer/SKILL.md` exactly.
2. **Do NOT** implement code, create branches, or open pull requests.
3. Interact with the PM **only via Linear comments** on the issue.
4. Read the full comment thread to determine the current phase (analyze → clarify → confirm → write).
5. Write the final spec to the issue description using the template in `Instructions.md`.
6. Use targeted repo search — never run repomix.

Invocation from Linear:

```
@Cursor /spec-writer [repo=matmeirelles/chefitu]
```

After PM answers questions:

```
@Cursor continuar spec-writer
```
