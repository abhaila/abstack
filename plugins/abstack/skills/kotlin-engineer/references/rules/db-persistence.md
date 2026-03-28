---
title: Database Persistence Patterns
impact: HIGH
impactDescription: enables testable, maintainable data access with consistent patterns
tags: database, exposed, repository, persistence, query-objects
---

## Database Persistence Patterns

**Impact: HIGH (enables testable, maintainable data access with consistent patterns)**

This rule covers repository design, table definitions, query patterns, and database conventions using the Exposed framework.

### Repository Design with Query Objects

Favour narrow repository interfaces with expressive Query objects over broad interfaces with many specific methods. Query objects encapsulate search criteria and make repositories easier to maintain and test.

**Incorrect (method explosion):**

```kotlin
// Avoid: too many specific methods
interface CustomerRepository {
    fun findById(id: CustomerId): Customer?
    fun findByEmail(email: EmailAddress): Customer?
    fun findActiveCustomers(): List<Customer>
    fun findActiveCustomersByRegion(region: Region): List<Customer>
    fun findInactiveByEmailAndRegion(email: EmailAddress, region: Region): List<Customer>
    // ... endless methods for each combination
}
```

**Correct (Query object pattern):**

```kotlin
// Repository interface in domain layer
interface AutomationsRepository {
    fun save(automation: Automation): Result4k<Automation, Exception>
    fun update(automation: Automation): Result4k<Automation, Exception>
    fun find(query: Query): Result4k<Automation?, Exception>
    fun filter(query: Query): Result4k<List<Automation>, Exception>

    @ConsistentCopyVisibility
    data class Query private constructor(
        val id: AutomationId? = null,
        val sequenceAccountId: SequenceAccountId? = null,
        val includeArchived: Boolean = false
    ) {
        companion object {
            fun create() = Query()

            fun byId(id: AutomationId, sequenceAccountId: SequenceAccountId) =
                Query(id = id, sequenceAccountId = sequenceAccountId)

            fun bySequenceAccountId(sequenceAccountId: SequenceAccountId, includeArchived: Boolean = false) =
                Query(sequenceAccountId = sequenceAccountId, includeArchived = includeArchived)
        }
    }
}

// Usage
val automations = automationsRepository.filter(
    AutomationsRepository.Query.bySequenceAccountId(accountId, includeArchived = true)
)
```

**Query object with pagination:**

```kotlin
interface ActivityLogRepository {
    fun save(activityLog: ActivityLog): Result4k<ActivityLog, Exception>
    fun find(query: Query): Result4k<ActivityLogAggregate?, Exception>
    fun filter(query: Query): Result4k<List<ActivityLogAggregate>, Exception>

    fun paginatedFilter(
        query: Query,
        pageSize: Int,
        sortOrder: PaginationSortOrder,
        offset: ApiCursor?
    ): Result4k<ResultsPage<ActivityLogAggregate, out Cursor>, Exception>

    @ConsistentCopyVisibility
    data class Query private constructor(
        val id: ActivityLogId? = null,
        val sequenceAccountId: UUID? = null,
        val activityLogObjectId: ActivityLogObjectId? = null,
        val activityLogObjectEntityId: UUID? = null,
        val activityType: ActivityType? = null
    ) {
        companion object {
            fun create() = Query()

            fun byId(id: ActivityLogId, sequenceAccountId: UUID) =
                Query(id = id, sequenceAccountId = sequenceAccountId)

            fun byAccountId(sequenceAccountId: UUID) =
                Query(sequenceAccountId = sequenceAccountId)

            fun byAccountIdAndObjectId(sequenceAccountId: UUID, activityLogObjectId: ActivityLogObjectId) =
                Query(sequenceAccountId = sequenceAccountId, activityLogObjectId = activityLogObjectId)

            fun byAccountIdAndActivityType(sequenceAccountId: UUID, activityType: ActivityType) =
                Query(sequenceAccountId = sequenceAccountId, activityType = activityType)
        }
    }
}
```

### Repository Implementation with Query Filtering

Implement Query filtering using extension functions on Exposed's Query type:

```kotlin
@Service
class ActivityLogRepositoryExposed(
    private val activityLogTable: ActivityLogTable,
    private val activityLogItemTable: ActivityLogItemTable,
    private val activityLogObjectTable: ActivityLogObjectTable
) : ActivityLogRepository {

    override fun find(query: ActivityLogRepository.Query): Result4k<ActivityLogAggregate?, Exception> {
        return resultFrom {
            activityLogTable
                .selectAll()
                .filter(query)
                .limit(1)
                .firstOrNull()
                ?.let { toActivityLogAggregate(toActivityLog(it)) }
        }
    }

    override fun filter(query: ActivityLogRepository.Query): Result4k<List<ActivityLogAggregate>, Exception> {
        return resultFrom {
            activityLogTable
                .selectAll()
                .filter(query)
                .toList()
                .map { toActivityLogAggregate(toActivityLog(it)) }
        }
    }

    // Extension function applies query criteria
    private fun org.jetbrains.exposed.sql.Query.filter(query: ActivityLogRepository.Query): org.jetbrains.exposed.sql.Query {
        return this
            .notDeleted()
            .withId(query.id)
            .withSequenceAccountId(query.sequenceAccountId)
            .withActivityType(query.activityType)
            .withActivityLogObjectId(query.activityLogObjectId)
    }

    private fun org.jetbrains.exposed.sql.Query.notDeleted(): org.jetbrains.exposed.sql.Query {
        return this.andWhere { activityLogTable.deletedAt.isNull() }
    }

    private fun org.jetbrains.exposed.sql.Query.withId(id: ActivityLogId?): org.jetbrains.exposed.sql.Query {
        return when {
            id == null -> this
            else -> this.andWhere { activityLogTable.id eq id }
        }
    }

    private fun org.jetbrains.exposed.sql.Query.withSequenceAccountId(sequenceAccountId: UUID?): org.jetbrains.exposed.sql.Query {
        return when {
            sequenceAccountId == null -> this
            else -> this.andWhere { activityLogTable.sequenceAccountId eq sequenceAccountId }
        }
    }

    private fun org.jetbrains.exposed.sql.Query.withActivityType(activityType: ActivityType?): org.jetbrains.exposed.sql.Query {
        return when {
            activityType == null -> this
            else -> this.andWhere { activityLogTable.activityType eq activityType }
        }
    }
}
```

