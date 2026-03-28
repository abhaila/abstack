---
title: Use Consistent Error Response Structure
impact: MEDIUM-HIGH
impactDescription: predictable error handling for API consumers
tags: api, error-handling, json
---

## Use Consistent Error Response Structure

**Impact: MEDIUM-HIGH (predictable error handling for API consumers)**

Return errors in a consistent JSON structure that includes type, message, and optional field-level details. Never leak internal exceptions or third-party error messages directly.

**Error response structure:**

```json
{
  "error": {
    "type": "validationError",
    "message": "Data validation failed",
    "detail": "One or more fields failed validation.",
    "errors": [
      {
        "code": "invalidFormat",
        "message": "Incorrect date format",
        "key": "startDate",
        "detail": "The start date must be in YYYY-MM-DD format."
      },
      {
        "code": "required",
        "message": "Field is required",
        "key": "customerId"
      }
    ]
  }
}
```

**Implementation:**

```kotlin
data class ApiError(
    val type: String,
    val message: String,
    val detail: String? = null,
    val errors: List<FieldError>? = null
)

data class FieldError(
    val code: String,
    val message: String,
    val key: String? = null,
    val detail: String? = null
)

fun InvoiceError.toResponse(): Response {
    return when (this) {
        is InvoiceError.NotFound -> Response(Status.NOT_FOUND)
            .with(errorLens of ApiError(
                type = "notFound",
                message = "Invoice not found",
                detail = "Invoice with ID ${invoiceId.value} does not exist"
            ))

        is InvoiceError.ValidationFailed -> Response(Status.UNPROCESSABLE_ENTITY)
            .with(errorLens of ApiError(
                type = "validationError",
                message = "Validation failed",
                errors = violations.map { FieldError(
                    code = it.code,
                    message = it.message,
                    key = it.field
                )}
            ))

        is InvoiceError.AlreadyFinalized -> Response(Status.CONFLICT)
            .with(errorLens of ApiError(
                type = "conflict",
                message = "Invoice already finalized",
                detail = "Invoice was finalized at ${finalizedAt}"
            ))
    }
}
```

**Never leak internal errors:**

```kotlin
// Incorrect: exposes internal details
catch (e: SQLException) {
    Response(Status.INTERNAL_SERVER_ERROR)
        .body(e.message) // "ORA-00001: unique constraint violated"
}

// Correct: user-friendly message, log details internally
catch (e: SQLException) {
    logger.error("Database error", e)
    Response(Status.INTERNAL_SERVER_ERROR)
        .with(errorLens of ApiError(
            type = "serverError",
            message = "An unexpected error occurred. Please try again."
        ))
}
```

**Never expose third-party errors:**

```kotlin
// Incorrect: leaks Stripe error
catch (e: StripeException) {
    Response(Status.BAD_GATEWAY)
        .body(e.message)
}

// Correct: wrap in domain error
catch (e: StripeException) {
    logger.error("Stripe error", e)
    Response(Status.BAD_GATEWAY)
        .with(errorLens of ApiError(
            type = "paymentError",
            message = "Payment processing failed. Please try again."
        ))
}
```
