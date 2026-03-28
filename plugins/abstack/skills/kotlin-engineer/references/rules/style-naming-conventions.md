---
title: Follow Kotlin Naming Conventions
impact: LOW-MEDIUM
impactDescription: improves readability, maintains consistency
tags: style, naming, conventions
---

## Follow Kotlin Naming Conventions

**Impact: LOW-MEDIUM (improves readability, maintains consistency)**

Use consistent naming conventions across the codebase to improve readability and reduce cognitive load.

**Packages:**

```kotlin
// All lowercase, no underscores, descriptive
package io.effectivelabs.invoicing.domain.model
package io.effectivelabs.invoicing.application
package io.effectivelabs.invoicing.infra.persistence
```

**Files:**

```kotlin
// PascalCase, matching the primary public class
InvoiceRepository.kt
CreateInvoiceUseCase.kt
ExposedInvoiceRepository.kt
```

**Classes and interfaces:**

```kotlin
// PascalCase, descriptive nouns
class Invoice
interface CustomerRepository
sealed class PaymentError

// Standard suffixes
interface OrderRepository          // Repository interfaces
class CreateOrderUseCase          // Use cases
class TaxCalculator               // Domain services
class ExposedOrderRepository      // Adapters include technology
class StripePaymentGateway        // External service adapters

// DTOs
data class CreateInvoiceRequest
data class InvoiceResponse
data class OrderCreatedEvent
```

**Functions and methods:**

```kotlin
// camelCase, start with verb
fun calculateTotal(): Money
fun findById(id: CustomerId): Customer?
fun isValid(): Boolean
fun processInvoice(invoice: Invoice): Result<Invoice, Exception>
```

**Variables and parameters:**

```kotlin
// camelCase, descriptive
val customerEmail: EmailAddress
val totalAmount: Money
val isActive: Boolean
```

**Constants:**

```kotlin
// SCREAMING_SNAKE_CASE
const val MAX_RETRY_ATTEMPTS = 3
const val DEFAULT_PAGE_SIZE = 20

companion object {
    private const val CONNECTION_TIMEOUT_MS = 5000L
}
```

**Acronyms - treat as words:**

```kotlin
// Correct: capitalise only first letter
class XmlParser       // Not XMLParser
class HttpGateway     // Not HTTPGateway
class JsonSerializer  // Not JSONSerializer
val htmlContent       // Not hTMLContent

// Exception: two-letter acronyms
class IOAdapter       // IO is two letters, all caps
val id: String        // ID shortened to id
```

**Boolean naming:**

```kotlin
// Prefix with is, has, can, should
val isActive: Boolean
val hasPermission: Boolean
val canEdit: Boolean
val shouldRetry: Boolean

// Avoid negatives
val isEnabled: Boolean    // Not isNotDisabled
val hasAccess: Boolean    // Not lacksAccess
```
