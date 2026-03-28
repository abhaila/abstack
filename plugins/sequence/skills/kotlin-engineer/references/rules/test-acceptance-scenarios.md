---
title: Use Scenario Builders for Acceptance Testing
impact: MEDIUM
impactDescription: enables fast isolated tests, decouples tests from implementation
tags: testing, acceptance, scenarios, given-when-then, bdd
---

## Use Scenario Builders for Acceptance Testing

**Impact: MEDIUM (enables fast isolated tests, decouples tests from implementation)**

Use scenario builders with nested given/when/then scopes for acceptance tests. This pattern provides fast, isolated tests that focus on observable behaviour rather than implementation details.

**The scenario builder pattern:**

```kotlin
class DeprecateBillingRunsTest : DeprecateBillingRunsTestBase() {

    @Test
    fun `should deprecate all billing runs for a schedule`() = deprecationScenario {
        val scheduleAggregate = fabricate<BillingScheduleAggregate>()
        val run1 = fabricate<BillingRun>().copy(
            billingScheduleId = scheduleAggregate.id,
            status = BillingRunStatus.SCHEDULED
        )
        val run2 = fabricate<BillingRun>().copy(
            billingScheduleId = scheduleAggregate.id,
            status = BillingRunStatus.COMPLETED
        )

        given {
            schedule { schedule(scheduleAggregate) }
            billingRun {
                storedBillingRun(run1)
                storedBillingRun(run2)
            }
        }

        `when` {
            command { deprecateRuns.execute(scheduleAggregate.id) }
        }

        then {
            billingRun {
                totalBillingRuns(2)
                billingRunsWithStatus(BillingRunStatus.DEPRECATED, 2)
            }
        }
    }
}
```

**Scenario builder structure:**

```kotlin
class DeprecateBillingRunsScenarioBuilder(
    private val scheduleInfra: BillingScheduleScenarioInfrastructure,
    private val runInfra: BillingRunScenarioInfrastructure,
    private val commandInfra: CommandScenarioInfrastructure,
    private val testScope: TestScope
) {
    fun given(block: DeprecationGivenScope.() -> Unit): DeprecateBillingRunsScenarioBuilder {
        val scope = DeprecationGivenScope(scheduleInfra, runInfra)
        scope.block()
        return this
    }

    suspend fun `when`(block: suspend DeprecationWhenScope.() -> Unit): DeprecateBillingRunsScenarioBuilder {
        val scope = DeprecationWhenScope(scheduleInfra, runInfra, commandInfra, testScope)
        scope.block()
        scope.advanceUntilIdle()
        return this
    }

    fun then(block: DeprecationThenScope.() -> Unit) {
        val scope = DeprecationThenScope(scheduleInfra, runInfra, commandInfra)
        scope.block()
    }
}
```

**Nested domain scopes:**

Each phase (given/when/then) provides access to multiple domain scopes:

```kotlin
class DeprecationGivenScope(
    private val scheduleInfra: BillingScheduleScenarioInfrastructure,
    private val runInfra: BillingRunScenarioInfrastructure
) {
    fun schedule(block: BillingScheduleGivenScope.() -> Unit) {
        BillingScheduleGivenScope(scheduleInfra).block()
    }

    fun billingRun(block: BillingRunGivenScope.() -> Unit) {
        BillingRunGivenScope(runInfra).block()
    }
}
```

**Domain-specific scopes:**

Given scopes handle setup:

```kotlin
class BillingRunGivenScope(private val infrastructure: BillingRunScenarioInfrastructure) {

    fun storedBillingRun(billingRun: BillingRun) {
        infrastructure.repository.insert(billingRun).orThrow()
    }

    fun billingRuns(vararg billingRuns: BillingRun) {
        billingRuns.forEach { infrastructure.repository.insert(it).orThrow() }
    }

    fun setCurrentTime(instant: Instant, zoneId: ZoneId = ZoneId.of("UTC")) {
        infrastructure.clock = Clock.fixed(instant, zoneId)
    }
}
```

