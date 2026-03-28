---
title: Preserve Exception Causes
impact: HIGH
impactDescription: enables debugging, maintains stack trace
tags: error-handling, exceptions, debugging
---

## Preserve Exception Causes

**Impact: HIGH (enables debugging, maintains stack trace)**

When catching and re-throwing exceptions, always preserve the original cause. Lost causes make debugging nearly impossible in production.

**Incorrect (cause lost):**

```kotlin
try {
    quickbooksClient.syncInvoice(invoice)
} catch (e: Exception) {
    // Original error is lost!
    throw QuickbooksSyncException("Failed to sync invoice $invoiceId")
}

// In logs: QuickbooksSyncException: Failed to sync invoice inv_123
// No idea WHY it failed - was it a timeout? Invalid data? Auth error?
```

**Correct (cause preserved):**

```kotlin
try {
    quickbooksClient.syncInvoice(invoice)
} catch (e: Exception) {
    throw QuickbooksSyncException(
        "Failed to sync invoice to QuickBooks. invoiceId=$invoiceId customerId=$customerId",
        cause = e  // Original exception preserved
    )
}

// In logs: QuickbooksSyncException: Failed to sync invoice to QuickBooks. invoiceId=inv_123 customerId=cust_456
// Caused by: QuickbooksApiException: Rate limit exceeded
// Caused by: HttpException: 429 Too Many Requests
// Full stack trace available for debugging
```

**With Result4k:**

```kotlin
fun syncInvoiceToQuickbooks(invoice: Invoice): Result4k<QuickbooksInvoiceId, Exception> {
    return resultFrom {
        quickbooksClient.createInvoice(invoice)
    }.mapFailure { e ->
        QuickbooksError.UnknownApiError(
            statusCode = (e as? HttpException)?.statusCode ?: 0,
            responseBody = e.message,
            cause = e  // Preserve the cause
        )
    }
}
```

**Custom exception with cause:**

```kotlin
sealed class QuickbooksError(
    message: String,
    override val cause: Throwable?
) : Exception(message, cause) {

    class EntityNotFound(
        val entityId: String,
        val entityType: String,
        cause: Throwable?
    ) : QuickbooksError(
        "QuickBooks entity not found: type=$entityType id=$entityId",
        cause
    )

    class ApiRateLimitExceeded(
        val retryAfterSeconds: Int?,
        cause: Throwable?
    ) : QuickbooksError(
        "QuickBooks API rate limit exceeded." +
            (retryAfterSeconds?.let { " Try again in $it seconds." } ?: ""),
        cause
    )

    class UnknownApiError(
        val statusCode: Int,
        val responseBody: String?,
        cause: Throwable?
    ) : QuickbooksError(
        "Unknown QuickBooks API error. Status=$statusCode",
        cause
    )
}
```

**Include relevant context:**

```kotlin
// Incorrect: no context
throw InvoiceSyncException("Sync failed")

// Correct: full context with key=value format at the end
throw InvoiceSyncException(
    message = "Failed to sync invoice to QuickBooks because the API request timed out after 30s. " +
              "Check network connectivity or QuickBooks API status. " +
              "invoiceId=$invoiceId customerId=$customerId accountId=$accountId",
    cause = originalException
)
```

Always include: what operation failed, relevant IDs (at the end in `key=value` format), and the original cause.
