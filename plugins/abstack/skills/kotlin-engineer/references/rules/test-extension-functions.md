---
title: Use Extension Functions for Test Setup
impact: MEDIUM
impactDescription: provides stable API, absorbs refactoring changes
tags: testing, extension-functions, fixtures, refactoring
---

## Use Extension Functions for Test Setup

**Impact: MEDIUM (provides stable API, absorbs refactoring changes)**

There's an important distinction between domain entity methods and test extension functions. Domain entities have methods that encode business logic (`finalize()`, `void()`). Test extension functions provide a stable public API for constructing test data - separate from domain methods.

**The problem with .copy():**

It's tempting to use Kotlin's `.copy()` directly in tests. But `.copy()` creates brittle coupling between tests and internal structure.

```kotlin
// AVOID: Direct .copy() usage
val invoice = Gen.invoice().copy(
    status = InvoiceStatus.DRAFT,
    lineItems = listOf(item)
)
// When you refactor - rename lineItems to items, restructure to
// nested LineItemCollection - every .copy() call breaks
```

**Extension functions provide stability:**

```kotlin
// Extension functions - the public API for test fixture creation
fun Invoice.withStatus(status: InvoiceStatus) = copy(status = status)

fun Invoice.withLineItems(items: List<LineItem>) = copy(lineItems = items)

fun Invoice.addLineItem(item: LineItem) = copy(lineItems = lineItems + item)

fun LineItem.withAmount(amount: BigDecimal) = copy(amount = amount)

fun LineItem.withDescription(description: String) = copy(description = description)

fun BillingSchedule.withStartDate(date: LocalDate) = copy(
    selected = selected.copy(startDate = date)
)
```

**After refactoring:**

When you refactor the `Invoice` class and rename `lineItems` to `items`, you update the extension function once:

```kotlin
// After refactoring Invoice internals
fun Invoice.withLineItems(items: List<LineItem>) = copy(items = items)  // Updated once
```

Every test that calls `invoice.withLineItems(...)` continues to work without modification.

**Domain methods vs test extension functions:**

Don't confuse these test extension functions with domain methods:

```kotlin
// Domain methods - business logic, can fail
class Invoice(...) {
    fun finalize(): Result<Invoice, Exception> { ... }  // Business rules
    fun void(): Result<Invoice, Exception> { ... }      // Validation
}

// Test extension functions - no business rules, always succeed
fun Invoice.withStatus(status: InvoiceStatus) = copy(status = status)
fun Invoice.withLineItems(items: List<LineItem>) = copy(lineItems = items)
```

Test extension functions don't enforce business rules. They unconditionally set the object to whatever state you specify, even invalid states. You need this power in tests - you want to set up an invoice with a negative total to test that validation rejects it.

**Naming convention:**

Domain methods use imperative verbs: `finalize()`, `void()`, `cancel()`
Test extension functions use `with` prefix: `withStatus()`, `withLineItems()`, `withTotal()`

**Using extension functions in tests:**

```kotlin
@Test
fun `should calculate correctly for multi-item invoice`() = scenario {
    val item1 = Gen.lineItem().withGrossTotal(BigDecimal("100.00"))
    val item2 = Gen.lineItem().withGrossTotal(BigDecimal("200.00"))

    val invoice = Gen.invoice()
        .withStatus(InvoiceStatus.DRAFT)
        .withLineItems(listOf(item1, item2))
    repository.seed(invoice)

    val result = calculator.calculate(invoice)

    assertEquals(BigDecimal("300.00"), result)
}
```

**Key points:**

When you read this test, you see exactly what matters for this scenario: the invoice is in draft status and has two specific line items with known amounts. If `Invoice` gets refactored internally, the test continues to work.
