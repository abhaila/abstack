---
title: Avoid Mocks - Use In-Memory Doubles
impact: HIGH
impactDescription: mocks couple tests to implementation, break on refactoring, hide design problems
tags: testing, mocks, test-doubles, in-memory
---

## Avoid Mocks - Use In-Memory Doubles

**Impact: HIGH (mocks couple tests to implementation, break on refactoring, hide design problems)**

Mocking frameworks (Mockito, MockK) create brittle tests that verify implementation details rather than behaviour. When tests mock dependencies and verify interactions, any refactoring breaks the tests even when behaviour is preserved. Use in-memory doubles or stubs instead.

### Decision Tree for Mock Usage

**Creating a new test file?**
Mocks are NOT allowed. You MUST use in-memory doubles or stubs. No exceptions.

**Working in an existing test file with mocks?**
Follow this order:

1. **Consider structural refactor first** - Can you replace the mocks with in-memory doubles? If the interface is mockable, you can write an in-memory implementation. Do this refactor before adding new tests.

2. **If refactor is not feasible** - Write your new tests without mocks. Use in-memory doubles for your new test cases even if existing tests use mocks.

3. **If that's not possible** - Keep mock usage minimal. Mock only the specific dependency you cannot easily stub. Never add more mocks than absolutely necessary.

### Why Mocks Are Harmful

**Mocks verify implementation, not behaviour:**

```kotlin
// BAD: Mock verifies HOW the code works
@Test
fun `should save invoice`() {
    val repository = mockk<InvoiceRepository>()
    every { repository.save(any()) } returns Success(invoice)

    service.createInvoice(request)

    // This breaks if you refactor to batch saves
    verify(exactly = 1) { repository.save(any()) }
}
```

**In-memory doubles verify WHAT the code does:**

```kotlin
// GOOD: In-memory double verifies the outcome
@Test
fun `should save invoice`() {
    val repository = InMemoryInvoiceRepository()
    val service = InvoiceService(repository)

    service.createInvoice(request).orThrow()

    // Verifies the invoice exists - doesn't care how it got there
    val saved = repository.findById(invoiceId).orThrow()
    assertEquals(InvoiceStatus.DRAFT, saved.status)
}
```

**Mocks hide design problems:**

If a class is hard to test without mocks, the design is wrong. Difficulty testing indicates:
- Too many dependencies (violates single responsibility)
- Dependencies that are too concrete (violates dependency inversion)
- Missing interfaces at boundaries

Fix the design rather than papering over it with mocks.

**Mocks make tests unreadable:**

```kotlin
// BAD: Mock setup obscures test intent
@Test
fun `should calculate total`() {
    val priceService = mockk<PriceService>()
    val taxService = mockk<TaxService>()
    val discountService = mockk<DiscountService>()

    every { priceService.getPrice(any()) } returns Money(100)
    every { taxService.calculate(any()) } returns Money(20)
    every { discountService.apply(any(), any()) } returns Money(10)

    // What is this test actually verifying?
    val result = calculator.calculate(order)

    verify { priceService.getPrice(any()) }
    verify { taxService.calculate(any()) }
}
```

```kotlin
// GOOD: Clear setup, clear assertion
@Test
fun `should calculate total with tax and discount`() = scenario {
    val order = Gen.order()
        .withLineItem(price = Money(100))
        .withTaxRate(TaxRate(0.20))
        .withDiscount(Discount.percentage(10))

    val result = calculator.calculate(order)

    // 100 + 20 tax - 10 discount = 110
    assertEquals(Money(110), result.total)
}
```

### Creating In-Memory Doubles

For any interface you would mock, create an in-memory implementation:

```kotlin
// Interface in domain layer
interface NotificationService {
    fun send(notification: Notification): Result<Unit, NotificationError>
}

// In-memory double in test code
class InMemoryNotificationService : NotificationService {
    private val sent = mutableListOf<Notification>()

    override fun send(notification: Notification): Result<Unit, NotificationError> {
        sent.add(notification)
        return Success(Unit)
    }

    fun getSentNotifications(): List<Notification> = sent.toList()

    fun clear() = sent.clear()
}
```

### Acceptable Stub Usage

Simple stubs that return fixed values are acceptable when:
- The dependency is a pure query with no side effects
- You need to control the return value for a specific test scenario

```kotlin
// Acceptable: Simple stub for time
class FixedClock(private val fixed: Instant) : Clock {
    override fun now(): Instant = fixed
}

// Acceptable: Stub that fails for error path testing
class FailingRepository : InvoiceRepository {
    override fun findById(id: InvoiceId) = Failure(DatabaseError("Connection failed"))
    override fun save(invoice: Invoice) = Failure(DatabaseError("Connection failed"))
}
```

### Key Points

- New test files: NO mocks allowed
- Existing files with mocks: refactor to in-memory doubles when possible
- If you cannot refactor: write new tests without mocks
- If you cannot avoid mocks entirely: minimise mock usage
- Mocks that verify interactions (verify calls) are always wrong
- In-memory doubles that capture state for assertion are always right
