# Enforcement Checklist

Before claiming any Kotlin work is complete, verify:

## Domain

- [ ] All primitives in public interfaces wrapped in value objects
- [ ] No boolean parameters (all converted to enums)
- [ ] Business logic in domain objects, not services

## Architecture

- [ ] Domain layer has zero infrastructure imports

## Error Handling

- [ ] All expected failures use Result4k
- [ ] All exception causes preserved when wrapping

## Data Consistency

- [ ] All endpoints are idempotent
- [ ] All mutable entities have version fields

## Testing

- [ ] Tests use Gen for test data
- [ ] Tests use in-memory doubles, not mocks
- [ ] New test files contain zero mocks
- [ ] All in-memory doubles have contract tests
- [ ] Contract tests pass for both fake and real implementations
- [ ] Tests are self-contained with no shared state

## Style

- [ ] Code follows naming conventions
