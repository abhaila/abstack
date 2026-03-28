---
name: documenting-code
description: Create behavioural specifications using Given/When/Then scenarios, tables, and mermaid diagrams. Use when documenting system behaviour, domain concepts, technical specifications, or creating executable specifications.
---

# Documenting Code as Behavioural Specifications

Create documentation that explains system behaviour through concrete scenarios rather than abstract descriptions. This follows the billing-engine specification format: structured sections, tables for configuration, mermaid diagrams for flows, and Given/When/Then scenarios as executable specifications.

## Before You Start

**REQUIRED**: You MUST read ALL example files before writing any documentation:

1. [examples/formatting-reference.md](examples/formatting-reference.md) - Document structure, scenarios, tables, diagrams, user story template
2. [examples/concept-documentation.md](examples/concept-documentation.md) - How to document a domain concept
3. [examples/process-documentation.md](examples/process-documentation.md) - How to document a process with diagrams
4. [examples/index-file.md](examples/index-file.md) - How to structure an index file

**Do not proceed until you have read and understood all four example files.**

## Workflow

You MUST follow this workflow when documenting code:

### Phase 1: Discover Product Features

Before writing any documentation, explore the codebase to discover all product features. Focus on what the product does, not how it's implemented.

**What to discover:**

1. **Product capabilities** - What can users accomplish with this system? What problems does it solve?
2. **User workflows** - What are the end-to-end journeys users take? What triggers each workflow?
3. **Core concepts** - What are the main entities users interact with? How do they relate to each other?
4. **Configuration options** - What choices do users have? What settings can they adjust?
5. **Business rules** - What rules govern behaviour? What constraints exist?
6. **Lifecycles and states** - What states can things be in? What causes transitions between states?

**How to explore:**

- Read CLAUDE.md and any existing documentation first
- Search for enums, sealed classes, and state machines to find lifecycles
- Look at API endpoints and use cases to understand user capabilities
- Find configuration classes and options
- Identify validation rules and business constraints

**Output:**

Create a feature inventory organised by category. For each feature, note:
- What it does (user perspective)
- Why it matters (business value)
- Key behaviours to document

Present this inventory to the user for confirmation before proceeding.

### Phase 2: Create Documentation User Stories

**REQUIRED**: Use the `writing-user-stories` skill to create user stories for each documentation section.

Write the user stories to `docs/plans/<yyyy-mmm-dd>-documentation-<relevant-slug>.md`.


### Phase 3: Document Each Feature

Work through the user stories file one at a time:

1. Read the next uncompleted user story from the plan
2. Explore the relevant code for that feature
3. Write the documentation following the format in the examples
4. Mark the user story checkbox as complete
5. Commit the documentation
6. Move to the next user story

**Do not skip ahead. Complete each user story before moving to the next.**

## Section Types

**Concept sections** - Explain what something is: overview paragraph, field tables, relationship diagrams, scenarios showing core behaviour. See [examples/concept-documentation.md](examples/concept-documentation.md).

**Process sections** - Explain how something works: flow diagram at start, numbered steps with scenarios, sequence diagram for interactions, complete example at end. See [examples/process-documentation.md](examples/process-documentation.md).

**Index files** - Structure the specification with table of contents grouped by category, how to read section, and target audience. See [examples/index-file.md](examples/index-file.md).

## Checklist

Phase 0 - Preparation:
- [ ] Read examples/formatting-reference.md
- [ ] Read examples/concept-documentation.md
- [ ] Read examples/process-documentation.md
- [ ] Read examples/index-file.md

Phase 1 - Feature Discovery:
- [ ] Read CLAUDE.md and existing documentation
- [ ] Identified all product capabilities (what users can do)
- [ ] Mapped user workflows and journeys
- [ ] Listed core concepts and how they relate
- [ ] Noted configuration options and business rules
- [ ] Identified lifecycles and state transitions
- [ ] Created feature inventory organised by category
- [ ] Confirmed feature inventory with user

Phase 2 - Planning:
- [ ] Created user stories using writing-user-stories skill
- [ ] User stories saved to docs/plans/
- [ ] Each documentation section has a user story

Phase 3 - Documentation:
- [ ] Working through user stories one at a time
- [ ] Each document has navigation links
- [ ] Each document has introductory paragraph
- [ ] Used numbered subsections (N.1, N.2, etc.)
- [ ] Added scenarios for each distinct behaviour
- [ ] Used tables for configuration and fields
- [ ] Included diagrams for complex flows
- [ ] Used concrete values in examples
- [ ] Marked user story complete after each section
- [ ] Committed each documentation file
