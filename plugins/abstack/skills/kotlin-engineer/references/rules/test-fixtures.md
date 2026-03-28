---
title: Use Test Fixtures for Complex Scenarios
impact: MEDIUM
impactDescription: improves test readability, reduces duplication
tags: testing, fixtures, setup
---

## Use Test Fixtures for Complex Scenarios

**Impact: MEDIUM (improves test readability, reduces duplication)**

Use the scenario pattern with in-memory test doubles for tests requiring complex setup. Create fresh instances for each test to ensure isolation.

**The scenario pattern:**

```kotlin
class CustomerServiceTest {

    @Test
    fun `should deactivate active customer`() = scenario {
        // Arrange
        val customer = Gen.customer().withStatus(CustomerStatus.ACTIVE)
        customerRepository.seed(customer)

        // Act
        val result = service.deactivate(customer.id)

        // Assert
        assertTrue(result is Success)
        val saved = customerRepository.findById(customer.id).orThrow()
        assertEquals(CustomerStatus.INACTIVE, saved.status)
    }

    @Test
    fun `should return NotFound when customer does not exist`() = scenario {
        // Arrange - repository is empty

        // Act
        val result = service.deactivate(fabricate<CustomerId>())

        // Assert
        assertTrue(result is Failure)
        assertTrue((result as Failure).reason is CustomerError.NotFound)
    }

    @Test
    fun `should publish event when customer deactivated`() = scenario {
        // Arrange
        val customer = Gen.customer().withStatus(CustomerStatus.ACTIVE)
        customerRepository.seed(customer)

        // Act
        service.deactivate(customer.id)

        // Assert - verify observable outcome through in-memory double
        val events = eventPublisher.getPublishedEvents()
        assertTrue(events.any {
            it is CustomerDeactivated && it.customerId == customer.id
        })
    }

    private fun scenario(block: CustomerTestContext.() -> Unit) {
        CustomerTestContext().block()
    }

    private inner class CustomerTestContext {
        val customerRepository = InMemoryCustomerRepository()
        val eventPublisher = InMemoryEventPublisher()
        val service = CustomerService(customerRepository, eventPublisher)
    }
}
```

**In-memory test doubles:**

```kotlin
class InMemoryCustomerRepository : CustomerRepository {
    private val customers = mutableMapOf<CustomerId, Customer>()

    override fun findById(id: CustomerId): Result<Customer?, Exception> {
        return Success(customers[id])
    }

    override fun save(customer: Customer): Result<Customer, Exception> {
        customers[customer.id] = customer
        return Success(customer)
    }

    fun seed(vararg customers: Customer) {
        customers.forEach { this.customers[it.id] = it }
    }

    fun clear() {
        customers.clear()
    }
}

class InMemoryEventPublisher : EventPublisher {
    private val events = mutableListOf<Any>()

    override fun publish(event: Any) {
        events.add(event)
    }

    fun getPublishedEvents(): List<Any> = events.toList()

    fun clear() {
        events.clear()
    }
}
```

**Benefits:**
- Fresh context for each test ensures isolation
- In-memory doubles enable asserting on observable outcomes
- No mock verification calls that couple tests to implementation
- Tests survive refactoring as long as behaviour is preserved

**For integration tests with database:**

```kotlin
class InvoiceRepositoryIntegrationTest {

    @Test
    fun `should persist and retrieve invoice`() = scenario {
        // Arrange
        val invoice = Gen.invoice().withStatus(InvoiceStatus.DRAFT)

        // Act
        repository.save(invoice).orThrow()
        val retrieved = repository.findById(invoice.id).orThrow()

        // Assert
        assertEquals(invoice.id, retrieved?.id)
        assertEquals(invoice.status, retrieved?.status)
    }

    private fun scenario(block: IntegrationTestContext.() -> Unit) {
        IntegrationTestContext().use { it.block() }
    }

    private inner class IntegrationTestContext : AutoCloseable {
        val database = testDatabase()
        val repository = InvoiceRepositoryExposed(database, InvoicesDatabase())

        override fun close() {
            database.cleanUp()
        }
    }
}
```
