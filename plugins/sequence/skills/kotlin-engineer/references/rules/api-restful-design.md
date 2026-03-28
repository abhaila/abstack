---
title: Follow RESTful API Design
impact: MEDIUM-HIGH
impactDescription: consistent APIs, better developer experience
tags: api, rest, http, design
---

## Follow RESTful API Design

**Impact: MEDIUM-HIGH (consistent APIs, better developer experience)**

Design APIs using RESTful principles with consistent resource naming, proper HTTP methods, and meaningful status codes. Each endpoint corresponds to a specific resource or collection with standard HTTP methods.

**Resource naming:**

Use kebab-case, plural nouns, no verbs in URLs:

```kotlin
// Incorrect: verbs in URLs, inconsistent casing
GET /api/getInvoices
POST /api/create-invoice
GET /api/find_customer/{id}

// Correct: nouns, plural, kebab-case
GET /api/invoices              // List invoices
POST /api/invoices             // Create invoice
GET /api/invoices/{invoiceId}  // Get single invoice
PUT /api/invoices/{invoiceId}  // Update invoice
DELETE /api/invoices/{invoiceId} // Delete invoice
```

**Nested resources:**

Resources should be logically nested to represent hierarchy:

```kotlin
// Correct: line items belong to an invoice
GET /api/invoices/{invoiceId}/line-items
POST /api/invoices/{invoiceId}/line-items

// Incorrect: implies line-items are top-level
GET /api/line-items/{invoiceId}
```

**CRUD vs side effects:**

Separate CRUD operations from actions that cause side effects:

```kotlin
// CRUD: updates invoice without side effects
PUT /api/invoices/{invoiceId}

// Side effect: sends invoice to customer (email, webhook, etc.)
POST /api/invoices/{invoiceId}/send-to-customer

// Side effect: archives the invoice
POST /api/invoices/{invoiceId}/archive
```

**HTTP methods:**

```kotlin
// GET - Retrieve resources (idempotent, no side effects)
GET /api/customers/{customerId}

// POST - Create resources or perform actions with side effects
POST /api/invoices
POST /api/invoices/{invoiceId}/send-to-customer

// PUT - Replace entire resource
PUT /api/invoices/{invoiceId}

// PATCH - Partial update (be careful with nullable fields)
PATCH /api/invoices/{invoiceId}

// DELETE - Remove resource
DELETE /api/invoices/{invoiceId}
```

**Status codes:**

```kotlin
// Success
200 OK          // Request succeeded
201 Created     // New resource created
202 Accepted    // Request accepted, processing async
204 No Content  // Success with no response body

// Client errors
400 Bad Request           // Malformed request syntax
401 Unauthorized          // Missing/invalid authentication
403 Forbidden             // Authenticated but not authorised
404 Not Found             // Resource doesn't exist
409 Conflict              // State conflict (e.g., already exists)
422 Unprocessable Entity  // Validation failed

// Server errors
500 Internal Server Error // Unexpected error
503 Service Unavailable   // Temporary unavailability
```

**Endpoint implementation with openApiRoute:**

```kotlin
class GetInvoiceEndpoint(
    private val getInvoiceUseCase: GetInvoiceUseCase
) : VersionedOpenApiEndpoint {

    private val invoiceId = Path.uuid().map(::InvoiceId).of("invoiceId")

    override val route: OpenApiRoute =
        openApiRoute(root() / "invoices" / invoiceId)
            .method(Method.GET)
            .handler { id ->
                httpHandler4k {
                    getInvoiceUseCase.execute(id)
                        .mapToResponse(Status.OK, Invoice.lens)
                }.toHttpHandler()
            }
            .openApiDescription {
                it.summary("Get an invoice")
                    .description("Retrieve the full details of an invoice by its unique identifier.")
                    .returning(Status.OK, Invoice.lens to Invoice.example())
                    .returning(Status.NOT_FOUND to "Invoice not found")
            }
}
```

**Versioning:**

Use the `Sequence-Version` header for API versioning:

```kotlin
// Client specifies version in header
Sequence-Version: 2024-01-01

// If header missing, defaults to most recent version
```

**Cursor-based pagination:**

Use `limit`, `after`, and `before` parameters:

```kotlin
// Request
GET /api/invoices?limit=20&after=cursor_abc123

// Response wraps items with pagination metadata
{
    "items": [...],
    "pagination": {
        "after": "cursor_xyz789",
        "before": "cursor_abc123",
        "totalCount": 150
    }
}
```

```kotlin
override val route: OpenApiRoute =
    openApiRoute(root() / "invoices")
        .method(Method.GET)
        .handler {
            httpHandler4k {
                listInvoicesUseCase.execute(paginationRequest)
                    .mapToResponse(Status.OK, ResponseModel.lens)
            }.toHttpHandler()
        }
        .openApiDescription {
            it.summary("List all invoices")
                .description("Returns a paginated list of invoices for the authenticated account.")
                .addQueries(PaginationQueries.all)
                .addQueries(listOf(statusFilter, dueDateFilter))
                .returning(Status.OK, ResponseModel.lens to ResponseModel.example())
        }
```

**Key principles:**

- Statelessness: each request includes all necessary information
- Uniform interface: standard HTTP methods for standard operations
- Resource-based URLs: nouns not verbs, plural forms
- Separate CRUD from side effects
- Consistent error responses across all endpoints
