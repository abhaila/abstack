---
title: Ensure Idempotent Operations
impact: CRITICAL
impactDescription: prevents duplicate processing, enables safe retries
tags: data-consistency, idempotency, distributed-systems
---

## Ensure Idempotent Operations

**Impact: CRITICAL (prevents duplicate processing, enables safe retries)**

In distributed systems, operations will be retried. Every HTTP endpoint, event handler, and background task must be idempotent - executing the same operation multiple times produces the same result.

**Incorrect (non-idempotent):**

```kotlin
suspend fun markInvoiceAsSent(
    sequenceAccountId: SequenceAccountId,
    invoiceId: InvoiceId,
): Result4k<Invoice, Exception> {
    // If this is retried after the first success, it will fail validation!
    val invoice = invoiceValidator
        .validateForSending(sequenceAccountId, invoiceId)
        .orThrow()

    val sentInvoice = invoice.asSent()
    return persistenceService.save(sentInvoice)
}
```

**Correct (idempotent with short-circuit):**

```kotlin
suspend fun markInvoiceAsSent(
    sequenceAccountId: SequenceAccountId,
    invoiceId: InvoiceId,
): Result4k<Invoice, Exception> {
    return transactor.suspendTransaction(Connection.TRANSACTION_REPEATABLE_READ) {
        invoiceRepository.lockOnSuspend(invoiceId) {
            resultFrom {
                val invoice = invoiceValidator
                    .validateForSending(sequenceAccountId, invoiceId)
                    .orThrow()

                // Short-circuit for idempotency if invoice already sent
                if (invoice.status == InvoiceStatus.SENT) {
                    return@lockOnSuspend Success(invoice)
                }

                val sentInvoice = invoice
                    .asSent()
                    .withDunningStatus(InvoiceDunningStatus.NOT_REQUIRED)

                persistenceService.save(sentInvoice).orThrow()
            }
        }
    }
}
```

### Idempotency Patterns

**1. Status check with short-circuit:**

```kotlin
// Check current state before performing action
if (invoice.status == InvoiceStatus.SENT) {
    return Success(invoice) // Already in desired state
}

// Check for already finalised before finalising
val isAlreadySent = when (finalizeInvoiceResult) {
    is FinalizeInvoiceResult.AlreadyFinalized ->
        finalizeInvoiceResult.invoice.status == InvoiceStatus.SENT
    is FinalizeInvoiceResult.NewlyFinalized -> false
}
```

**2. Idempotency state tracking with namespace:**

```kotlin
interface NotificationIdempotencyStateRepository {
    enum class Namespace {
        QUOTE_SIGNED_BY_CUSTOMER_EMAIL,
        QUOTE_SIGNED_BY_COUNTERSIGNER_EMAIL,
        QUOTE_REMINDER_CUSTOMER,
        QUOTE_REMINDER_COUNTER_SIGNER,
        QUOTE_READY_TO_SIGN,
    }

    enum class State {
        PENDING,
        SENT,
    }

    @ConsistentCopyVisibility
    data class Query private constructor(
        val namespace: Namespace,
        val uniqueInstanceKey: UniqueInstanceKey,
    ) {
        companion object {
            fun byNamespaceAndKey(namespace: Namespace, key: UniqueInstanceKey) =
                Query(namespace = namespace, uniqueInstanceKey = key)
        }
    }

    fun save(record: NotificationIdempotencyStateRecord): Result4k<NotificationIdempotencyStateRecord, Exception>
    fun find(query: Query): Result4k<NotificationIdempotencyStateRecord?, Exception>
}
```

**3. Unique instance key generation:**

```kotlin
// Combine identifiers to create unique key
val uniqueInstanceKey = quoteVariantId.toString() + signerId.toString()

// For complex cases, hash to ensure length constraints
fun generateSafeUniqueKey(
    quoteVariantId: QuoteVariantId,
    participantId: String,
    allSignerIds: String
): String {
    val uniqueKeyContent = quoteVariantId.toString() + participantId + allSignerIds

    val contentHash = MessageDigest.getInstance("SHA-256")
        .digest(uniqueKeyContent.toByteArray(Charsets.UTF_8))
        .joinToString("") { "%02x".format(it) }
        .take(117) // Leave room for suffix

    return "${contentHash}_${quoteVariantId.toString().takeLast(8)}_p"
}
```

**4. Pessimistic locking for critical operations:**

```kotlin
suspend fun markInvoiceAsSent(invoiceId: InvoiceId): Result4k<Invoice, Exception> {
    return transactor.suspendTransaction(Connection.TRANSACTION_REPEATABLE_READ) {
        invoiceRepository.lockOnSuspend(invoiceId) {
            // Operations inside lock are serialised
            // Check state, then modify
        }
    }
}
```

**5. Optimistic concurrency control with version numbers:**

Optimistic concurrency control assumes conflicts are rare and detects them at write time using version numbers. This avoids the performance overhead of pessimistic locking.

**Domain object with version tracking:**

```kotlin
data class InvoiceEmailStateRecord(
    val invoiceId: InvoiceId,
    val state: State,
    val version: Long,
) {
    fun asSent() = increment().copy(state = State.SENT)
    fun asUnsent() = increment().copy(state = State.UNSENT)
    fun increment() = copy(version = version + 1)

    enum class State {
        UNSENT,
        SENT;
    }

    companion object {
        fun unsent(invoiceId: InvoiceId) = InvoiceEmailStateRecord(
            invoiceId = invoiceId,
            state = State.UNSENT,
            version = 0L
        )
    }
}
```

**Version-checked save with upsert:**

```kotlin
override fun save(
    state: InvoiceEmailStateRecord
): Result4k<InvoiceEmailStateRecord, Exception> {
    return resultFrom {
        transactor.blockingTransactionNonResult {
            table.upsertReturning(
                table.invoiceId,
                where = { table.version.less(state.version) },
            ) {
                it[table.invoiceId] = state.invoiceId.value
                it[table.state] = state.state
                it[table.version] = state.version
                it[table.updatedAt] = clock.now().toInstant()
            }.firstOrNull()
        }
            ?.let { resultRow -> deserialise(resultRow) }
            ?: throw OptimisticConcurrencyException(
                "Failed to save state of invoice email. " +
                "It may have been modified concurrently. Tried version: ${state.version}."
            )
    }
}
```

**How conflicts are detected:**

```
// Successful sequential updates:
1. Initial insert: version = 0, state = UNSENT
2. First update:   version = 1, state = SENT   (WHERE version < 1) ✓
3. Second update:  version = 2, state = UNSENT (WHERE version < 2) ✓

// Concurrent conflict detected:
1. Process A: Inserts with version = 0, state = UNSENT
2. Process B: Attempts update with version = 0, state = SENT
   → FAILS: WHERE version < 0 is false (current version is already 0)
   → Throws OptimisticConcurrencyException
```

**Handling soft deletes:**

If your table uses soft deletes, exclude `deletedAt` from updates to prevent accidental undeletes:

```kotlin
table.upsertReturning(
    table.id,
    onUpdateExclude = listOf(table.deletedAt),
    where = { table.version.less(state.version) }
) {
    // ...
}
```

**When to use optimistic vs pessimistic locking:**

- **Optimistic**: When conflicts are rare but must be detected (high read, low write)
- **Pessimistic**: When conflicts are frequent or operations cannot be retried (sequences, critical state transitions)

Ask yourself: "What happens if this executes twice?" If the answer is "bad things" - add idempotency checks.
