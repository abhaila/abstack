---
title: Test Externally Observable Behaviour
impact: MEDIUM
impactDescription: enables refactoring, tests survive implementation changes
tags: testing, behaviour, assertions, mocks
---

## Test Externally Observable Behaviour

**Impact: MEDIUM (enables refactoring, tests survive implementation changes)**

Of all testing advice, this is likely the most important. Tests should verify what a component does, not how it does it internally. This means asserting on return values and observable state changes - not on private fields, internal method calls, or interactions with dependencies.

**Bad: Testing internal implementation:**

```kotlin
@Test
fun `should call repository save method`() {
    val repository = mock<InvoiceRepository>()
    val service = InvoiceService(repository)

    service.createInvoice(request)

    // BAD: Testing HOW it works
    verify(repository, times(1)).save(any())
}
```

**Good: Testing externally observable behaviour:**

```kotlin
@Test
fun `should persist invoice when created`() {
    val repository = InMemoryInvoiceRepository()
    val service = InvoiceService(repository)

    val result = service.createInvoice(request).orThrow()

    // GOOD: Verify the observable outcome - invoice exists in repository
    val saved = repository.findById(result.id).orThrow()
    assertEquals(request.total, saved.total)
    assertEquals(InvoiceStatus.DRAFT, saved.status)
}
```

**Why this matters:**

When you test behaviour instead of implementation, you can refactor the internal implementation without breaking tests. If `InvoiceService` changes how it saves invoices internally, the second test still passes as long as the outcome is the same.

**Observable outcomes to assert on:**

```kotlin
// Return values
val result = service.createInvoice(request).orThrow()
assertEquals(expected, result)

// State changes in repositories
val saved = repository.findById(id).orThrow()
assertEquals(newStatus, saved.status)

// Published events
val events = eventPublisher.getPublishedEvents()
assertTrue(events.any { it is InvoiceCreated })

// Side effects through test doubles
val sentEmails = emailService.getSentEmails()
assertEquals(1, sentEmails.size)
```

**What NOT to assert on:**

```kotlin
// DON'T verify call counts on dependencies
verify(repository, times(1)).save(any())

// DON'T verify internal method calls
verify(service).validateInput(any())

// DON'T access private state
val privateField = service.javaClass.getDeclaredField("cache")
```

**Key points:**

Tests that verify behaviour from the outside enable fearless refactoring. When you want to improve internal structure, clean up a messy function, or reorganise classes, good tests give you confidence that you haven't changed the behaviour.
