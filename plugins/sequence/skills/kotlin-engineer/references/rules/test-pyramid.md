---
title: Follow the Testing Pyramid
impact: MEDIUM
impactDescription: balances speed and confidence, prevents inverted pyramid anti-pattern
tags: testing, pyramid, unit, integration
---

## Follow the Testing Pyramid

**Impact: MEDIUM (balances speed and confidence, prevents inverted pyramid anti-pattern)**

The testing pyramid guides how to distribute testing effort. Wide at the bottom with many fast unit tests, narrower in the middle with fewer integration tests, and a small top with minimal end-to-end tests.

**Distribution:**

```
Unit Tests:        75-80%  (milliseconds)
Integration Tests: 15-25%  (seconds)
Contract Tests:    5-10%   (seconds)
End-to-End Tests:  1-5%    (minutes)
```

**Unit tests (the foundation):**

Unit tests verify a single unit of behaviour without depending on external systems.

```kotlin
// Unit tests cover:
// - Domain entities and aggregates
// - Value objects
// - Use cases (with in-memory doubles)
// - Domain services
// - Calculations and algorithms
// - Validation logic

@Test
fun `should calculate invoice total from line items`() {
    val lineItems = listOf(
        Gen.lineItem().withAmount(BigDecimal("100.00")),
        Gen.lineItem().withAmount(BigDecimal("50.00"))
    )

    val invoice = Gen.invoice().withLineItems(lineItems)

    assertEquals(BigDecimal("150.00"), invoice.total)
}
```

Unit tests should:
- Run in milliseconds
- Have no external dependencies (no database, no network, no file system)
- Use in-memory test doubles for repositories and external services
- Test all edge cases and error conditions
- Use real domain objects, not mocks of domain logic
- Assert on observable behaviour, not internal state

**Integration tests (the middle):**

Integration tests verify components work correctly with real infrastructure.

```kotlin
// Integration tests cover:
// - Database repositories (queries, transactions, persistence)
// - HTTP endpoints (request/response handling, API contracts)
// - Message handlers (event processing with real infrastructure)

@Test
fun `should persist and retrieve invoice from database`() {
    val invoice = Gen.invoice()

    repository.save(invoice).orThrow()
    val retrieved = repository.findById(invoice.id).orThrow()

    assertEquals(invoice.total, retrieved.total)
}
```

Integration tests should NOT:
- Re-test business logic already covered by unit tests
- Test every permutation of business rules through the API
- Become a replacement for unit tests because "it's easier to set up"

**The inverted pyramid anti-pattern:**

Avoid having many slow end-to-end and integration tests with few fast unit tests.

Problems compound quickly:
- Tests are slow, so developers stop running them locally
- Tests are brittle because they depend on complex infrastructure setup
- Debugging failures is hard because tests go through many layers
- Adding new test cases is slow because each test has high setup cost

Fight this anti-pattern by making unit tests easy to write with good in-memory test double patterns.