### Table Definitions with Dependency Injection

Define tables as classes, not objects. Inject table instances into repositories.

```kotlin
// Table as class - enables DI and testing
class ProductsTable(tableName: String = "products") : Table(tableName) {
    val id = uuid("id").autoGenerate()
    val accountId = sequenceAccountId()
    val sku = varchar("sku", 50).uniqueIndex()
    val name = varchar("name", 255)
    val priceAmount = decimal("price_amount", 12, 4)
    val priceCurrency = varchar("price_currency", 3)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
    val deletedAt = timestamp("deleted_at").nullable()

    override val primaryKey = PrimaryKey(id)
}

// Repository with injected tables
class ProductRepositoryExposed(
    private val productsTable: ProductsTable
) : ProductRepository {

    override fun find(query: Query): Result4k<Product?, Exception> {
        return resultFrom {
            productsTable
                .selectAll()
                .filter(query)
                .singleOrNull()
                ?.let { toProduct(it) }
        }
    }
}
```

### Table Composition for Joins

Use table composition for related tables and perform joins to minimise queries:

```kotlin
class ProductsTable : Table("products") {
    val id = uuidValueColumn("id", ::ProductId)
    val accountId = sequenceAccountId()
    val name = varchar("name", 255)
    val createdAt = createdAt()
    val deletedAt = deletedAt()

    override val primaryKey = PrimaryKey(id)
}

class DefaultProductsTable(
    private val productsTable: ProductsTable
) : Table("default_products") {
    val productId = uuidValueColumn("product_id", ::ProductId).references(productsTable.id)
    val accountId = sequenceAccountId()
    val createdAt = createdAt()
    val deletedAt = deletedAt()
}

// Repository using joins
class ProductRepositoryExposed(
    private val productsTable: ProductsTable,
    private val defaultProductsTable: DefaultProductsTable
) : ProductRepository {

    private val joinedQuery
        get() = productsTable
            .join(
                defaultProductsTable,
                JoinType.LEFT,
                onColumn = productsTable.id,
                otherColumn = defaultProductsTable.productId
            )

    fun findDefaultProducts(accountId: SequenceAccountId): Result4k<List<Product>, Exception> {
        return resultFrom {
            joinedQuery
                .selectAll()
                .where { productsTable.deletedAt.isNull() }
                .andWhere { defaultProductsTable.productId.isNotNull() }
                .andWhere { productsTable.accountId eq accountId }
                .toList()
                .map { toProduct(it) }
        }
    }
}
```

### Map Data Outside Transaction Blocks

Map query results outside transactions to avoid holding connections during mapping operations:

```kotlin
// Incorrect - mapping inside transaction holds connection
val products = db.transaction {
    productsTable
        .selectAll()
        .toList()
        .map { toProduct(it) }  // Mapping inside transaction
}

// Correct - read inside, map outside
val products = db.transaction {
    productsTable
        .selectAll()
        .toList()  // Read results inside transaction
}.map { toProduct(it) }  // Map outside transaction

// Critical for suspending functions
val products = db.transaction {
    productsTable
        .selectAll()
        .toList()
}.map { row ->
    // If this calls a suspending function, the coroutine may suspend
    // With mapping outside transaction, the connection is already released
    enrichProduct(toProduct(row))
}
```

### Table Naming Conventions

Use lowercase `snake_case` with domain prefix:

```kotlin
// Pattern: <domain>_<entity>
catalog_products
catalog_categories
invoicing_invoices
invoicing_line_items
billing_schedules
```

### Database Indices

Create indices on columns used in WHERE, JOIN, or ORDER BY clauses. Use consistent naming:

```kotlin
// Pattern: <table>_idx_<columns>
class InvoicesTable : Table("invoicing_invoices") {
    val id = uuid("id")
    val customerId = uuid("customer_id")
    val status = varchar("status", 50)
    val dueDate = date("due_date")
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)

    init {
        // Index for common queries
        index("invoicing_invoices_idx_customer_id", false, customerId)
        index("invoicing_invoices_idx_status", false, status)
        index("invoicing_invoices_idx_due_date", false, dueDate)
        // Composite index for filtered queries
        index("invoicing_invoices_idx_customer_id_status", false, customerId, status)
    }
}
```

### High Precision Data Types

Use Postgres NUMERIC with appropriate precision for decimal values. Maximum supported precision for BigQuery compatibility is BIGNUMERIC(38,9):

```kotlin
class PricesTable : Table("prices") {
    // Use appropriate precision for monetary amounts
    val amount = decimal("amount", 19, 4)  // Standard for money
    val taxRate = decimal("tax_rate", 5, 4)  // e.g., 0.2000 for 20%

    // Do not exceed (38, 9) for BigQuery compatibility
    val highPrecisionValue = decimal("high_precision", 38, 9)
}
```
