---
title: Use TestTransactor for Unit Tests
impact: MEDIUM
impactDescription: avoids real database transactions in unit tests
tags: testing, transactions, transactor, unit-tests
---

## Use TestTransactor for Unit Tests

**Impact: MEDIUM (avoids real database transactions in unit tests)**

For code that requires transactions, use `TestTransactor` in unit tests to avoid creating real database transactions. This allows use cases to use transaction code paths without actually creating database transactions.

**Production transactor interface:**

```kotlin
interface Transactor {
    fun <T> transaction(block: () -> T): T
}
```

**Test transactor implementation:**

```kotlin
object TestTransactor : Transactor {
    override fun <T> transaction(block: () -> T): T = block()
}
```

**Use case with transactor:**

```kotlin
class CreateInvoiceUseCase(
    private val repository: InvoiceRepository,
    private val transactor: Transactor
) {
    fun execute(command: CreateInvoiceCommand): Result<Invoice, Exception> {
        return transactor.transaction {
            val invoice = Invoice.create(command).orThrow()
            repository.save(invoice)
        }
    }
}
```

**Testing with TestTransactor:**

```kotlin
class CreateInvoiceUseCaseTest {
    private val repository = InMemoryInvoiceRepository()
    private val transactor = TestTransactor

    private val useCase get() = CreateInvoiceUseCase(
        repository,
        transactor
    )

    @Test
    fun `should create invoice within transaction`() {
        val command = CreateInvoiceCommand(
            customerId = fabricate(),
            lineItems = listOf(Gen.lineItem())
        )

        val result = useCase.execute(command).orThrow()

        assertNotNull(result)
        val saved = repository.findById(result.id).orThrow()
        assertEquals(command.customerId, saved.customerId)
    }
}
```

**Key points:**

`TestTransactor` simply executes the block directly without any transaction wrapping. This allows unit tests to:
- Avoid database setup and teardown
- Run in milliseconds
- Test the transaction code path without real infrastructure

Integration tests should use real transactions to verify transactional behaviour.
