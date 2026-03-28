# Example: Concept Documentation

This example shows how to document a domain concept with scenarios and tables.

```markdown
[← Back to Index](./index.md)

## 11. Standard (Fixed) Pricing

Standard pricing, also known as fixed pricing, is the simplest pricing model in the billing engine. It charges a flat, predetermined amount for each billing cycle, regardless of usage or consumption.

### 11.1 What is Fixed Pricing?

Fixed pricing represents a recurring flat-rate charge applied to each billing period. Unlike usage-based pricing that varies with consumption, fixed pricing provides predictable, consistent billing for both the provider and customer.

**Scenario: Monthly support plan charges fixed amount regardless of usage**

* **Given** a customer subscribes to a monthly support plan at £500/month
* **When** a fixed price is configured for this subscription
* **Then** the customer is charged exactly £500 each billing cycle
  * And the charge does not vary based on how much support they consume

**Scenario: Yearly software licence charges annually regardless of usage frequency**

* **Given** a customer has a yearly software licence at £12,000/year
* **When** a fixed price is configured with yearly billing frequency
* **Then** the customer is charged £12,000 once per year
  * And the amount remains constant regardless of how frequently they use the software

### 11.2 Fixed Pricing Structure

The fixed pricing structure is intentionally minimal, containing only the essential information needed to generate charges.

| Field | Type | Description |
|-------|------|-------------|
| price | Decimal | The fixed amount charged on each billing cycle. Must be a positive decimal value. |

This simplicity is by design. The billing frequency, timing, and revenue recognition are determined by the price configuration that contains this structure, not by the structure itself.

### 11.3 Configuration Options

#### Billing Frequency

Determines how often the fixed amount is charged.

| Frequency | Interval | Description |
|-----------|----------|-------------|
| MONTHLY | 1 month | Charged once per month |
| QUARTERLY | 3 months | Charged once per quarter |
| HALF_YEARLY | 6 months | Charged once every six months |
| YEARLY | 12 months | Charged once per year |

**Scenario: Monthly frequency results in 12 charges per year**

* **Given** a fixed price of £300 with MONTHLY frequency
* **When** billing runs execute over a calendar year
* **Then** £300 is charged 12 times during the year
  * And total annual charges equal £3,600

#### Billing Type

Determines when the charge is recognised relative to the service period.

| Type | Revenue Recognition | Description |
|------|---------------------|-------------|
| IN_ADVANCE | PREPAYMENT | Charged before the service period begins |
| IN_ARREARS | EARNED | Charged after the service period ends |

**Scenario: In advance billing charges before service delivery**

* **Given** a fixed price of £500/month billed IN_ADVANCE
* **When** the January billing run executes
* **Then** the charge appears on the January invoice
  * And the service period is January 1-31
  * And revenue is classified as PREPAYMENT

---

[← Previous Section](./10-billing-periods.md) | [Next Section →](./12-one-time-pricing.md)
```
