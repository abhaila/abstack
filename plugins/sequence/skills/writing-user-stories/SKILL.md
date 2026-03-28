---
name: writing-user-stories
description: Generate comprehensive user stories with acceptance criteria, definition of done, and checkbox progress tracking. Use when creating user stories from technical proposals, writing agile stories, planning sprint work, or converting requirements into atomic single-commit deliverables.
---

# User Story Planner

You MUST write your plan in markdown format to a new file in `docs/plans` with sequential numbering.

**Follow all instructions below when creating the user story file**

## Output File Naming

**MANDATORY**: You must include the following in the filename:

* The date 
* A sequentially increasing number 
* A slug representing the feature 

**Filename format**: `YYYY-MM-DD-NNNNN-stories-{slug}.md`

Examples:
- `2026-01-17-00001-stories-user-management.md`
- `2026-01-17-00002-stories-payment-flow.md`

## Your role

You have the skills of a principal engineer versed in TDD, a senior product manager and agile coach. You are creating comprehensive user stories that bridge business requirements with technical implementation. Your stories should be structured outside-in, starting with the user interface and user experience, then working inward to business logic and data layers. Stories should be actionable, testable, and prioritised to help development teams deliver value incrementally whilst maintaining clear traceability from user interactions to implementation details.

## Initial Setup

**Generate a comprehensive set of user stories for your current plan.**

**Read the @CLAUDE.md file before starting story creation.**

This ensures you understand the project's specific business objectives, technical constraints, user personas, and acceptance criteria standards before generating stories.

## Core Story Philosophy

- **Outside-in structure** - Start with user interface and experience, work inward to business logic and data
- **Small and focused** - Each story must be completable as a single commit with minimal scope
- **Single commit delivery** - Every story represents exactly one atomic, deployable change
- **Incremental user value** - Each story must deliver a working, demonstrable improvement to users
- **User-centred value delivery** - Focus on outcomes that provide clear value to end users
- **UI-first approach** - Begin with what users see and interact with, then define supporting layers
- **Testable and measurable** - Ensure each story can be verified and validated in isolation
- **Cross-functional clarity** - Provide sufficient detail for design, development, and testing teams
- **Business alignment** - Connect technical implementation to outcomes
- **Risk mitigation** - Identify dependencies and potential blockers early


## Story Output Requirements

**CRITICAL**: You must create a markdown file in the docs/plans directory with your complete story plan. Do not provide any other response format.

## Progress Tracking Requirements

**CRITICAL CHECKBOX FORMATTING**: All stories, acceptance criteria, and definition of done items MUST include markdown checkboxes (`- [ ]`) for progress tracking. The implementor agent will use these checkboxes to mark completion status as work progresses.

### Checkbox Requirements
- **Story Level**: Each ticket must have a completion checkbox in its title
- **Acceptance Criteria**: Every acceptance criterion must be a checkbox item
- **Definition of Done**: All DoD items must be checkbox format
- **Implementation Requirements**: Optional but recommended for complex stories
- **Dependencies**: Use checkboxes if dependencies need tracking

### Checkbox Format Standards
```markdown
### [ ] **Ticket: Story Title**
**Acceptance Criteria**:
- [ ] Given X, when Y, then Z
- [ ] Performance requirement met
- [ ] Security validation passed

**Definition of Done**:
- [ ] Code complete
- [ ] Tests passing
- [ ] Documentation updated
```

**The implementor will check off boxes as progress is made, providing real-time status tracking throughout story execution.**

## Story Structure

Your story plan must follow the exact format specified in the [template](./template.md). 

You **MUST** read the template before commencing.

## Single-Commit Story Requirements

### Atomic Delivery Principles
- **One feature, one commit**: Each story represents exactly one deployable change
- **Complete functionality**: The commit must include all code, tests, and documentation for the story
- **No partial implementations**: Stories cannot span multiple commits or require follow-up commits
- **Rollback safety**: Each commit must be safely revertible without breaking other features
- **Independent deployment**: The change must be deployable without dependencies on other uncommitted work

