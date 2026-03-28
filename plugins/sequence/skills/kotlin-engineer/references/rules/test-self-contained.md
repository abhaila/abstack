---
title: Use Self-Contained Test Scenarios
impact: MEDIUM
impactDescription: eliminates hidden state, makes tests independent and readable
tags: testing, scenarios, isolation, state
---

## Use Self-Contained Test Scenarios

**Impact: MEDIUM (eliminates hidden state, makes tests independent and readable)**

Avoid `@BeforeEach` setup methods and shared test state. Instead, each test creates its own dependencies explicitly within the test body. This makes tests completely self-contained - when you read a test, you see exactly what it needs, with no hidden setup.

**Avoid shared state with @BeforeEach:**

```kotlin
// AVOID: Shared state with @BeforeEach
class InvoiceServiceTest {
    private lateinit var repository: InvoiceRepository
    private lateinit var eventPublisher: EventPublisher
    private lateinit var service: InvoiceService

    @BeforeEach
    fun setup() {
        repository = InMemoryInvoiceRepository()
        eventPublisher = InMemoryPublisher()
        service = InvoiceService(repository, eventPublisher)
    }

    @Test
    fun `test something`() {
        // What state does the repository have?
        // What was set up before this test?
        // Hard to understand without reading setup()
        val result = service.doSomething()
    }
}
```

**Prefer self-contained scenarios:**

```kotlin
// PREFER: Self-contained scenario with all dependencies explicit
class InvoiceServiceTest {
    @Test
    fun `should finalize invoice when valid`() = scenario {
        val result = service.finalize(invoice.id).orThrow()

        val saved = repository.findById(invoice.id).orThrow()
        assertEquals(InvoiceStatus.FINAL, saved.status)

        val events = eventPublisher.getPublishedEvents()
        assertTrue(events.any { it is InvoiceFinalized })
    }

    @Test
    fun `should fail when invoice not found`() = scenario {
        repository.clear()

        assertThrows<InvoiceError.NotFound> {
            service.finalize(fabricate<InvoiceId>()).orThrow()
        }

        assertTrue(eventPublisher.getPublishedEvents().isEmpty())
    }

    @Test
    fun `should fail when invoice already finalized`() = scenario {
        repository.clear()
        val finalizedInvoice = Gen.invoice().withStatus(InvoiceStatus.FINAL)
        repository.seed(finalizedInvoice)

        assertThrows<InvoiceError.AlreadyFinalized> {
            service.finalize(finalizedInvoice.id).orThrow()
        }
    }

    // Helper function that provides fresh test context for each test
    private fun scenario(block: InvoiceTestContext.() -> Unit) {
        val context = InvoiceTestContext()
        context.block()
    }

    private inner class InvoiceTestContext {
        // Fresh instances for each test - no shared state
        val repository = InMemoryInvoiceRepository()
        val eventPublisher = InMemoryPublisher()
        val service = InvoiceService(repository, eventPublisher)

        // Default test data - seeded into repository
        val invoice = Gen.invoice().withStatus(InvoiceStatus.DRAFT).also {
            repository.seed(it)
        }
    }
}
```

**Key points:**

This pattern makes each test completely independent. The `scenario` helper function creates a fresh `InvoiceTestContext` for each test with:
- Fresh repository, event publisher, and service instances
- A default draft invoice already seeded in the repository

Each test can use the default invoice directly or clear the repository and seed its own test data. There's no hidden state from `@BeforeEach`, no shared mutable repositories across tests. When you read a test, you see the scenario setup at the bottom of the test class and exactly what data each test uses.
