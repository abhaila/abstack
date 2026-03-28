---
title: Use Value Objects for Domain Concepts
impact: CRITICAL
impactDescription: eliminates primitive obsession, adds type safety
tags: domain, value-object, type-safety, values4k
---

## Use Value Objects for Domain Concepts

**Impact: CRITICAL (eliminates primitive obsession, adds type safety)**

Wrap primitive types in Value Objects to add semantic meaning, enable validation, and prevent mixing up different concepts that share the same underlying type.

**Incorrect (primitive obsession):**

```kotlin
fun processInvoice(invoiceId: String, customerId: String, amount: BigDecimal)

// Easy to swap parameters accidentally
processInvoice(customerId, invoiceId, price) // Compiles but wrong!
```

**Correct (type-safe value objects):**

```kotlin
data class InvoiceId(
    @get:JsonValue override val value: UUID
) : ComparableValue<InvoiceId, UUID> {
    constructor(id: String) : this(UUID.fromString(id))

    override fun toString(): String = value.toString()

    companion object {
        fun newId(): InvoiceId = InvoiceId(Uuids.uuidV7())
    }
}

data class CustomerId(
    @get:JsonValue override val value: UUID
) : ComparableValue<CustomerId, UUID> {
    constructor(id: String) : this(UUID.fromString(id))

    override fun toString(): String = value.toString()

    companion object {
        fun newId(): CustomerId = CustomerId(Uuids.uuidV7())
    }
}

data class MonetaryAmount(val amount: BigDecimal, val currency: Currency) {
    operator fun plus(other: MonetaryAmount): MonetaryAmount {
        require(currency == other.currency) { "Cannot add different currencies" }
        return MonetaryAmount(amount + other.amount, currency)
    }
}

fun processInvoice(invoiceId: InvoiceId, customerId: CustomerId, total: MonetaryAmount)

// Compiler catches the mistake
processInvoice(customerId, invoiceId, price) // Won't compile!
```

**ID value object pattern:**

```kotlin
import com.fasterxml.jackson.annotation.JsonValue
import com.sequencehq.uuids.Uuids.uuidV7
import dev.forkhandles.values.ComparableValue
import java.util.UUID

data class InvoiceId(
    @get:JsonValue override val value: UUID
) : ComparableValue<InvoiceId, UUID> {
    constructor(id: String) : this(UUID.fromString(id))

    override fun toString(): String = value.toString()

    companion object {
        fun newId(): InvoiceId = InvoiceId(uuidV7())
    }
}
```

Value Objects should be:
- Immutable (use `data class`)
- Extend `ComparableValue` for proper equality and comparison
- Include `@get:JsonValue` for JSON serialisation
- Provide `newId()` factory method using `Uuids.uuidV7()`
- Include string constructor for deserialisation