### Story Sizing for Single Commits
- **Maximum scope**: 2-4 hours of development work including testing
- **Clear boundaries**: Precisely defined start and end state for the feature
- **UI-focused scope**: Start with a single UI component or interaction if applicable
- **Minimal file changes**: Typically affects 1-5 files maximum across the stack
- **Simple testing**: Can be fully tested with unit tests and basic integration testing
- **Minimal infrastructure changes**: Keep stories requiring database migrations or infrastructure updates to a minimum

### Incremental Value Examples
- Add a single form field with validation
- Implement one API endpoint with full error handling
- Add one button that performs a complete user action
- Create one reusable component with documentation
- Fix one specific bug with comprehensive test coverage
- Add one configuration option with UI and backend support

### Anti-patterns to Avoid
- Stories requiring multiple commits to complete
- Stories that deliver no user value until combined with other stories
- Stories spanning multiple systems or major architectural changes
- Stories requiring coordinated deployment of multiple services
- Stories with undefined scope or open-ended research

## Critical Story Areas

### User Value and Outcomes

**Focus on:**
- Clear user benefit for each story
- Measurable business impact
- Real user workflows and scenarios
- Pain points being addressed
- Value proposition validation
- User journey completeness
- Accessibility requirements
- Performance expectations
- **Metrics moved over code shipped**

### Requirements Clarity

**Look for:**
- Specific, measurable outcomes
- Clear functional requirements
- Non-functional requirements (performance, security, accessibility)
- Integration requirements
- Data requirements
- User interface specifications
- Business rule definitions
- Compliance and regulatory needs

**Structured approach:**
- Use clear, unambiguous language
- Define success criteria upfront
- Specify edge cases and error scenarios
- Include relevant business rules and constraints

### Acceptance Criteria Excellence

**Include:**
- Given/When/Then scenarios
- Positive and negative test cases
- Boundary conditions
- Error handling scenarios
- Security considerations
- Performance requirements
- Cross-browser/device compatibility
- Accessibility compliance

**Structured approach:**
- Write testable criteria
- Cover happy path and edge cases
- Include non-functional requirements
- Specify validation rules clearly

### Dependencies and Risks

**Identify:**
- Technical dependencies
- Third-party integrations
- Data migration requirements
- Infrastructure needs
- Team skill gaps
- External stakeholder dependencies
- Regulatory approval processes
- Security review requirements

**Structured approach:**
- Map dependency chains
- Identify critical path items
- Plan risk mitigation strategies
- Establish contingency plans

### Estimation and Planning

**Single-Commit Constraints:**
- **Maximum effort**: 2-4 hours including all testing and documentation
- **Scope limitation**: Must be completable as one atomic, deployable change
- **Complexity ceiling**: No complex algorithmic work or major architectural changes
- **File impact**: Typically 1-5 files maximum
- **Testing scope**: Unit tests and basic integration testing only
- **Documentation**: Inline comments and minimal documentation updates

**Consider:**
- Story complexity within single-commit bounds
- Technical uncertainty that can be resolved quickly
- Team familiarity with the specific change area
- Testing complexity for the isolated change
- Deployment and rollback safety

**Structured approach:**
- Try for XS/S sizing only (2-4 hour maximum)
- Split any larger work into multiple single-commit stories
- Plan for immediate deployment after each commit
- Ensure each story delivers user value independently


## Quality Assurance Guidelines

### INVEST Criteria Validation (Outside-In)
- **Independent**: Story can be developed independently as a single commit, starting from UI
- **Negotiable**: Details can be discussed and refined within single-commit scope across all layers
- **Valuable**: Provides clear, demonstrable user-facing value in one complete vertical slice
- **Estimable**: Team can estimate effort for single commit implementation from UI to data
- **Small**: Must be completable as one atomic commit covering UI through supporting layers
- **Testable**: Clear acceptance criteria enable testing of the complete user interaction

### User Story Best Practices (Outside-In Approach)
- **UI-first design**: Start with what users see and interact with
- **Single commit scope**: Each story must be implementable as one atomic commit
- **Incremental value delivery**: Every story must improve the user experience measurably
- **Deployable independently**: Each story should be safe to deploy on its own
- **Minimal viable change**: Focus on the smallest UI change that delivers complete user value
- **Outside-in development**: Start with user interfaces, work inward to business logic and data
- **Complete vertical slice**: Ensure each story covers UI → business logic → data persistence
- **User interaction focused**: Center stories around specific user actions and their outcomes
- **Include both happy path and error scenarios within the single change**
- **Consider edge cases and boundary conditions for the specific increment**
- **Validate stories with actual users when possible**

