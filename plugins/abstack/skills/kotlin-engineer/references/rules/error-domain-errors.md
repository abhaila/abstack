---
title: Define Domain-Specific Error Types
impact: HIGH
impactDescription: clear error taxonomy, better error handling
tags: error-handling, domain, sealed-class
---

## Define Domain-Specific Error Types

**Impact: HIGH (clear error taxonomy, better error handling)**

### Errors vs Exceptions: Expected vs Unexpected

A critical distinction guides our error handling:

**Errors** represent **expected** failure conditions that are part of the normal flow of business logic or domain rules. They are predictable outcomes that the application should anticipate and handle gracefully. Examples include invalid user input, business rule violations (like insufficient stock), authentication failures, or attempting an operation on an object in an invalid state. Errors are often recoverable, potentially by the user correcting input or by the system trying an alternative path.

**Exceptions** represent **unexpected**, exceptional conditions that signal something has gone wrong at a system or environmental level, often indicating a bug or a problem outside the application's direct control. Examples include database connection failures, network timeouts, disk full errors, null pointer exceptions (which should be rare in Kotlin), configuration issues or external services not being available. Exceptions typically interrupt the normal flow and often require technical intervention (logging, alerting, potential retries).

### Modelling Expected Failures (Errors)

Create sealed class hierarchies for domain errors instead of using generic exceptions. This enables exhaustive when expressions and makes the error taxonomy explicit.

**Incorrect (generic exceptions):**

```kotlin
fun authenticateMagicLink(token: String): CustomerPortalUser {
    if (!isEnabled()) {
        throw RuntimeException("Feature disabled")
    }
    if (!isValidEmail(email)) {
        throw IllegalArgumentException("Invalid email")
    }
    // What exceptions can this throw? No way to know from signature
}
```

**Correct (sealed error hierarchy):**

```kotlin
sealed class MagicLinkError(message: String) : Exception(message) {
    data class NotEnabled(private val customerId: CustomerId) :
        MagicLinkError("Endpoint is not enabled for customer: ${customerId.value}")

    data class InvalidEmail(private val email: Email) :
        MagicLinkError("Email ${email.value} not authorized")

    data class StytchError(private val reason: String?) :
        MagicLinkError(if (reason == null) "Stytch client call failed due to unknown reason"
                       else "Stytch client call failed due to $reason")

    data class LinkExpiredOrUsed(
        private val requestId: StytchRequestId,
        private val errorMessage: String
    ) : MagicLinkError("Magic link has expired or already been used. requestId: $requestId, details: $errorMessage")

    data class CustomerNotFound(private val customerId: CustomerId) :
        MagicLinkError("Customer $customerId could not be found.")

    data class DatabaseFailure(private val reason: String?) :
        MagicLinkError(reason ?: "Unknown database error.")

    data class UnknownError(private val reason: String?, val errorCause: Throwable?) :
        MagicLinkError(reason ?: "Unknown error.")
}

// Function signature using the specific error type
fun authenticateMagicLink(token: String): Result4k<CustomerPortalUser, Exception> {
    // Clear what errors this can return
}

// Exhaustive handling
when (val error = result.failureOrNull()) {
    is MagicLinkError.NotEnabled -> // Return 403
    is MagicLinkError.InvalidEmail -> // Return 400
    is MagicLinkError.LinkExpiredOrUsed -> // Return 410
    is MagicLinkError.CustomerNotFound -> // Return 404
    is MagicLinkError.StytchError -> // Retry or alert
    is MagicLinkError.DatabaseFailure -> // Alert and return 500
    is MagicLinkError.UnknownError -> // Log and return 500
    null -> // Success case
}
```

### Error Messages: User-Facing vs Developer-Facing

**User-facing error messages** should be clear, helpful, non-technical, and avoid exposing internal system details:

```kotlin
// Good user-facing messages
"Invoice creation failed because the tax code 'TAX-VAT' does not exist. Please select a valid tax code."
"Unable to save customer details: The email address format is incorrect."
"Payment failed: Your card has expired. Please update your payment method."
"Cannot generate the report because no data is available for the selected date range."

// Poor user-facing messages (avoid)
"ERROR IN QuickbooksInvoiceCreator: FAILED TO CREATE INVOICE WITH TaxCode=null"
"NullPointerException at InvoiceServiceImpl.java:452"
"Error 500: Internal Server Error"
"VALIDATION_FAILED: ERR_CODE_4382"
```

**Developer-facing error messages** (for logs/debugging) should provide maximum context:

```kotlin
// Good exception messages for logs
"Failed to sync invoice to QuickBooks because the API request timed out after 30s. Check network connectivity or QuickBooks API status. invoiceId=inv_123 customerId=cust_456"
"Failed to recalculate invoice totals because of division by zero in tax calculation. Check line item quantities and prices. invoiceId=inv_789 lineItemId=li_001"
"Database connection failed after 3 retries. Verify DB credentials and network access. dbHost=db.example.com user=svc_app"

// Poor exception messages (avoid)
"Failed to sync invoice 1234 to QuickBooks because the request timed out. Please try again later."
"Customer ${customer.id} synchronisation failed"
"Invoice recalculation failed."
"Error processing request."
```

### Error with External Service Context

```kotlin
sealed class QuickbooksError(message: String, override val cause: Throwable?) :
    Exception(message, cause) {

    class EntityNotFound(val entityId: String, val entityType: String, cause: Throwable?) :
        QuickbooksError(
            "QuickBooks entity not found: type=$entityType id=$entityId",
            cause
        )

    class InvalidParameter(val paramName: String, val paramValue: String, val reason: String, cause: Throwable?) :
        QuickbooksError(
            "QuickBooks rejected parameter: $reason. parameter=$paramName, value=$paramValue",
            cause
        )

    class AuthenticationFailed(val reason: String, cause: Throwable?) :
        QuickbooksError(
            "Failed to authenticate with QuickBooks: $reason",
            cause
        )

    class ApiRateLimitExceeded(val retryAfterSeconds: Int?, cause: Throwable?) :
        QuickbooksError(
            "QuickBooks API rate limit exceeded." +
                (retryAfterSeconds?.let { " Try again in $it seconds." } ?: ""),
            cause
        )

    class UnknownApiError(val statusCode: Int, val responseBody: String?, cause: Throwable?) :
        QuickbooksError(
            "Unknown QuickBooks API error. Status=$statusCode",
            cause
        )
}
```

### Invoice Error Example

```kotlin
sealed class InvoiceError(message: String, cause: Throwable? = null) : Exception(message, cause) {

    class NotFound(val invoiceId: InvoiceId) : InvoiceError(
        "Invoice not found: $invoiceId"
    )

    class AlreadyFinalized(
        val invoiceId: InvoiceId,
        val finalizedAt: Instant
    ) : InvoiceError(
        "Invoice already finalized: id=$invoiceId, finalizedAt=$finalizedAt"
    )

    class InvalidStateTransition(
        val invoiceId: InvoiceId,
        val currentStatus: InvoiceStatus,
        val targetStatus: InvoiceStatus
    ) : InvoiceError(
        "Cannot transition invoice $invoiceId from $currentStatus to $targetStatus"
    )
}
```

### Guidelines

Domain errors should:
- Extend a sealed base class for exhaustive handling
- Include all relevant context data as properties
- Provide clear, informative messages for developers
- Preserve the original cause when wrapping exceptions
- Place variables at the end of messages for easier log aggregation (`key=value` format)
