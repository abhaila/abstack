---
title: Use Factory Methods for Domain Object Creation
impact: HIGH
impactDescription: provides clear creation semantics, encapsulates defaults
tags: domain, constructor, factory
---

## Use Factory Methods for Domain Object Creation

**Impact: HIGH (provides clear creation semantics, encapsulates defaults)**

Provide factory methods in companion objects to handle ID generation, timestamps, and default values. Constructors remain public for flexibility - factory methods are conveniences, not enforcement mechanisms.

**Value Object IDs:**

```kotlin
data class CustomerId(
    @get:JsonValue override val value: UUID
) : ComparableValue<CustomerId, UUID> {
    constructor(id: String) : this(UUID.fromString(id))

    override fun toString(): String = value.toString()

    companion object {
        fun newId(): CustomerId = CustomerId(Uuids.uuidV7())
    }
}
```

**Domain Entities:**

Provide `create()` for new instances. Keep the primary constructor public for use by repositories and tests:

```kotlin
data class QuoteViewTracking(
    val id: QuoteViewTrackingId,
    val quoteId: QuoteId,
    val sequenceAccountId: SequenceAccountId,
    val visitorIdentifier: String,
    val ipAddress: String,
    val loginType: LoginType,
    val viewedAt: Instant
) {
    companion object {
        fun create(
            quoteId: QuoteId,
            sequenceAccountId: SequenceAccountId,
            visitorIdentifier: String,
            ipAddress: String,
            loginType: LoginType
        ): QuoteViewTracking {
            return QuoteViewTracking(
                id = QuoteViewTrackingId.newId(),
                quoteId = quoteId,
                sequenceAccountId = sequenceAccountId,
                visitorIdentifier = visitorIdentifier,
                ipAddress = ipAddress,
                loginType = loginType,
                viewedAt = Instant.now()
            )
        }
    }
}
```

**Reconstruction from storage belongs in repositories:**

Repositories convert DTOs to domain objects. The domain object doesn't need a `fromDatabase()` method - the repository handles this internally:

```kotlin
// Repository handles reconstruction - domain object stays clean
class QuoteViewTrackingRepository(private val database: Database) {
    fun findById(id: QuoteViewTrackingId): QuoteViewTracking? {
        val dto = database.transaction {
            QuoteViewTrackingTable.selectAll()
                .where { QuoteViewTrackingTable.id eq id.value }
                .singleOrNull()
                ?.toDto()
        } ?: return null

        return QuoteViewTracking(
            id = QuoteViewTrackingId(dto.id),
            quoteId = QuoteId(dto.quoteId),
            sequenceAccountId = SequenceAccountId(dto.sequenceAccountId),
            visitorIdentifier = dto.visitorIdentifier,
            ipAddress = dto.ipAddress,
            loginType = LoginType.valueOf(dto.loginType),
            viewedAt = dto.viewedAt
        )
    }
}
```

**Factory method conventions:**

- `newId()` - Generate a new ID for value objects
- `create()` - Create new domain entity with generated ID and timestamps

**When to use Result-returning factories:**

For values that require validation (emails, phone numbers, etc.), use Result-returning factory methods:

```kotlin
data class EmailAddress(val value: String) {
    companion object {
        fun create(email: String): Result<EmailAddress, Exception> {
            val trimmedEmail = email.trim().lowercase()
            return resultFrom {
                require(trimmedEmail.contains("@")) { "Email must contain @" }
                EmailAddress(trimmedEmail)
            }.mapFailure { ValidationError("Invalid email: ${it.message}") }
        }
    }
}
```

Factory methods centralise creation logic - generating IDs, setting timestamps, applying defaults, and optionally validating. Reconstruction from storage is the repository's responsibility, keeping domain objects focused on business logic.
