---
title: Use In-Memory Repository Test Doubles
impact: MEDIUM
impactDescription: enables fast unit tests, avoids database overhead
tags: testing, repositories, test-doubles, in-memory
---

## Use In-Memory Repository Test Doubles

**Impact: MEDIUM (enables fast unit tests, avoids database overhead)**

Use cases orchestrate domain operations and coordinate with repositories and service classes. To test them fast without databases, create simple in-memory implementations of repository interfaces.

**Repository interface (in domain layer):**

```kotlin
interface InvoiceRepository {
    fun findById(id: InvoiceId): Result<Invoice, Exception>
    fun save(invoice: Invoice): Result<Invoice, Exception>
}
```

**In-memory test double (in test code):**

```kotlin
class InMemoryInvoiceRepository : InvoiceRepository {
    private val invoices = mutableMapOf<InvoiceId, Invoice>()

    override fun findById(id: InvoiceId): Result<Invoice, Exception> {
        return invoices[id]?.let { Success(it) }
            ?: Failure(InvoiceError.NotFound(id))
    }

    override fun save(invoice: Invoice): Result<Invoice, Exception> {
        invoices[invoice.id] = invoice
        return Success(invoice)
    }

    fun seed(vararg invoices: Invoice) {
        invoices.forEach { this.invoices[it.id] = it }
    }

    fun clear() {
        invoices.clear()
    }
}
```

**In-memory event publisher:**

```kotlin
class InMemoryPublisher : EventPublisher {
    private val events = mutableListOf<Any>()

    override fun publish(event: Any) {
        events.add(event)
    }

    fun getPublishedEvents(): List<Any> = events.toList()

    fun clear() {
        events.clear()
    }
}
```

**Testing use cases with in-memory doubles:**

```kotlin
class FinalizeInvoiceUseCaseTest {

    @Test
    fun `should finalize invoice and publish event`() = scenario {
        val invoice = Gen.invoice().withStatus(InvoiceStatus.DRAFT)
        repository.seed(invoice)

        val result = useCase.execute(invoice.id).orThrow()

        // Verify the invoice was saved with updated status
        val saved = repository.findById(invoice.id).orThrow()
        assertEquals(InvoiceStatus.FINAL, saved.status)

        // Verify event was published
        val publishedEvents = eventPublisher.getPublishedEvents()
        assertTrue(publishedEvents.any { it is InvoiceFinalized && it.invoice.id == invoice.id })
    }

    @Test
    fun `should fail when invoice not found`() = scenario {
        val result = assertThrows<Repository.NotFound> {
            useCase.execute(fabricate<InvoiceId>()).orThrow()
        }

        val publishedEvents = eventPublisher.getPublishedEvents()
        assertTrue(publishedEvents.isEmpty())
    }
}
```

**Key points:**

The in-memory repository is simple - just a map storing invoices. But it's enough to test the use case logic without database overhead. The test runs in milliseconds and gives confidence that the use case correctly orchestrates the domain operation and side effects.

Also stub the `EventPublisher`. Verify it's called correctly but don't test the actual event infrastructure here because that's an integration test concern.

**CRITICAL: Contract Tests Required**

Every in-memory double MUST have contract tests that both the fake and real implementation pass. See [Contract Tests](test-contract-tests.md) for the pattern. Without contract tests, fakes drift from production behaviour, causing tests to pass while production fails.
