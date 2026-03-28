---
title: Use Result4k for Expected Failures
impact: HIGH
impactDescription: type-safe error handling, no hidden control flow
tags: error-handling, result4k, functional
---

## Use Result4k for Expected Failures

**Impact: HIGH (type-safe error handling, no hidden control flow)**

Use Result4k's `Result<T, E>` type for operations that can fail in expected ways. This makes error handling explicit at compile time and eliminates hidden control flow through exceptions.

**Incorrect (exceptions for expected failures):**

```kotlin
fun findQuoteViewTracking(id: QuoteViewTrackingId): QuoteViewTracking {
    val tracking = repository.findById(id)
        ?: throw QuoteViewTrackingNotFoundException("Tracking $id not found")
    return tracking
}

// Caller must remember to catch
try {
    val tracking = findQuoteViewTracking(id)
    processTracking(tracking)
} catch (e: QuoteViewTrackingNotFoundException) {
    // Handle error
}
```

**Correct (Result type):**

```kotlin
fun findQuoteViewTracking(id: QuoteViewTrackingId): Result4k<QuoteViewTracking, Exception> {
    return resultFrom {
        repository.findById(id)
            ?: throw NotFoundException("Tracking $id not found")
    }
}

// Compiler forces handling
findQuoteViewTracking(id)
    .map { tracking -> processTracking(tracking) }
    .peekFailure { error -> logger.error("Failed to find tracking", error) }
```

### Creating Results

```kotlin
// Direct creation when you know the outcome
val success: Result4k<Invoice, Exception> = Success(invoice)
val failure: Result4k<Invoice, Exception> = Failure(InvoiceError.NotFound(invoiceId))

// Wrapping potentially throwing code with resultFrom
val parsedResult: Result4k<Int, Exception> = resultFrom { "123".toInt() } // Success(123)
val failedResult: Result4k<Int, Exception> = resultFrom { "abc".toInt() } // Failure(NumberFormatException)
```

### Standard Result4k Operations

```kotlin
// map - transform success value (transformFn should not throw or return Result)
Success(invoice).map { it.total } // Success(total)
Failure(error).map { it.total } // Failure(error) - not executed

// flatMap - chain operations that might fail (transformFn returns Result)
quoteRepository.find(quoteId).flatMap { quote ->
    if (quote.status == QuoteStatus.DRAFT) Success(quote)
    else Failure(QuoteError.NotDraft(quoteId))
}

// mapFailure - transform error type
result.mapFailure { TaskError.TaskQueryFailure(it.message ?: "Unknown error") }

// flatMapFailure - recovery scenarios where failure can become success
Failure("transient_error")
    .flatMapFailure { error ->
        if (error == "transient_error") Success(defaultValue)
        else Failure(error)
    }

// recover - provide default on failure
result.recover { emptyList() }

// peekFailure - log errors without changing result
result.peekFailure { exception ->
    logger.error(tags("quoteId" to quoteId.toString()), "Failed to process quote", exception)
}

// orThrow - unwrap or throw (use at boundaries only)
Success(invoice).orThrow() // invoice
```

### Custom Extensions (from ResultExtensions.kt)

**Null handling:**

```kotlin
// recoverNull - recover when success value is null
result.recoverNull { fetchFromFallback() }

// notNullOrFailure - fail if success value is null
result.notNullOrFailure("Invoice must not be null")
result.notNullOrFailure(InvoiceNotFoundException(invoiceId))

// mapNotNull - map over nullable success value
result.mapNotNull { invoice -> invoice.total }

// flatMapNotNull - flatMap over nullable success value
result.flatMapNotNull { invoice -> calculateTotal(invoice) }

// orIfNull - provide fallback if success is null
result.orIfNull { fetchDefault() }
```

**List handling:**

```kotlin
// whenEmpty - recover when list is empty
result.whenEmpty { fetchFromCache() }

// notEmptyOrFailure - fail if list is empty
result.notEmptyOrFailure(NoInvoicesFoundException())

// resultsOrFailures - convert List<Result<T, E>> to Result<List<T>, E>
listOf(result1, result2, result3).resultsOrFailures()

// flatMapOver - flatMap a function over each element
result.flatMapOver { invoice -> processInvoice(invoice) }

// mapOver - map a function over list elements
result.mapOver { invoice -> invoice.total }

// singleOrFail - expect exactly one element
result.singleOrFail()
```

**Failure handling:**

```kotlin
// orElse - try alternative on failure
primaryResult.orElse { fallbackResult }

// handleException - handle specific exception type
result.handleException(NotFoundException::class) { Success(null) }

// flatMapException - flatMap on specific exception
result.flatMapException(ValidationException::class.java) { ex ->
    Failure(DomainError.ValidationFailed(ex.message))
}

// notFoundAsNull - convert Repository.NotFound to Success(null)
result.notFoundAsNull()
```

**Side effects:**

