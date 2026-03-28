---
title: Imperative Shell, Functional Core
impact: CRITICAL
impactDescription: separates side effects from logic, improves testability
tags: architecture, functional, side-effects, testing
---

## Imperative Shell, Functional Core

**Impact: CRITICAL (separates side effects from logic, improves testability)**

Structure applications so core business logic is purely functional - deterministic, side-effect-free, easy to reason about. Push all I/O operations (database, HTTP, events) to the outer "imperative shell".

**Incorrect (side effects mixed with logic):**

```kotlin
class CreateInvoiceUseCase(
    private val repository: InvoiceRepository,
    private val emailService: EmailService,
    private val eventPublisher: EventPublisher
) {
    fun execute(data: CreateInvoiceData): Invoice {
        // Side effect: database read
        val customer = repository.findCustomer(data.customerId)

        // Business logic mixed with side effects
        val invoice = Invoice.create(customer, data.lineItems)

        // Side effect: database write
        repository.save(invoice)

        // Side effect: send email
        emailService.sendInvoiceCreated(invoice)

        // Side effect: publish event
        eventPublisher.publish(InvoiceCreated(invoice))

        return invoice
    }
}
```

**Correct (separated concerns):**

```kotlin
// Data structures for input/output
data class CreateInvoiceCommand(
    val data: CreateInvoiceData,
    val context: CreateInvoiceContext // All required data loaded upfront
)

data class CreateInvoiceResult(
    val invoice: Invoice,
    val events: List<DomainEvent>
)

// Functional core - pure, no side effects
fun createInvoice(command: CreateInvoiceCommand): Result<CreateInvoiceResult, Exception> {
    return resultFrom {
        // Validate
        require(command.context.customer.isActive) { "Customer must be active" }
        require(command.data.lineItems.isNotEmpty()) { "Must have line items" }

        // Calculate
        val total = command.data.lineItems.sumOf { it.amount }

        // Assemble (but don't persist)
        val invoice = Invoice(
            id = InvoiceId.newId(),
            customerId = command.context.customer.id,
            lineItems = command.data.lineItems,
            total = total,
            status = InvoiceStatus.DRAFT
        )

        // Create events (but don't publish)
        val events = listOf(InvoiceCreated(invoice.id, invoice.customerId))

        CreateInvoiceResult(invoice, events)
    }.mapFailure { InvoiceError.ValidationFailed(it.message) }
}

// Imperative shell - handles all I/O
class CreateInvoiceUseCase(
    private val customerRepository: CustomerRepository,
    private val invoiceRepository: InvoiceRepository,
    private val eventPublisher: EventPublisher
) {
    fun execute(data: CreateInvoiceData): Result<Invoice, Exception> {
        // 1. Read all required data upfront
        val customer = customerRepository.findById(data.customerId)
            .onFailure { return Failure(InvoiceError.CustomerNotFound) }
            .orThrow() ?: return Failure(InvoiceError.CustomerNotFound)

        val context = CreateInvoiceContext(customer)

        // 2. Call pure functional core
        val result = createInvoice(CreateInvoiceCommand(data, context))
            .onFailure { return Failure(it) }
            .orThrow()

        // 3. Write results to database
        val savedInvoice = invoiceRepository.save(result.invoice)
            .onFailure { return Failure(InvoiceError.PersistenceFailed) }
            .orThrow()

        // 4. Publish events
        result.events.forEach { eventPublisher.publish(it) }

        return Success(savedInvoice)
    }
}
```

**The shell's responsibilities:**
1. Handle the request
2. Read all required data upfront
3. Call pure functional core
4. Write results to database
5. Emit events

**The core's responsibilities:**
1. Validate data
2. Execute business logic
3. Assemble result objects
4. Create (but not emit) events

This separation makes the core trivially testable without mocks - just pass in data, assert on output.