Then scopes handle assertions:

```kotlin
class BillingRunThenScope(private val infrastructure: BillingRunScenarioInfrastructure) {

    private val repository: InMemoryBillingRunRepository
        get() = infrastructure.repository

    fun totalBillingRuns(expected: Int) {
        val actual = repository.count()
        if (actual != expected) {
            throw AssertionError("Expected $expected billing runs but found $actual")
        }
    }

    fun billingRunsWithStatus(status: BillingRunStatus, expected: Int) {
        val actual = repository.all().count { it.status == status }
        if (actual != expected) {
            throw AssertionError("Expected $expected billing runs with status $status but found $actual")
        }
    }

    fun eventsPublished(vararg eventTypes: KClass<*>) {
        infrastructure.publisher.verifyEvents(*eventTypes)
    }

    fun getRunsForSchedule(scheduleId: BillingScheduleId): List<BillingRun> {
        return repository.forBillingScheduleId(scheduleId).orThrow()
    }
}
```

**Infrastructure container:**

```kotlin
data class BillingRunScenarioInfrastructure(
    val repository: InMemoryBillingRunRepository,
    val publisher: TestPubSubPublisher,
    var clock: Clock,
    val accountId: SequenceAccountId
) {
    companion object {
        fun create(
            fixedInstant: Instant = Instant.parse("2024-01-01T00:00:00Z"),
            accountId: SequenceAccountId = SequenceAccountId.newId()
        ): BillingRunScenarioInfrastructure {
            return BillingRunScenarioInfrastructure(
                repository = InMemoryBillingRunRepository(accountId),
                publisher = TestPubSubPublisher(),
                clock = Clock.fixed(fixedInstant, ZoneId.of("UTC")),
                accountId = accountId
            )
        }
    }

    fun createCrudService(scope: CoroutineScope): BillingRunCrud {
        return BillingRunCrud(repository = repository, publisher = publisher, scope = scope)
    }
}
```

**Test base class:**

```kotlin
abstract class DeprecateBillingRunsTestBase {

    protected fun deprecationScenario(
        fixedInstant: Instant = Instant.parse("2024-01-01T00:00:00Z"),
        accountId: SequenceAccountId = SequenceAccountId.newId(),
        block: suspend DeprecateBillingRunsScenarioBuilder.() -> Unit
    ) = runTest {
        val scheduleInfra = BillingScheduleScenarioInfrastructure.create(fixedInstant, accountId)
        val runInfra = BillingRunScenarioInfrastructure.create(fixedInstant, accountId)
        val commandInfra = CommandScenarioInfrastructure.create(scheduleInfra, runInfra)

        val builder = DeprecateBillingRunsScenarioBuilder(
            scheduleInfra, runInfra, commandInfra, this
        )
        builder.block()
    }
}
```

**Why this pattern over mocks:**

Traditional mock-based tests couple to implementation:

```kotlin
// BAD: Coupled to repository method signatures
@Test
fun test() {
    database.stub {
        on { findByAttributes(run) } doReturn Success(existing)
        on { insert(run) } doReturn Success(run)
    }
    verify(database).insert(run)  // Breaks if method renamed
}
```

Scenario builders decouple tests from implementation:

```kotlin
// GOOD: Coupled to behaviour, not implementation
@Test
fun test() = deprecationScenario {
    given { billingRun { storedBillingRun(existing) } }
    `when` { command { deprecateRuns.execute(scheduleId) } }
    then { billingRun { billingRunsWithStatus(DEPRECATED, 1) } }
}
```

When repository methods change, only scope implementations need updating - not every test.

**Benefits:**
- Sub-millisecond execution (no database, no Spring context)
- Complete test isolation (fresh infrastructure per test)
- No shared state between tests
- Type-safe DSL with IDE autocomplete
- Tests describe behaviour, not implementation
- Easy to extend with new domains
