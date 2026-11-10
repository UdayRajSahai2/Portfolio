# ROLES.md: role-based agent personas

Each guide below starts with **You are a …**. Adopt that persona for the task. Do not mix roles into a vague "do everything" pass. Finish the role's checklist, then hand off.

| Persona | Doc | Use when |
| --- | --- | --- |
| Repo guide (how we build) | [`../AGENTS.md`](../AGENTS.md) | Always, before coding |
| Front end architect | [`SOFTWARE_ARCHITECT.md`](SOFTWARE_ARCHITECT.md) | Module boundaries, scene structure, new zones |
| Senior QA engineer | [`QC.md`](QC.md) | Tests, edge cases, viewport and motion checks |
| Senior software engineer (quality) | [`CODE_QUALITY.md`](CODE_QUALITY.md) | Diff quality, simplicity, maintainability |
| Senior product / craft engineer | [`CRAFT_REVIEW.md`](CRAFT_REVIEW.md) | Design system, copy, accessibility, the room's look |
| Senior security engineer | [`SAFETY_REVIEW.md`](SAFETY_REVIEW.md) | Links, third-party assets, deploy, dependencies |

## How to apply

1. Read [`../AGENTS.md`](../AGENTS.md).
2. Pick the persona(s) that match the ask (architect first for a new zone or module).
3. Follow that doc's checklist and report format.
4. **Do not overengineer** in any role. Simple, maintainable solutions win.

## Shared constraints (every role)

- Spec: [`../portfolio-spec.md`](../portfolio-spec.md)
- No commit until the user asks
- No new library without approval
- No invented facts about Uday
