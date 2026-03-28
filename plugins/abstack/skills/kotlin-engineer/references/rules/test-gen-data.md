---
title: Use Gen for Test Data Generation
impact: MEDIUM
impactDescription: creates valid objects easily, tests become resilient to schema changes
tags: testing, data-generation, gen, fabricate
---

## Use Gen for Test Data Generation

**Impact: MEDIUM (creates valid objects easily, tests become resilient to schema changes)**

For complex domain objects, use `Gen` object methods that generate valid instances. For primitive types and simple values, use `fabricate<T>()`. This pattern gives you:
- Realistic, valid domain objects without manual construction
- Only specify the fields that matter for the test
- Tests become more resilient (they don't break when new fields are added)
- Avoid "magic values" that make tests hard to understand

**Generate complex domain objects with Gen:**

```kotlin
val invoice = Gen.invoice()
val customer = Gen.customer()
val billingSchedule = Gen.billingSchedule()
```

**Customise using extension functions (public API):**

```kotlin
val draftInvoice = Gen.invoice().withStatus(InvoiceStatus.DRAFT)
val invoiceWithItems = Gen.invoice().withLineItems(listOf(Gen.lineItem()))
val highValueItem = Gen.lineItem().withAmount(BigDecimal("10000.00"))
```

**Generate primitive values and simple types with fabricate:**

```kotlin
val date = fabricate<LocalDate>()
val customerId = fabricate<CustomerId>()
val amount = fabricate<BigDecimal>()
val invoiceId = fabricate<InvoiceId>()
```

**Example Gen object:**

```kotlin
object Gen {
    fun invoice(
        id: InvoiceId = fabricate(),
        customerId: CustomerId = fabricate(),
        status: InvoiceStatus = InvoiceStatus.DRAFT,
        lineItems: List<LineItem> = listOf(lineItem())
    ) = Invoice(
        id = id,
        customerId = customerId,
        status = status,
        lineItems = lineItems,
        total = lineItems.sumOf { it.amount }
    )

    fun lineItem(
        id: LineItemId = fabricate(),
        description: String = "Test Item",
        amount: BigDecimal = BigDecimal("100.00")
    ) = LineItem(id, description, amount)

    fun customer(
        id: CustomerId = fabricate(),
        email: EmailAddress = EmailAddress.of("test@example.com").orThrow(),
        status: CustomerStatus = CustomerStatus.ACTIVE
    ) = Customer(id, email, status)
}
```

**Key points:**

The `Gen` object provides factory methods for domain objects and ensures they're created in valid states. Customise objects using extension functions, not `.copy()` - extension functions provide a stable public API that makes tests resilient to refactoring. The `fabricate` library handles primitive types and simple value objects.

Avoid hardcoding specific values unless they're meaningful for the test. Let Gen provide sensible defaults.
