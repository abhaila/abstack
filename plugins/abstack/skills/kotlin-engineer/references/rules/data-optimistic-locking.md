---
title: Use Optimistic Concurrency Control
impact: HIGH
impactDescription: prevents lost updates, ensures data integrity
tags: data-consistency, concurrency, locking
---

## Use Optimistic Concurrency Control

**Impact: HIGH (prevents lost updates, ensures data integrity)**

Critical data must be protected from concurrent writers. Use a version number on protected objects and fail updates when the version doesn't match.

**Incorrect (race condition):**

```kotlin
fun updateBalance(accountId: AccountId, amount: Money) {
    // Thread 1 reads balance = 100
    // Thread 2 reads balance = 100
    val account = repository.findById(accountId)

    // Both threads calculate new balance
    // Thread 1: 100 + 50 = 150
    // Thread 2: 100 - 30 = 70
    val newBalance = account.balance + amount

    // Thread 1 saves 150
    // Thread 2 saves 70 (overwrites Thread 1's update!)
    repository.save(account.copy(balance = newBalance))
    // Final balance: 70, but should be 120
}
```

**Correct (optimistic locking):**

```kotlin
data class Account(
    val id: AccountId,
    val balance: Money,
    val version: Long  // Optimistic lock version
)

fun updateBalance(accountId: AccountId, amount: Money): Result<Account, Exception> {
    val account = repository.findById(accountId)
        ?: return Failure(AccountError.NotFound(accountId))

    val newBalance = account.balance + amount
    val updated = account.copy(balance = newBalance, version = account.version + 1)

    // UPDATE accounts SET balance = ?, version = ?
    // WHERE id = ? AND version = ?
    val rowsUpdated = repository.updateWithVersion(updated, account.version)

    if (rowsUpdated == 0) {
        // Another thread modified the record
        return Failure(AccountError.ConcurrentModification(accountId))
    }

    return Success(updated)
}
```

**With Exposed:**

```kotlin
class AccountsTable : Table("accounts") {
    val id = uuid("id")
    val balance = decimal("balance", 12, 2)
    val version = long("version")

    override val primaryKey = PrimaryKey(id)
}

fun updateWithVersion(account: Account, expectedVersion: Long): Int {
    return accountsTable.update(
        where = {
            (accountsTable.id eq account.id.value) and
            (accountsTable.version eq expectedVersion)
        }
    ) {
        it[balance] = account.balance.amount
        it[version] = account.version
    }
}
```

**Retry with backoff:**

```kotlin
fun updateBalanceWithRetry(
    accountId: AccountId,
    amount: Money,
    maxRetries: Int = 3
): Result<Account, Exception> {
    repeat(maxRetries) { attempt ->
        val result = updateBalance(accountId, amount)
        when (result) {
            is Success -> return result
            is Failure -> {
                if (result.reason !is AccountError.ConcurrentModification) {
                    return result
                }
                // Concurrent modification - retry
                if (attempt < maxRetries - 1) {
                    Thread.sleep((attempt + 1) * 100L) // Backoff
                }
            }
        }
    }
    return Failure(AccountError.ConcurrentModification(accountId))
}
```

Use optimistic locking for: financial data, inventory counts, sequence numbers, any data where lost updates cause corruption.
