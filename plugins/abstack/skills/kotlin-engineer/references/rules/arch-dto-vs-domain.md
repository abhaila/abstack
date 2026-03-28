---
title: DTOs vs Domain Objects
impact: HIGH
impactDescription: enforces layer separation, prevents business logic leaking into persistence
tags: architecture, dto, domain, repository, aggregate
---

## DTOs vs Domain Objects

**Impact: HIGH (enforces layer separation, prevents business logic leaking into persistence)**

DTOs (Data Transfer Objects) and domain objects serve different purposes. DTOs handle persistence to a single table. Domain objects encode business rules and may span multiple tables.

**DTOs:**
- Map directly to a single database table
- No business logic, just data
- Used only in repositories
- Simple data classes with primitive or value object fields

**Domain objects / aggregates:**
- Encode business rules and invariants
- May be composed from multiple DTOs
- Serialise to one or more DTOs
- Used in business logic, use cases, and services
- Have factory methods, validation, and behaviour

**Incorrect (domain object used for persistence, no table injection):**

```kotlin
// Domain object with business logic used directly in repository - wrong
data class Invoice(
    val id: InvoiceId,
    val sequenceAccountId: SequenceAccountId,
    val currency: Currency,
    val state: InvoiceState,
    val lines: InvoiceLineItems,
    val customer: CustomerReferences
) {
    fun canBeVoided(): Boolean = state.status == InvoiceStatus.FINAL
    fun void(): Result<Invoice, Exception> { /* business logic */ }
}

// Wrong: no table injection, using global table objects
class InvoiceRepository(private val database: Database) {
    fun save(invoice: Invoice) {
        database.transaction {
            // Accessing global table object directly - hard to test
            InvoiceTable.insert {
                it[id] = invoice.id.value
                // ...
            }
        }
    }
}
```

**Correct (separate DTOs, tables injected via DI):**

```kotlin
// DTOs - one per table, no business logic
data class InvoiceDto(
    val id: UUID,
    val sequenceAccountId: UUID,
    val currency: String,
    val status: String,
    val invoiceNumber: String?,
    val customerId: UUID,
    val version: Int
)

data class InvoiceLineItemDto(
    val id: UUID,
    val invoiceId: UUID,
    val description: String,
    val quantity: Int,
    val unitPrice: BigDecimal,
    val currency: String
)

// Domain object - encodes business rules
@optics
data class Invoice(
    val id: InvoiceId,
    val sequenceAccountId: SequenceAccountId,
    val currency: Currency,
    val state: InvoiceState,
    val lines: InvoiceLineItems,
    val customer: CustomerReferences,
    val timestamps: DocumentTimestamps
) {
    fun canBeVoided(): Boolean = state.status == InvoiceStatus.FINAL

    fun void(): Result<Invoice, Exception> {
        if (!canBeVoided()) {
            return Failure(InvoiceError.CannotVoidInvoice(state.status))
        }
        return Success(copy { Invoice.state.status.set(InvoiceStatus.VOID) })
    }

    fun withCurrency(currency: Currency): Result<Invoice, Exception> {
        return resultFrom {
            require(state.status == InvoiceStatus.DRAFT) {
                "Cannot change currency of an invoice that is not in DRAFT status"
            }
            copy { Invoice.currency.set(currency) }
        }
    }

    companion object {
        fun create(
            sequenceAccountId: SequenceAccountId,
            currency: Currency,
            customerId: CustomerId
        ): Invoice {
            return Invoice(
                id = InvoiceId.newId(),
                sequenceAccountId = sequenceAccountId,
                currency = currency,
                state = InvoiceState.empty(),
                lines = InvoiceLineItems.empty(),
                customer = CustomerReferences.empty().withCustomerId(customerId),
                timestamps = DocumentTimestamps.empty()
            )
        }
    }
}

// Repository with injected tables - enables testing
class InvoiceRepositoryExposed(
    private val invoiceTable: InvoiceTable,
    private val lineItemTable: InvoiceLineItemTable
) : InvoiceRepository {

    override fun save(invoice: Invoice): Result4k<Invoice, Exception> {
        return resultFrom {
            val invoiceDto = invoice.toDto()
            val lineItemDtos = invoice.toLineItemDtos()

            invoiceTable.insert {
                it[id] = invoiceDto.id
                it[sequenceAccountId] = invoiceDto.sequenceAccountId
                it[currency] = invoiceDto.currency
                it[status] = invoiceDto.status
                it[invoiceNumber] = invoiceDto.invoiceNumber
                it[customerId] = invoiceDto.customerId
                it[version] = invoiceDto.version
            }

            lineItemDtos.forEach { dto ->
                lineItemTable.insert {
                    it[id] = dto.id
                    it[invoiceId] = dto.invoiceId
                    it[description] = dto.description
                    it[quantity] = dto.quantity
                    it[unitPrice] = dto.unitPrice
                    it[currency] = dto.currency
                }
            }

            invoice
        }
    }

    override fun update(invoice: Invoice): Result4k<Invoice, Exception> {
        return resultFrom {
            val invoiceDto = invoice.toDto()

            invoiceTable.update({ invoiceTable.id eq invoiceDto.id }) {
                it[currency] = invoiceDto.currency
                it[status] = invoiceDto.status
                it[invoiceNumber] = invoiceDto.invoiceNumber
                it[version] = invoiceDto.version
            }

            invoice
        }
    }

    override fun findById(id: InvoiceId): Invoice? {
        val invoiceRow = invoiceTable
            .selectAll()
            .where { invoiceTable.id eq id.value }
            .singleOrNull() ?: return null

        val lineItemRows = lineItemTable
            .selectAll()
            .where { lineItemTable.invoiceId eq id.value }
            .toList()

        return toDomain(invoiceRow.toDto(), lineItemRows.map { it.toDto() })
    }

    private fun toDomain(invoiceDto: InvoiceDto, lineItemDtos: List<InvoiceLineItemDto>): Invoice {
        return Invoice(
            id = InvoiceId(invoiceDto.id),
            sequenceAccountId = SequenceAccountId(invoiceDto.sequenceAccountId),
            currency = Currency.valueOf(invoiceDto.currency),
            state = InvoiceState(
                status = InvoiceStatus.valueOf(invoiceDto.status),
                number = invoiceDto.invoiceNumber?.let { InvoiceNumber(it) }
            ),
            lines = InvoiceLineItems.fromDtos(lineItemDtos),
            customer = CustomerReferences.empty().withCustomerId(CustomerId(invoiceDto.customerId)),
            timestamps = DocumentTimestamps.empty()
        )
    }
}
```