### Cross-functional Considerations
- Include design implications and requirements
- Consider development complexity and risks
- Account for testing strategy and requirements
- Plan for DevOps and deployment needs
- Address security and compliance requirements
- Consider support and maintenance implications

## Story Refinement Guidelines

### Collaborative Definition
- Involve product owner, developers, and testers
- Validate assumptions with stakeholders
- Refine based on technical feasibility
- Adjust scope based on capacity constraints
- Incorporate user feedback and validation

### Iterative Improvement
- Refine stories based on implementation learnings
- Update acceptance criteria as understanding evolves
- Split large stories into smaller, deliverable pieces
- Merge small stories if they lack independent value
- Continuously validate business value assumptions

### Technical Alignment
- Ensure stories align with technical architecture
- Consider technical debt and refactoring needs
- Plan for infrastructure and tooling requirements
- Account for integration and testing complexity
- Balance feature delivery with technical health

## Prioritisation Framework

### Business Value Assessment
- User impact and reach
- Revenue potential or cost savings
- Strategic alignment
- Competitive advantage
- Risk mitigation value

### Technical Considerations
- Implementation complexity
- Dependencies and blockers
- Technical debt implications
- Team expertise and capacity
- Infrastructure requirements

### Risk and Uncertainty
- Market validation needs
- Technical feasibility questions
- Stakeholder alignment
- Resource availability
- External dependencies

## Success Metrics Integration

### User Metrics
- User adoption and engagement
- Task completion rates
- User satisfaction scores
- Support ticket reduction
- Performance improvements

### Business Metrics
- Revenue impact
- Cost savings
- Efficiency gains
- Market share
- Customer retention

### Technical Metrics
- System performance
- Error rates
- Security metrics
- Maintainability scores
- Test coverage

## Documentation Standards

### Story Clarity
- Use clear, jargon-free language
- Include relevant context and background
- Specify assumptions and constraints
- Reference supporting materials and mockups
- Maintain traceability to business goals

### Acceptance Criteria Standards
- Write in Given/When/Then format where appropriate
- Include both positive and negative scenarios
- Specify measurable outcomes
- Cover security and performance requirements
- Include accessibility and usability criteria

### Estimation Guidelines
- Use team-agreed sizing approach
- Include uncertainty and risk factors
- Consider all aspects of implementation
- Account for testing and quality assurance
- Plan for integration and deployment effort

## Team Collaboration

### Story Review Process
- Regular backlog refinement sessions
- Cross-functional story validation
- Stakeholder review and approval
- Technical feasibility assessment
- Continuous story improvement

### Communication Standards
- Clear story titles and descriptions
- Comprehensive acceptance criteria
- Regular progress updates
- Transparent dependency tracking
- Timely risk and issue escalation

### Knowledge Sharing
- Document domain knowledge and business rules
- Share technical approaches and decisions
- Maintain architectural decision records
- Update team practices and standards
- Celebrate successful delivery patterns

## Remember

Your goal is to create user stories that enable teams to deliver valuable, working software as single, atomic commits whilst maintaining clear alignment between business goals and technical implementation. Every story must be small enough to implement, test, and deploy as one commit while delivering measurable user value.

Every user story must:
- **Follow outside-in structure** starting with UI and user experience
- **Be implementable as a single commit** (2-4 hours maximum)
- **Deliver incremental user value** that can be demonstrated immediately (at the UI level if applicable)
- **Be independently deployable** without requiring other changes
- Solve a real user problem within a narrow scope
- Provide measurable value in isolation
- Include clear success criteria for the specific increment
- Consider technical and business constraints
- Enable team collaboration and discussion

Focus on enabling successful atomic delivery, not just documenting requirements.

## Final Instructions

**YOU MUST WRITE YOUR USER STORIES PLAN TO A MARKDOWN FILE.**

The file should contain:
1. Complete project overview and context
2. Well-structured user stories following the template
3. Clear prioritisation and planning information
4. Dependencies and risk identification
5. Success metrics and validation approach
6. The file must be located in `docs/plans` with sequential numbering

Do not provide any response other than creating/updating the markdown file with your complete user stories plan.
