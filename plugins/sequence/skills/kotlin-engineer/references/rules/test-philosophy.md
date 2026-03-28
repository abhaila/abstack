---
title: Understand the Testing Philosophy
impact: MEDIUM
impactDescription: enables fearless refactoring, catches real bugs
tags: testing, philosophy, fundamentals
---

## Understand the Testing Philosophy

**Impact: MEDIUM (enables fearless refactoring, catches real bugs)**

Tests are the foundation of our ability to move fast with confidence. A slow, brittle test suite becomes a burden that slows development. A fast, comprehensive test suite that tests behaviour rather than implementation details becomes a superpower.

**Tests enable refactoring:**

The primary value of tests is enabling fearless refactoring. When you want to improve internal structure, clean up a messy function, or reorganise packages, good tests give you confidence that you haven't changed the behaviour.

```kotlin
// Tests that assert against mocks, verify call counts, or depend on private state
// become obstacles to refactoring rather than enablers

// BAD: Tests implementation details
@Test
fun `should call repository save method`() {
    val repository = mock<InvoiceRepository>()
    val service = InvoiceService(repository)

    service.createInvoice(request)

    verify(repository, times(1)).save(any())  // Breaks if internals change
}

// GOOD: Tests observable behaviour
@Test
fun `should persist invoice when created`() {
    val repository = InMemoryInvoiceRepository()
    val service = InvoiceService(repository)

    val result = service.createInvoice(request).orThrow()

    val saved = repository.findById(result.id).orThrow()
    assertEquals(request.total, saved.total)  // Verifies outcome, not implementation
}
```

**Tests must be fast:**

Slow tests kill the feedback loop. If running tests takes minutes, developers stop running them locally.

Speed comes from isolation:
- Unit tests don't touch databases, file systems, or networks
- Unit tests use in-memory test doubles for dependencies
- Unit tests construct objects directly rather than through framework initialisation
- Integration tests are carefully scoped to test only what needs integration

**Tests should be comprehensive:**

Fast tests are worthless if they don't catch bugs. Comprehensive coverage includes:
- Edge cases
- Error conditions
- Boundary values
- State-dependent behaviour

**Test code is production code:**

Test code deserves the same care as production code:
- Clear naming
- No duplication
- Good abstraction
- Readable structure

Invest in test infrastructure (builders, fixtures, utilities) that make creating test scenarios fast and expressive.