**Where each type belongs:**

```kotlin
// Use case - works with domain objects only
class VoidInvoiceUseCase(private val invoiceRepository: InvoiceRepository) {
    fun execute(invoiceId: InvoiceId): Result<Invoice, Exception> {
        val invoice = invoiceRepository.findById(invoiceId)
            ?: return Failure(InvoiceError.NotFound(invoiceId))

        return invoice.void()
            .onSuccess { invoiceRepository.update(it) }
    }
}

// Repository interface - domain layer, no Exposed imports
interface InvoiceRepository {
    fun findById(id: InvoiceId): Invoice?
    fun save(invoice: Invoice): Result4k<Invoice, Exception>
    fun update(invoice: Invoice): Result4k<Invoice, Exception>
}

// Repository implementation - infrastructure layer, tables injected
class InvoiceRepositoryExposed(
    private val invoiceTable: InvoiceTable,
    private val lineItemTable: InvoiceLineItemTable
) : InvoiceRepository {
    // Implementation uses injected tables, not global objects
}
```

**Aggregates spanning multiple tables:**

```kotlin
// Invoice aggregate - composed from multiple DTOs
data class Invoice(
    val id: InvoiceId,
    val sequenceAccountId: SequenceAccountId,
    val currency: Currency,
    val state: InvoiceState,
    val lines: InvoiceLineItems,      // from InvoiceLineItemTable
    val customer: CustomerReferences,  // denormalised from CustomerTable
    val billing: BillingReferences,    // from BillingScheduleTable
    val creditNotes: CreditNoteReferences
) {
    // Business logic operates on the full aggregate
    fun calculateTotal(): MonetaryAmount =
        lines.items.fold(MonetaryAmount.zero(currency)) { acc, item ->
            acc + item.total
        }

    fun remainingBalance(): MonetaryAmount =
        calculateTotal() - creditNotes.totalApplied

    fun isFullyPaid(): Boolean = remainingBalance() <= MonetaryAmount.zero(currency)
}
```
