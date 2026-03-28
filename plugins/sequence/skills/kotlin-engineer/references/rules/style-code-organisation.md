---
title: Follow Code Organisation Conventions
impact: LOW-MEDIUM
impactDescription: improves readability, enables quick navigation
tags: style, organisation, layout, structure
---

## Follow Code Organisation Conventions

**Impact: LOW-MEDIUM (improves readability, enables quick navigation)**

Consistent code organisation reduces cognitive load and makes codebases easier to navigate.

**Class member ordering:**

```kotlin
class Invoice private constructor(
    val id: InvoiceId,
    val customerId: CustomerId,
    val lineItems: List<LineItem>,
    val status: InvoiceStatus,
    val total: Money
) {
    // 1. Secondary constructors (rare in Kotlin)

    // 2. Init blocks (if needed)
    init {
        require(lineItems.isNotEmpty()) { "Invoice must have line items" }
    }

    // 3. Properties (computed/derived)
    val isFinalized: Boolean
        get() = status == InvoiceStatus.FINAL

    val itemCount: Int
        get() = lineItems.size

    // 4. Public functions (business operations)
    fun finalize(): Result<Invoice, Exception> {
        // ...
    }

    fun addLineItem(item: LineItem): Result<Invoice, Exception> {
        // ...
    }

    // 5. Internal/private functions
    private fun calculateTotal(): Money {
        // ...
    }

    // 6. Companion object (always last)
    companion object {
        fun create(customerId: CustomerId, lineItems: List<LineItem>): Result<Invoice, Exception> {
            // ...
        }
    }
}
```

**File organisation:**

```kotlin
// 1. Package declaration
package io.example.invoicing.domain.model

// 2. Imports (no wildcard imports)
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import java.time.Instant

// 3. Top-level declarations
// One primary class per file, named after the file
// Related small classes/interfaces can be in same file

data class Invoice private constructor(
    // ...
)

// Sealed error hierarchy can live with its domain class
sealed class InvoiceError : Exception() {
    class NotFound(val id: InvoiceId) : InvoiceError()
    class AlreadyFinalized(val id: InvoiceId) : InvoiceError()
}

// Small value objects used only by this class can be here
@JvmInline
value class InvoiceNumber(val value: String)
```

**Package structure for features:**

```
feature/
├── application/                    # Use cases (one per operation)
│   ├── CreateInvoiceUseCase.kt
│   ├── FinalizeInvoiceUseCase.kt
│   └── VoidInvoiceUseCase.kt
├── domain/
│   ├── models/                     # Domain entities and value objects
│   │   ├── Invoice.kt
│   │   ├── InvoiceId.kt
│   │   ├── InvoiceAggregate.kt
│   │   └── LineItem.kt
│   ├── persistence/                # Repository interfaces
│   │   └── InvoiceRepository.kt
│   ├── clients/                    # External service interfaces
│   │   └── PaymentGateway.kt
│   ├── services/                   # Domain service interfaces
│   │   └── InvoiceCalculator.kt
│   ├── events/                     # Event publisher interfaces
│   │   └── InvoiceEventPublisher.kt
│   └── validation/                 # Business rule validators
│       └── InvoiceValidator.kt
└── infra/                          # Implementations
    ├── persistence/
    │   ├── InvoiceRepositoryExposed.kt
    │   └── InvoicesDatabase.kt
    ├── http/
    │   ├── CreateInvoiceEndpoint.kt
    │   ├── GetInvoiceEndpoint.kt
    │   ├── adapters/
    │   │   └── InvoiceResponseAdapter.kt
    │   └── models/
    │       └── InvoiceResponse.kt
    ├── clients/
    │   └── StripePaymentGateway.kt
    └── events/
        └── InvoiceEventPublisherImpl.kt
```

**Naming conventions:**
- Repository interfaces: `[Entity]Repository.kt`
- Repository implementations: `[Entity]RepositoryExposed.kt`
- Database tables: `[Entity]Database.kt` or `[Entity]Table.kt`
- Use cases: `[Verb][Entity]UseCase.kt`
- Endpoints: `[Verb][Entity]Endpoint.kt`
- Response DTOs: `[Entity]Response.kt`
- Adapters: `[Entity]ResponseAdapter.kt`

**Import organisation:**

```kotlin
// Group imports in this order, separated by blank lines:
// 1. Project imports
import com.sequencehq.invoicing.domain.models.Invoice
import com.sequencehq.invoicing.domain.persistence.InvoiceRepository

// 2. Third-party imports
import dev.forkhandles.result4k.Result
import dev.forkhandles.result4k.Success
import org.http4k.core.Request

// 3. Java/Kotlin stdlib imports
import java.time.Instant
import java.util.UUID

// Never use wildcard imports
// BAD: import dev.forkhandles.result4k.*
// GOOD: import dev.forkhandles.result4k.Result
```

**When to split files:**

Split into separate files when:
- A class exceeds ~200 lines
- Multiple unrelated public classes exist
- Test readability suffers

Keep together when:
- Sealed class with its subclasses
- Domain entity with its error types
- Small value objects used only by one class
