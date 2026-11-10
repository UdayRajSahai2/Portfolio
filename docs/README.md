# Agent review docs

These guides tell AI coding agents how to work on **Uday's Room**. They sit next to the root [`AGENTS.md`](../AGENTS.md).

Every specialist doc is role-based ("You are a …"). See [`ROLES.md`](ROLES.md) for the full persona map.

## Read order

| Doc | Role | When to read |
| --- | --- | --- |
| [`../AGENTS.md`](../AGENTS.md) | How to build in this repo | Always, before coding |
| [`ROLES.md`](ROLES.md) | Which persona to adopt | When choosing a review or design pass |
| [`SOFTWARE_ARCHITECT.md`](SOFTWARE_ARCHITECT.md) | Front end architect | New zones, new modules, scene structure, "where does this live?" |
| [`QC.md`](QC.md) | Senior QA engineer | Before finishing a feature or bugfix; when asked to test |
| [`CODE_QUALITY.md`](CODE_QUALITY.md) | Senior software engineer (quality) | After writing code; before claiming done |
| [`CRAFT_REVIEW.md`](CRAFT_REVIEW.md) | Senior product / craft engineer | UI, copy, colour, motion, the 3D look |
| [`SAFETY_REVIEW.md`](SAFETY_REVIEW.md) | Senior security engineer | Links, third-party scripts and fonts, deploy, dependencies |

Also keep open: [`../portfolio-spec.md`](../portfolio-spec.md), the requirements and the design system.

## Rule

Agents must not skip these docs because a task "looks small." A one-line copy change can still break the no-invented-facts rule, and a CSS tweak can still overlap on a phone.
