---
title: Use Hexagonal Architecture
impact: CRITICAL
impactDescription: enables testability, prevents infrastructure coupling
tags: architecture, hexagonal, ports-adapters, ddd
---

## Use Hexagonal Architecture

**Impact: CRITICAL (enables testability, prevents infrastructure coupling)**

Separate core domain logic from infrastructure concerns using Hexagonal Architecture (Ports and Adapters). The domain has zero dependencies on specific technologies like databases, web frameworks, or third-party APIs.

**Incorrect (domain coupled to infrastructure):**

```kotlin
// Domain entity with database annotations
@Entity
@Table(name = "quote_view_tracking")
class QuoteViewTracking(
    @Id val id: UUID,
    @Column val quoteId: UUID,
    @Column val visitorIdentifier: String
) {
    fun isRecent(): Boolean {
        // Business logic mixed with JPA concerns
    }
}

// Use case directly uses HTTP client and EntityManager
class RecordQuoteViewUseCase(
    private val httpClient: OkHttpClient,
    private val entityManager: EntityManager
) {
    fun execute(request: RecordQuoteViewRequest) {
        // Directly coupled to OkHttp and JPA
    }
}
```

**Correct (hexagonal architecture):**

```kotlin
// domain/models/QuoteViewTracking.kt - Pure domain, no infrastructure
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

// domain/interfaces/QuoteViewTrackingRepository.kt - Repository interface (port)
interface QuoteViewTrackingRepository {
    fun save(quoteViewTracking: QuoteViewTracking): Result4k<QuoteViewTracking, Exception>
    fun totalViews(query: Query): Result4k<Int, Exception>
    fun uniqueViewers(query: Query): Result4k<List<QuoteViewTracking>, Exception>
    fun findMostRecentViewByVisitorIdentifier(visitorIdentifier: String, query: Query): Result4k<QuoteViewTracking?, Exception>

    @ConsistentCopyVisibility
    data class Query private constructor(
        val id: QuoteViewTrackingId? = null,
        val sequenceAccountId: SequenceAccountId? = null,
        val quoteId: QuoteId? = null
    ) {
        companion object {
            fun byQuoteId(quoteId: QuoteId, sequenceAccountId: SequenceAccountId) =
                Query(quoteId = quoteId, sequenceAccountId = sequenceAccountId)
        }
    }
}

// External service interface (port) - no implementation details
interface XeroClient {
    suspend fun createInvoice(request: CreateInvoiceRequest, sequenceAccountId: SequenceAccountId): Result<String, Exception>
    suspend fun getCustomer(id: String, sequenceAccountId: SequenceAccountId): Result<Customer, Exception>
    suspend fun getAllContacts(sequenceAccountId: SequenceAccountId, customersOnly: Boolean): Result<List<Customer>, Exception>
}

// application/RecordQuoteViewUseCase.kt - Orchestration
@Service
class RecordQuoteViewUseCaseImpl(
    private val quoteViewTrackingRepository: QuoteViewTrackingRepository,
    private val transactor: Transactor
) : RecordQuoteViewUseCase() {

    override suspend fun execute(request: RecordQuoteViewRequest): Result4k<Unit, Exception> {
        val query = QuoteViewTrackingRepository.Query.byQuoteId(
            request.quoteId,
            request.sequenceAccountId
        )

        return transactor.blockingTransaction {
            quoteViewTrackingRepository.findMostRecentViewByVisitorIdentifier(
                visitorIdentifier = request.visitorIdentifier,
                query = query
            )
        }.flatMap { mostRecentView ->
            val shouldSave = mostRecentView?.let { recentView ->
                Duration.between(recentView.viewedAt, request.viewedAt) >= Duration.ofMinutes(5)
            } ?: true

            if (shouldSave) {
                val quoteViewTracking = QuoteViewTracking.create(
                    quoteId = request.quoteId,
                    sequenceAccountId = request.sequenceAccountId,
                    visitorIdentifier = request.visitorIdentifier,
                    ipAddress = request.ipAddress,
                    loginType = request.loginType
                )
                transactor.blockingTransaction {
                    quoteViewTrackingRepository.save(quoteViewTracking)
                }.map { Unit }
            } else {
                Success(Unit)
            }
        }
    }
}

// infra/persistence/QuoteViewTrackingRepositoryExposed.kt - Repository implementation (adapter)
@Service
class QuoteViewTrackingRepositoryExposed(
    private val quoteViewTrackingTable: QuoteViewTrackingTable
) : QuoteViewTrackingRepository {

    override fun save(quoteViewTracking: QuoteViewTracking): Result4k<QuoteViewTracking, Exception> {
        return resultFrom {
            quoteViewTrackingTable.insert {
                it[id] = quoteViewTracking.id
                it[quoteId] = quoteViewTracking.quoteId
                it[sequenceAccountId] = quoteViewTracking.sequenceAccountId
                it[visitorIdentifier] = quoteViewTracking.visitorIdentifier
                it[ipAddress] = quoteViewTracking.ipAddress
                it[loginType] = quoteViewTracking.loginType
                it[viewedAt] = quoteViewTracking.viewedAt
            }
            quoteViewTracking
        }
    }

    // Other repository methods...
}

// infra/clients/XeroClientImpl.kt - External service implementation (adapter)
@Service
class XeroClientImpl(
    private val integrationAppClient: IntegrationAppClient
) : XeroClient {

    override suspend fun createInvoice(
        request: CreateInvoiceRequest,
        sequenceAccountId: SequenceAccountId
    ): Result<String, Exception> {
        // Xero-specific implementation using IntegrationApp
    }
}
```

**Package structure:**

```
feature/
├── application/            # Use cases (orchestration)
│   ├── RecordQuoteViewUseCase.kt
│   └── GetQuoteViewTrackingUseCase.kt
├── domain/                 # Core business logic and interfaces
│   ├── models/             # Domain entities and value objects
│   │   ├── QuoteViewTracking.kt
│   │   └── QuoteViewTrackingId.kt
│   └── interfaces/         # Repository and service interfaces (ports)
│       └── QuoteViewTrackingRepository.kt
└── infra/                  # Implementations (adapters)
    ├── persistence/        # Repository implementations (Exposed)
    │   ├── QuoteViewTrackingRepositoryExposed.kt
    │   └── QuoteViewTrackingTable.kt
    └── http/               # HTTP endpoints
        └── QuoteViewTrackingEndpoint.kt
```

**Benefits:**
- Unit test domain logic in complete isolation
- Swap infrastructure by changing adapters
- Business logic concentrated and protected
- Clear boundaries between concerns
