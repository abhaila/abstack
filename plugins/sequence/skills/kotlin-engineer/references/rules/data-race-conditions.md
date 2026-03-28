---
title: Prevent Read-Modify-Write Race Conditions
impact: CRITICAL
impactDescription: prevents data corruption, ensures consistency
tags: data-consistency, concurrency, race-condition, locking
---

## Prevent Read-Modify-Write Race Conditions

**Impact: CRITICAL (prevents data corruption, ensures consistency)**

Read-modify-write sequences without proper locking allow concurrent threads to corrupt data. Use pessimistic locking (SELECT FOR UPDATE) or atomic operations.

**Incorrect (race condition):**

```kotlin
fun getNextSequenceNumber(ledgerId: LedgerId): Int {
    // Thread 1 reads: maxSeq = 5
    // Thread 2 reads: maxSeq = 5
    val maxSeq = repository.getMaxSequence(ledgerId)

    // Both threads calculate: nextSeq = 6
    val nextSeq = maxSeq + 1

    // Both threads create journal with sequence 6
    // DUPLICATE SEQUENCE NUMBERS!
    return nextSeq
}
```

**Correct (pessimistic locking):**

```kotlin
fun getNextSequenceNumber(ledgerId: LedgerId): Int {
    return database.transaction {
        // SELECT ... FOR UPDATE locks the rows
        val maxSeq = repository.getMaxSequenceForUpdate(ledgerId)
        maxSeq + 1
    }
}

// In repository
fun getMaxSequenceForUpdate(ledgerId: LedgerId): Int {
    return journalsTable
        .slice(journalsTable.sequence.max())
        .select { journalsTable.ledgerId eq ledgerId.value }
        .forUpdate()  // Key: locks the rows until transaction commits
        .map { it[journalsTable.sequence.max()] }
        .firstOrNull() ?: 0
}
```

**Alternative: Atomic increment:**

```kotlin
fun getNextSequenceNumber(ledgerId: LedgerId): Int {
    // UPDATE ledger_sequences SET next_seq = next_seq + 1
    // WHERE ledger_id = ? RETURNING next_seq
    return database.transaction {
        sequencesTable.update(
            where = { sequencesTable.ledgerId eq ledgerId.value }
        ) {
            it[nextSeq] = nextSeq + 1
        }
        sequencesTable
            .select { sequencesTable.ledgerId eq ledgerId.value }
            .single()[sequencesTable.nextSeq]
    }
}
```

**Alternative: Unique constraint with retry:**

```kotlin
fun createJournalEntry(ledgerId: LedgerId, data: JournalData): Result<Journal, Exception> {
    repeat(3) { attempt ->
        val nextSeq = repository.getMaxSequence(ledgerId) + 1
        val journal = Journal(ledgerId, nextSeq, data)

        try {
            // Unique constraint on (ledger_id, sequence) catches duplicates
            repository.insert(journal)
            return Success(journal)
        } catch (e: UniqueConstraintViolation) {
            // Another thread got this sequence, retry
            if (attempt == 2) {
                return Failure(JournalError.ConcurrentCreation())
            }
        }
    }
    return Failure(JournalError.ConcurrentCreation)
}
```

Common patterns that need protection:
- Sequence number generation
- Inventory decrement
- Balance updates
- Counter increments
- Slot allocation

Ask: "What if two threads execute this simultaneously?" If they can corrupt data, add locking.
