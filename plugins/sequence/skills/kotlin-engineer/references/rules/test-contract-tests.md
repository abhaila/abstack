---
title: Contract Tests for In-Memory Doubles
impact: HIGH
impactDescription: ensures fakes behave identically to real implementations, catches production bugs at unit test speed
tags: testing, contract-tests, in-memory, fakes, ports
---

## Contract Tests for In-Memory Doubles

**Impact: HIGH (ensures fakes behave identically to real implementations, catches production bugs at unit test speed)**

Every in-memory double MUST have a contract test that both the fake and real implementation pass. Without contract tests, fakes drift from production behaviour, causing tests to pass while production fails.

### The Contract Test Pattern

Define an abstract test class specifying the expected behaviour. Both the in-memory fake and the real adapter extend this contract:

```kotlin
abstract class OrderRepositoryContract {
    abstract val repository: Orders

    @Test
    fun `saves and retrieves orders`() {
        val order = anOrder()
        repository.save(order)
        assertThat(repository.findById(order.id)).isEqualTo(order)
    }

    @Test
    fun `throws when order not found`() {
        assertThrows<OrderNotFound> { repository.findById(OrderId.random()) }
    }

    @Test
    fun `updates existing order`() {
        val order = anOrder(status = OrderStatus.PENDING)
        repository.save(order)

        val updated = order.copy(status = OrderStatus.PAID)
        repository.save(updated)

        assertThat(repository.findById(order.id).status).isEqualTo(OrderStatus.PAID)
    }

    @Test
    fun `finds orders by status`() {
        val pending = anOrder(status = OrderStatus.PENDING)
        val paid = anOrder(status = OrderStatus.PAID)
        repository.save(pending)
        repository.save(paid)

        val results = repository.findByStatus(OrderStatus.PENDING)

        assertThat(results).containsExactly(pending)
    }

    @Test
    fun `delete removes order`() {
        val order = anOrder()
        repository.save(order)

        repository.delete(order.id)

        assertThrows<OrderNotFound> { repository.findById(order.id) }
    }
}
```

### Implementing the Contract

**In-memory fake test (runs in milliseconds):**

```kotlin
class InMemoryOrdersTest : OrderRepositoryContract() {
    override val repository = InMemoryOrders()

    @BeforeEach
    fun clear() {
        (repository as InMemoryOrders).clear()
    }
}
```

**Real adapter test (runs against database):**

```kotlin
@Tag("integration")
class ExposedOrdersTest : OrderRepositoryContract() {
    override val repository: Orders

    @BeforeAll
    fun setup() {
        repository = ExposedOrders(testDatabase)
    }

    @BeforeEach
    fun clearDatabase() {
        transaction { OrdersTable.deleteAll() }
    }
}
```

### What Contract Tests Must Cover

**Basic CRUD operations:**
- Save new entity
- Retrieve by ID
- Update existing entity
- Delete entity
- Not found behaviour

**Query operations:**
- Find by each query method
- Empty results when no matches
- Multiple results when applicable

**Constraint enforcement:**
- Uniqueness constraints
- Referential integrity (if applicable)
- Business rules enforced at persistence layer

```kotlin
abstract class AccountRepositoryContract {
    abstract val repository: AccountRepository

    @Test
    fun `rejects duplicate email`() {
        val account1 = anAccount(email = Email("test@example.com"))
        val account2 = anAccount(email = Email("test@example.com"))

        repository.save(account1)

        assertThrows<DuplicateEmailException> {
            repository.save(account2)
        }
    }

    @Test
    fun `rejects duplicate account id`() {
        val id = AccountId.random()
        val account1 = anAccount(id = id)
        val account2 = anAccount(id = id)

        repository.save(account1)

        assertThrows<AccountAlreadyExistsException> {
            repository.save(account2)
        }
    }
}
```

### In-Memory Fakes Must Enforce Constraints

The fake MUST replicate constraint behaviour from the real implementation:

```kotlin
class InMemoryAccountRepository : AccountRepository {
    private val accounts = mutableMapOf<AccountId, Account>()

    override fun save(account: Account) {
        // Enforce same constraints as database
        if (accounts.containsKey(account.id)) {
            throw AccountAlreadyExistsException(account.id)
        }
        if (accounts.values.any { it.email == account.email }) {
            throw DuplicateEmailException(account.email)
        }
        accounts[account.id] = account
    }

    override fun update(account: Account) {
        if (!accounts.containsKey(account.id)) {
            throw AccountNotFoundException(account.id)
        }
        // Check email uniqueness excluding current account
        if (accounts.values.any { it.email == account.email && it.id != account.id }) {
            throw DuplicateEmailException(account.email)
        }
        accounts[account.id] = account
    }
}
```

### Contract Tests for Service Ports

Apply the same pattern to external service ports:

```kotlin
abstract class PaymentGatewayContract {
    abstract val gateway: PaymentGateway

    @Test
    fun `processes valid payment`() {
        val result = gateway.charge(aValidCard(), Money(100))

        assertThat(result).isInstanceOf(Success::class.java)
        assertThat(result.orThrow().status).isEqualTo(PaymentStatus.CAPTURED)
    }

    @Test
    fun `rejects expired card`() {
        val result = gateway.charge(anExpiredCard(), Money(100))

        assertThat(result).isInstanceOf(Failure::class.java)
        assertThat(result.failureOrThrow()).isEqualTo(PaymentError.CardExpired)
    }

    @Test
    fun `rejects insufficient funds`() {
        val result = gateway.charge(aCardWithLimit(50), Money(100))

        assertThat(result).isInstanceOf(Failure::class.java)
        assertThat(result.failureOrThrow()).isEqualTo(PaymentError.InsufficientFunds)
    }
}

class InMemoryPaymentGatewayTest : PaymentGatewayContract() {
    override val gateway = InMemoryPaymentGateway()
}

@Tag("integration")
class StripePaymentGatewayTest : PaymentGatewayContract() {
    override val gateway = StripePaymentGateway(testApiKey)
}
```

### Event Publisher Contracts

```kotlin
abstract class EventPublisherContract {
    abstract val publisher: EventPublisher
    abstract fun getPublishedEvents(): List<DomainEvent>

    @Test
    fun `publishes events`() {
        val event = OrderCreated(OrderId.random())

        publisher.publish(event)

        assertThat(getPublishedEvents()).contains(event)
    }

    @Test
    fun `publishes multiple events in order`() {
        val event1 = OrderCreated(OrderId.random())
        val event2 = OrderPaid(OrderId.random())

        publisher.publish(event1)
        publisher.publish(event2)

        assertThat(getPublishedEvents()).containsExactly(event1, event2)
    }
}
```

### Key Points

- Every in-memory double MUST have a corresponding contract test
- Both fake and real implementation MUST pass the same contract
- Contract tests catch drift between fake and production behaviour
- Fakes MUST enforce the same constraints as real implementations
- Run fake contract tests with unit tests (fast)
- Run real contract tests as integration tests (tagged separately)
- When adding behaviour to a port interface, add contract tests first
