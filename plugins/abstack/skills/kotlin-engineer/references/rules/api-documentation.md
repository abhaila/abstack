---
title: Document APIs Clearly
impact: MEDIUM-HIGH
impactDescription: enables API consumers, reduces support burden
tags: api, documentation, openapi, contracts
---

## Document APIs Clearly

**Impact: MEDIUM-HIGH (enables API consumers, reduces support burden)**

API documentation should be accurate, complete, and follow consistent writing conventions. Use the `.openApiDescription` extension and `@JsonPropertyDescription` annotations.

### Endpoint Summaries

Summaries appear in navigation menus. Keep them concise, no punctuation.

**Rules for summaries:**
- Use articles: "Create a customer" not "Create customer"
- Use pronouns for singletons: "Get your Sequence account" not "Get a Sequence account"
- Skip articles for plural-only nouns: "Create payment settings" not "Create a payment setting"
- Capitalise real-world names (Sequence, Stripe) but not generic nouns (customer, invoice)
- Present tense, active voice
- No punctuation

**Incorrect (missing articles, wrong capitalisation):**

```kotlin
.openApiDescription {
    it.summary("Get invoice")
}
.openApiDescription {
    it.summary("List Customers")
}
.openApiDescription {
    it.summary("Create a Invoice Payment Setting")
}
```

**Correct (proper articles and capitalisation):**

```kotlin
.openApiDescription {
    it.summary("Get an invoice")
}
.openApiDescription {
    it.summary("List all customers")
}
.openApiDescription {
    it.summary("Create invoice payment settings")
}
.openApiDescription {
    it.summary("List your accounts")
}
```

### Endpoint Descriptions

Descriptions provide detail. They must be complete sentences with punctuation.

**Rules for descriptions:**
- Complete sentences with full stops
- Present tense
- Must differ from the summary - provide additional context
- Explain what the endpoint does, not just repeat the summary

**Incorrect (same as summary, not a sentence):**

```kotlin
.openApiDescription {
    it.summary("Get an invoice")
      .description("Get invoice by ID")
}
.openApiDescription {
    it.summary("List invoices for customer")
      .description("List invoices for customer")
}
```

**Correct (complete sentences, additional context):**

```kotlin
.openApiDescription {
    it.summary("Get an invoice")
      .description("Retrieve the full details of an invoice by its unique identifier.")
}
.openApiDescription {
    it.summary("List all invoices")
      .description("Returns a paginated list of invoices for the authenticated customer. Supports filtering by payment status and date range.")
}
.openApiDescription {
    it.summary("Create a billing schedule")
      .description("Creates a new billing schedule for the specified customer. The schedule defines when invoices are generated.")
}
```

### Model Attribute Descriptions

Use `@JsonPropertyDescription` to document request and response fields.

**Rules for attribute descriptions:**
- Complete sentences with full stops
- Present tense
- Explain what the field represents, not just its name

**Incorrect (not complete sentences):**

```kotlin
data class CustomerResponse(
    @JsonPropertyDescription("Unique ID")
    val id: CustomerId,

    @JsonPropertyDescription("Legal name")
    val legalName: String,

    @JsonPropertyDescription("Address")
    val address: Address?,

    @JsonPropertyDescription("Contact email address")
    val email: String
)
```

**Correct (complete sentences with context):**

```kotlin
data class CustomerResponse(
    @JsonPropertyDescription("The unique identifier for this customer.")
    val id: CustomerId,

    @JsonPropertyDescription("The customer's registered legal name.")
    val legalName: String,

    @JsonPropertyDescription("The customer's billing address. May be null if not yet provided.")
    val address: Address?,

    @JsonPropertyDescription("The primary email address for billing communications.")
    val email: String,

    @JsonPropertyDescription("True if Sequence should send invoice notifications to this customer on your behalf.")
    val sendCustomerNotifications: Boolean,

    @JsonPropertyDescription("Tax status applicable to this customer. Can be TAXED, TAX_EXEMPT, or REVERSE_CHARGED. Defaults to TAXED.")
    val taxStatus: TaxStatus
)
```

### Full Endpoint Example

```kotlin
fun getInvoiceEndpoint(useCase: GetInvoiceUseCase) =
    "/invoices" / InvoiceId.pathLens bindContract Method.GET to { invoiceId ->
        { request: Request ->
            useCase.execute(invoiceId)
                .map { invoice -> Response(Status.OK).with(Invoice.lens of invoice) }
                .recover { error -> error.toErrorResponse() }
        }
    }.openApiDescription {
        it.summary("Get an invoice")
          .description("Retrieve the full details of an invoice including line items, payment status, and amounts.")
          .returning(Status.OK, Invoice.lens to Invoice.example())
          .returning(Status.NOT_FOUND to "Invoice not found")
    }
```

### Key Principles

- Summaries: concise, no punctuation, proper articles
- Descriptions: complete sentences, differ from summary, provide context
- Attribute descriptions: complete sentences explaining the field's purpose
- Capitalise product names (Sequence, Stripe), not generic terms (customer, invoice)
- Present tense, active voice throughout
