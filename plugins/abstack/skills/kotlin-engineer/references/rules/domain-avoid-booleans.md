---
title: Avoid Boolean Parameters and Flags
impact: HIGH
impactDescription: improves API clarity, prevents parameter confusion
tags: domain, boolean, enum, state, api-design
---

## Avoid Boolean Parameters and Flags

**Impact: HIGH (improves API clarity, prevents parameter confusion)**

Boolean parameters create ambiguous APIs where call sites are unclear. Use enums or sealed classes to make the intent explicit at the call site.

**Incorrect (ambiguous call site):**

```kotlin
fun processOrder(order: Order, sendEmail: Boolean, isRush: Boolean, applyDiscount: Boolean)

// What do these booleans mean?
processOrder(order, true, false, true)
```

**Correct (explicit intent):**

```kotlin
enum class OrderNotification { SEND_EMAIL, NO_NOTIFICATION }
enum class OrderPriority { STANDARD, RUSH }
enum class DiscountPolicy { APPLY_DISCOUNT, NO_DISCOUNT }

fun processOrder(
    order: Order,
    notification: OrderNotification,
    priority: OrderPriority,
    discount: DiscountPolicy
)

// Clear at the call site
processOrder(
    order,
    notification = OrderNotification.SEND_EMAIL,
    priority = OrderPriority.STANDARD,
    discount = DiscountPolicy.APPLY_DISCOUNT
)
```

**For state representation, use enums instead of boolean flags:**

```kotlin
// Incorrect: multiple booleans create invalid states
class PaymentProcess {
    private var isProcessing = false
    private var isCompleted = false
    private var isFailed = false
    // Can accidentally set isProcessing = true AND isCompleted = true
}

// Correct: enum enforces valid states
enum class PaymentState { PENDING, PROCESSING, COMPLETED, FAILED }

class PaymentProcess {
    private var state: PaymentState = PaymentState.PENDING
    // Impossible to be in multiple states at once
}
```

**For complex state with data:**

```kotlin
sealed class OrderStatus {
    object Pending : OrderStatus()
    object Confirmed : OrderStatus()
    data class Shipped(val trackingId: String, val carrier: String) : OrderStatus()
    data class Delivered(val deliveredAt: Instant) : OrderStatus()
    data class Cancelled(val reason: String, val cancelledAt: Instant) : OrderStatus()
}
```

This pattern makes invalid states unrepresentable and improves code readability at both definition and call sites.
