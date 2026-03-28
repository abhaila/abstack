---
title: Tidy First - Separate Structural from Behavioural Changes
impact: HIGH
impactDescription: enables safe incremental improvement, prevents mixing concerns
tags: refactoring, legacy-code, tidy-first, kent-beck
---

## Tidy First - Separate Structural from Behavioural Changes

**Impact: HIGH (enables safe incremental improvement, prevents mixing concerns)**

When working with legacy code, separate structural changes from behavioural changes. Structural changes alter code organisation without changing what the code does. Behavioural changes add features or fix bugs. Never mix these in the same commit or PR.

**The principle:**

Structural changes (tidying) make behavioural changes easier. Tidy the code first, then make the behavioural change in a separate PR.

**Structural changes (tidying):**
- Rename variables, functions, classes for clarity
- Extract methods to reduce complexity
- Move code to more appropriate locations
- Reorganise imports and file structure
- Add or improve types
- Remove dead code

**Behavioural changes:**
- New features
- Bug fixes
- Changed business logic
- Performance optimisations that alter behaviour

**Incorrect (mixing structural and behavioural changes):**

```kotlin
// Single commit that does everything - hard to review, risky to deploy
class InvoiceService(
    private val invoiceRepository: InvoiceRepository,
    private val notificationService: NotificationService // renamed from 'ns'
) {
    // Renamed from 'proc' and added new late fee logic in same commit
    fun processInvoice(invoice: Invoice): Result<Invoice, Exception> {
        val total = calculateTotal(invoice) // extracted method
        val withFees = applyLateFee(invoice, total) // new feature
        return invoiceRepository.save(withFees)
    }

    // New method - behavioural change
    private fun applyLateFee(invoice: Invoice, total: MonetaryAmount): Invoice {
        return if (invoice.isOverdue()) invoice.withLateFee(total * 0.05) else invoice
    }

    // Extracted method - structural change
    private fun calculateTotal(invoice: Invoice): MonetaryAmount =
        invoice.lines.items.sumOf { it.total }
}
```

**Correct (separate PRs for structural and behavioural changes):**

```kotlin
// PR 1: Structural changes only - tests pass before AND after
class InvoiceService(
    private val invoiceRepository: InvoiceRepository,
    private val notificationService: NotificationService // renamed from 'ns'
) {
    // Renamed from 'proc', extracted calculateTotal - no behaviour change
    fun processInvoice(invoice: Invoice): Result<Invoice, Exception> {
        val total = calculateTotal(invoice)
        return invoiceRepository.save(invoice.withTotal(total))
    }

    private fun calculateTotal(invoice: Invoice): MonetaryAmount =
        invoice.lines.items.sumOf { it.total }
}

// PR 2: Behavioural change only - adds late fee feature
class InvoiceService(
    private val invoiceRepository: InvoiceRepository,
    private val notificationService: NotificationService
) {
    fun processInvoice(invoice: Invoice): Result<Invoice, Exception> {
        val total = calculateTotal(invoice)
        val withFees = applyLateFee(invoice, total)
        return invoiceRepository.save(withFees)
    }

    private fun applyLateFee(invoice: Invoice, total: MonetaryAmount): Invoice =
        if (invoice.isOverdue()) invoice.withLateFee(total * 0.05) else invoice

    private fun calculateTotal(invoice: Invoice): MonetaryAmount =
        invoice.lines.items.sumOf { it.total }
}
```

**When to tidy first:**

Tidy before extending when the code you need to modify is hard to understand:

```kotlin
// Before: confusing parameter names, unclear logic
fun proc(a: String, b: Int, c: Boolean): Result<Data, Error> {
    if (c && b > 0) {
        return fetch(a).map { transform(it, b) }
    }
    return Failure(Error.Invalid)
}

// PR 1: Tidy first - rename for clarity
fun processRequest(
    resourceId: String,
    maxRetries: Int,
    includeMetadata: Boolean
): Result<Data, Error> {
    if (includeMetadata && maxRetries > 0) {
        return fetchResource(resourceId).map { enrichWithMetadata(it, maxRetries) }
    }
    return Failure(Error.InvalidRequest)
}

// PR 2: Now the feature change is obvious
fun processRequest(
    resourceId: String,
    maxRetries: Int,
    includeMetadata: Boolean
): Result<Data, Error> {
    if (maxRetries <= 0) {
        return Failure(Error.InvalidRetryCount)  // New validation - easy to review
    }
    if (includeMetadata) {
        return fetchResource(resourceId).map { enrichWithMetadata(it, maxRetries) }
    }
    return fetchResource(resourceId)
}
```

**Tests must pass before and after structural changes:**

```kotlin
// Existing test - must pass before AND after tidying
@Test
fun `should process invoice and calculate total`() = scenario {
    val invoice = Gen.invoice().withLineItems(
        Gen.invoiceLineItem().withTotal(MonetaryAmount(Currency.GBP, BigDecimal("100.00"))),
        Gen.invoiceLineItem().withTotal(MonetaryAmount(Currency.GBP, BigDecimal("50.00")))
    )

    val result = invoiceService.processInvoice(invoice)

    assertTrue(result is Success)
    assertEquals(MonetaryAmount(Currency.GBP, BigDecimal("150.00")), result.value.total)
}

// After structural changes, same test still passes - behaviour unchanged
// After behavioural changes, add new tests for new behaviour
@Test
fun `should apply 5 percent late fee for overdue invoices`() = scenario {
    val overdueInvoice = Gen.invoice()
        .withDueDate(LocalDate.now().minusDays(30))
        .withTotal(MonetaryAmount(Currency.GBP, BigDecimal("100.00")))

    val result = invoiceService.processInvoice(overdueInvoice)

    assertEquals(MonetaryAmount(Currency.GBP, BigDecimal("105.00")), result.value.total)
}
```

**Incremental progress towards codebase standards:**

Don't try to fix everything at once. Make small, safe improvements:

```kotlin
// Week 1 PR: Rename confusing variables in InvoiceService
// Week 2 PR: Extract payment logic to PaymentService
// Week 3 PR: Add value objects for MonetaryAmount and InvoiceId
// Week 4 PR: Implement new late fee feature (now much easier)
```

Each PR is small, reviewable, and independently deployable. If any PR causes issues, it's easy to identify and revert.

Reference: [Kent Beck - Tidy First?](https://www.oreilly.com/library/view/tidy-first/9781098151232/)
