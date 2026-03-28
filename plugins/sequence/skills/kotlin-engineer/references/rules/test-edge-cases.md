---
title: Cover Edge Cases Comprehensively
impact: MEDIUM
impactDescription: catches real bugs, prevents production issues
tags: testing, edge-cases, coverage, boundary-values
---

## Cover Edge Cases Comprehensively

**Impact: MEDIUM (catches real bugs, prevents production issues)**

Every function should be tested with its happy path and all edge cases. Fast tests are worthless if they don't catch bugs. Comprehensive coverage includes edge cases, error conditions, boundary values, and state-dependent behaviour.

**Think about:**

- Boundary values: empty collections, zero, maximum values
- Null or absent data: missing optional fields
- Error conditions: validation failures, business rule violations
- State-dependent behaviour: operation not allowed in current state
- Concurrent scenarios: if applicable, what happens with concurrent access

**Example comprehensive test coverage:**

```kotlin
@Nested
inner class InvoiceFinalization {
    @Test
    fun `should finalize valid draft invoice`() {
        val invoice = Gen.invoice()
            .withStatus(InvoiceStatus.DRAFT)
            .withLineItems(listOf(Gen.lineItem()))

        val result = invoice.finalize().orThrow()

        assertEquals(InvoiceStatus.FINAL, result.status)
    }

    @Test
    fun `should fail when already finalized`() {
        val invoice = Gen.invoice().withStatus(InvoiceStatus.FINAL)

        assertThrows<InvoiceError.AlreadyFinalized> {
            invoice.finalize().orThrow()
        }
    }

    @Test
    fun `should fail when invoice has no line items`() {
        val invoice = Gen.invoice()
            .withStatus(InvoiceStatus.DRAFT)
            .withLineItems(emptyList())

        assertThrows<InvoiceError.NoLineItems> {
            invoice.finalize().orThrow()
        }
    }

    @Test
    fun `should fail when invoice total is negative`() {
        val negativeItem = Gen.lineItem().withAmount(BigDecimal("-100.00"))
        val invoice = Gen.invoice()
            .withStatus(InvoiceStatus.DRAFT)
            .withLineItems(listOf(negativeItem))

        assertThrows<InvoiceError.NegativeTotal> {
            invoice.finalize().orThrow()
        }
    }

    @Test
    fun `should fail when invoice is voided`() {
        val invoice = Gen.invoice().withStatus(InvoiceStatus.VOIDED)

        assertThrows<InvoiceError.InvalidStatus> {
            invoice.finalize().orThrow()
        }
    }
}
```

**Use @Nested for organisation:**

Use `@Nested` inner classes to group related test scenarios. This keeps tests organised and makes it easy to see what scenarios are covered.

**Use @ParameterizedTest for variations:**

```kotlin
@ParameterizedTest
@ValueSource(strings = [
    "plainaddress",
    "@missinglocalpart.com",
    "test@.com",
    "",
])
fun `should reject invalid email formats`(invalidEmail: String) {
    assertThrows<ValidationError> {
        EmailAddress.of(invalidEmail).orThrow()
    }
}
```

**Key points:**

When writing tests, think about what could go wrong - null inputs, empty collections, maximum values, concurrent access, external failures. Don't just test the happy path.
