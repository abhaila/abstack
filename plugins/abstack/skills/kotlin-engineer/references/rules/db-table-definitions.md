---
title: Define Tables as Classes, Not Objects
impact: MEDIUM
impactDescription: enables dependency injection, improves testability
tags: database, exposed, tables, testing
---

## Define Tables as Classes, Not Objects

**Impact: MEDIUM (enables dependency injection, improves testability)**

Define Exposed table schemas as classes rather than Kotlin objects. Inject table instances via dependency injection to enable testing with different configurations.

**Incorrect (global object):**

```kotlin
// Table as object - global state, hard to test
object InvoicesTable : Table("invoices") {
    val id = uuid("id")
    val customerId = uuid("customer_id")
    val status = varchar("status", 50)
    val total = decimal("total", 12, 4)
}

class InvoiceRepository(private val db: Database) {
    fun findById(id: InvoiceId): Invoice? {
        return db.transaction {
            // Accessing global object directly - hard to test
            InvoicesTable.select { InvoicesTable.id eq id.value }
                .map { it.toInvoice() }
                .firstOrNull()
        }
    }
}
```

**Correct (injectable class):**

```kotlin
// Table as class - can be instantiated with different configurations
class InvoicesTable(tableName: String = "invoicing_invoices") : Table(tableName) {
    val id = uuid("id").autoGenerate()
    val accountId = sequenceAccountId()
    val customerId = uuid("customer_id")
    val status = varchar("status", 50)
    val totalAmount = decimal("total_amount", 19, 4)
    val totalCurrency = varchar("total_currency", 3)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
    val deletedAt = timestamp("deleted_at").nullable()

    override val primaryKey = PrimaryKey(id)
}

class InvoiceRepositoryExposed(
    private val invoicesTable: InvoicesTable
) : InvoiceRepository {

    override fun findById(id: InvoiceId): Result4k<Invoice?, Exception> {
        return resultFrom {
            invoicesTable
                .selectAll()
                .where { invoicesTable.id eq id.value }
                .andWhere { invoicesTable.deletedAt.isNull() }
                .singleOrNull()
                ?.let { toInvoice(it) }
        }
    }
}

// Easy to test with different configurations
class InvoiceRepositoryTest {
    private val testTable = InvoicesTable("test_invoices")
    private val repository = InvoiceRepositoryExposed(testTable)
}
```

**Table composition for relationships:**

```kotlin
class InvoicesTable(tableName: String = "invoicing_invoices") : Table(tableName) {
    val id = uuid("id")
    val customerId = uuid("customer_id")
    val status = varchar("status", 50)
    override val primaryKey = PrimaryKey(id)
}

class InvoiceLineItemsTable(
    private val invoicesTable: InvoicesTable,
    tableName: String = "invoicing_line_items"
) : Table(tableName) {
    val id = uuid("id")
    val invoiceId = uuid("invoice_id").references(invoicesTable.id)
    val description = varchar("description", 500)
    val quantity = integer("quantity")
    val unitPrice = decimal("unit_price", 19, 4)
    override val primaryKey = PrimaryKey(id)
}

// Repository with joined queries
class InvoiceRepositoryExposed(
    private val invoicesTable: InvoicesTable,
    private val lineItemsTable: InvoiceLineItemsTable
) : InvoiceRepository {

    override fun findWithLineItems(invoiceId: InvoiceId): Result4k<InvoiceWithLineItems?, Exception> {
        return resultFrom {
            invoicesTable
                .join(lineItemsTable, JoinType.LEFT,
                    onColumn = invoicesTable.id,
                    otherColumn = lineItemsTable.invoiceId)
                .selectAll()
                .where { invoicesTable.id eq invoiceId.value }
                .toList()
                .let { rows -> mapToInvoiceWithLineItems(rows) }
        }
    }
}
```

See [Persistence Patterns](db-persistence.md) for comprehensive repository design including Query objects.