```kotlin
// peek - execute action on success (action should not throw)
result.peek { invoice -> println("Processing: $invoice") }

// peekFailure - execute action on failure (action should not throw)
result.peekFailure { error -> logger.error("Failed", error) }

// peekNotNull - side effect only if value is non-null
result.peekNotNull { invoice -> auditLog.record(invoice) }

// peekAlways - side effect on both success and failure
result.peekAlways { cleanupResources() }

// doOnSuccess - perform side effect that returns Result
result.doOnSuccess { invoice -> notifyCustomer(invoice) }

// doOnFailure - perform side effect on failure that returns Result
result.doOnFailure { error -> alertOps(error) }
```

**Parallel vs sequential side effects with doOnSuccess:**

```kotlin
// Parallel: guarantees every side effect is called, even if one fails
Success(invoice)
    .doOnSuccess { sendNotification(it) }
    .doOnSuccess { publishEvent(it) }

// Sequential: second side effect only runs if the first succeeds
Success(invoice)
    .doOnSuccess {
        sendNotification(it)
            .doOnSuccess { createAuditLog(it) }
    }
```

**Combining results:**

```kotlin
// zipFlatMap - combine multiple results
zipFlatMap(invoiceResult, customerResult) { invoice, customer ->
    createBillingRecord(invoice, customer)
}

// zipFlatMapSuspending - combine with suspend functions
zipFlatMapSuspending(invoiceResult, customerResult, merchantResult) { invoice, customer, merchant ->
    processPayment(invoice, customer, merchant)
}

// finaliseResults - combine into tuple
finaliseResults(a, b, c) // Result<Triple<A, B, C>, E>

// zip with failure aggregation
zip(r1, r2, r3, transform = { a, b, c -> Combined(a, b, c) }) { failures ->
    MultipleExceptions(failures)
}
```

**gRPC-specific (from grpc/Extensions.kt):**

```kotlin
// grpcNotFoundAsNull - convert gRPC NOT_FOUND to Success(null)
grpcClient.findInvoice(id).grpcNotFoundAsNull()

// grpcNotFoundAs - custom handling for NOT_FOUND
result.grpcNotFoundAs { createDefaultInvoice() }

// grpcUnwrapException - unwrap StatusException cause
result.grpcUnwrapException()
```

### Composing with resultFrom and orThrow

For complex operations with multiple steps, wrap the entire sequence in `resultFrom` and use `orThrow()` for intermediate steps. Any thrown exception is caught by `resultFrom`:

```kotlin
fun complexOperation(input: String): Result4k<Output, Exception> {
    return resultFrom {
        // Use orThrow() for intermediate steps within the block
        // Any thrown exception is caught by resultFrom
        val step1Result = step1(input)
            .mapFailure { Step1Error("Failed step 1: ${it.message}") }
            .orThrow()

        val step2Result = step2(step1Result)
            .mapFailure { Step2Error("Failed step 2: ${it.message}") }
            .orThrow()

        val finalResult = step3(step2Result)
            .mapFailure { Step3Error("Failed step 3: ${it.message}") }
            .orThrow()

        finalResult // The value of the last expression is the Success value
    }
}
```

### Composing Operations

```kotlin
override suspend fun execute(request: RecordQuoteViewRequest): Result4k<Unit, Exception> {
    val query = QuoteViewTrackingRepository.Query.byQuoteId(
        request.quoteId,
        request.sequenceAccountId
    )

    return transactor.blockingTransaction {
        quoteViewTrackingRepository.findMostRecentViewByVisitorIdentifier(
            visitorIdentifier = request.visitorIdentifier,
            query = query
        )
    }.peekFailure { exception ->
        logger.error(tags(
            "quoteId" to request.quoteId.toString(),
            "error" to exception.message
        ), "Failed to find most recent quote view", exception)
    }.flatMap { mostRecentView ->
        val shouldSave = mostRecentView?.let { recentView ->
            Duration.between(recentView.viewedAt, request.viewedAt) >= Duration.ofMinutes(5)
        } ?: true

        if (shouldSave) {
            val tracking = QuoteViewTracking.create(
                quoteId = request.quoteId,
                sequenceAccountId = request.sequenceAccountId,
                visitorIdentifier = request.visitorIdentifier,
                ipAddress = request.ipAddress,
                loginType = request.loginType
            )
            transactor.blockingTransaction {
                quoteViewTrackingRepository.save(tracking)
            }.map { Unit }
        } else {
            Success(Unit)
        }
    }
}
```

### Domain Errors with Sealed Classes

```kotlin
sealed class TaskError(message: String) : Exception(message) {
    data class InvalidInput(val reason: String) : TaskError("Input invalid: $reason")
    data class TaskNotFound(val taskId: TaskId?) : TaskError("Task not found: $taskId")
    data class TaskSaveFailure(val taskId: TaskId, val reason: String) : TaskError("Failed to save task $taskId: $reason")
    data class TaskQueryFailure(val reason: String) : TaskError("Task query failed: $reason")
}

fun validateTask(task: Task): Result4k<Task, Exception> {
    if (task.name.isBlank()) {
        return Failure(TaskError.InvalidInput("Task name cannot be blank"))
    }
    return Success(task)
}
```

### When to Use

**Use Result4k for:**
- Validation failures
- Not-found conditions
- Business rule violations
- External service failures
- Repository operations

**Use exceptions for:**
- Programming errors (bugs)
- Unrecoverable conditions
- Configuration errors at startup
