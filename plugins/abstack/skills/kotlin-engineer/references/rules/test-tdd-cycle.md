---
title: Follow the TDD Red-Green-Refactor Cycle
impact: MEDIUM
impactDescription: ensures test coverage, guides design, enables confident refactoring
tags: testing, tdd, red-green-refactor
---

## Follow the TDD Red-Green-Refactor Cycle

**Impact: MEDIUM (ensures test coverage, guides design, enables confident refactoring)**

Write tests before implementation code. Follow the Red-Green-Refactor cycle: write a failing test, make it pass with minimal code, then improve the design.

**The cycle:**

```kotlin
// 1. RED: Write a failing test
@Test
fun `should calculate invoice total from line items`() {
    val item1 = Gen.lineItem().withAmount(BigDecimal("100.00"))
    val item2 = Gen.lineItem().withAmount(BigDecimal("50.00"))

    val invoice = Invoice.create(listOf(item1, item2)).orThrow()

    assertEquals(BigDecimal("150.00"), invoice.total)
}
// Test fails: Invoice.create doesn't exist yet

// 2. GREEN: Write minimal code to pass
data class Invoice(
    val lineItems: List<LineItem>,
    val total: BigDecimal
) {
    companion object {
        fun create(lineItems: List<LineItem>): Result<Invoice, Exception> {
            val total = lineItems.sumOf { it.amount }
            return Success(Invoice(lineItems, total))
        }
    }
}
// Test passes

// 3. REFACTOR: Improve without changing behaviour
data class Invoice private constructor(
    val id: InvoiceId,
    val lineItems: List<LineItem>,
    val total: BigDecimal,
    val status: InvoiceStatus
) {
    companion object {
        fun create(lineItems: List<LineItem>): Result<Invoice, Exception> {
            return resultFrom {
                require(lineItems.isNotEmpty()) { "Invoice must have line items" }
                Invoice(
                    id = InvoiceId.newId(),
                    lineItems = lineItems,
                    total = calculateTotal(lineItems),
                    status = InvoiceStatus.DRAFT
                )
            }.mapFailure { InvoiceError.ValidationFailed(it.message) }
        }

        private fun calculateTotal(lineItems: List<LineItem>): BigDecimal =
            lineItems.sumOf { it.amount }
    }
}
// Test still passes
```

**Test structure (Arrange-Act-Assert):**

```kotlin
@Test
fun `should reject order when customer is inactive`() = scenario {
    // Arrange: set up preconditions
    val customer = Gen.customer().withStatus(CustomerStatus.INACTIVE)
    customerRepository.seed(customer)

    // Act: execute the behaviour
    val result = createOrderUseCase.execute(
        CreateOrderCommand(customerId = customer.id, items = listOf(Gen.orderItem()))
    )

    // Assert: verify the outcome
    assertTrue(result is Failure)
    assertEquals(OrderError.InactiveCustomer, (result as Failure).reason)
}
```

**Test naming:**

```kotlin
// Use backticks for descriptive names starting with "should"
@Test
fun `should successfully process a valid order`() { }

@Test
fun `should return InsufficientStock error when quantity exceeds available`() { }

@Test
fun `should apply discount when customer has loyalty status`() { }
```

**What to test:**

Write tests for:
- Happy path: the primary success scenario
- Edge cases: empty collections, boundary values
- Error conditions: validation failures, business rule violations
- State transitions: operations not allowed in certain states
