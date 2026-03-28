# Sample Queries and Expected Responses

This document provides example Q&A interactions to demonstrate how the billing-help skill should respond to various types of questions.

## Simple Definition Questions

### Example 1: What is proration?

**User Question:**
```
What is proration?
```

**Search Query:**
```
"proration"
```

**Expected Response:**
```
Proration calculates a proportional charge or credit when a subscription changes mid-cycle.

When a customer upgrades or downgrades their plan partway through a billing period,
Sequence calculates what portion of the old plan should be credited and what portion
of the new plan should be charged, based on the time remaining in the billing cycle.

For example, if a customer upgrades from a $100/month plan to a $200/month plan
exactly halfway through the month:
- Credit for unused time on old plan: $50 (half of $100)
- Charge for remaining time on new plan: $100 (half of $200)
- Net charge at upgrade: $50

**Sources:**
- [Proration Logic](https://notion.so/...) - Core proration calculation methodology
```

### Example 2: Explain graduated pricing

**User Question:**
```
Can you explain graduated pricing?
```

**Search Query:**
```
"graduated pricing"
```

**Expected Response:**
```
Graduated pricing is a tiered pricing model where different rate brackets apply to
different quantity ranges, similar to progressive tax brackets.

With graduated pricing, each unit is charged at the rate of the tier it falls into:
- Units 1-10: $10/unit
- Units 11-50: $8/unit
- Units 51+: $5/unit

For a customer using 60 units:
- First 10 units: 10 × $10 = $100
- Next 40 units: 40 × $8 = $320
- Final 10 units: 10 × $5 = $50
- Total: $470

This differs from volume pricing, where a single rate applies to all units based on
total quantity.

**Related Concepts:** Volume pricing, Package pricing, Usage-based billing

**Sources:**
- [Graduated Pricing Model](https://notion.so/...) - Detailed graduated pricing logic
- [Pricing Models Overview](https://notion.so/...) - Comparison of pricing models
```

## Process Questions

### Example 3: How does subscription renewal work?

**User Question:**
```
How does subscription renewal work?
```

**Search Query:**
```
"subscription renewal"
```

**Expected Response:**
```
Subscription renewals automatically bill customers at the end of each billing cycle
and extend the subscription for another period.

**Renewal Process:**
1. Renewal date calculated based on subscription start date and billing schedule
2. Invoice generated before renewal date (configurable lead time)
3. Payment processed on renewal date
4. Subscription extended for next billing period
5. Customer receives renewal confirmation

**Key Points:**
- Renewals use the current plan pricing (may differ from original if changed)
- Failed renewals trigger retry logic and dunning process
- Customers can modify or cancel before renewal to avoid charges
- Renewal invoices may include usage charges from the previous period

**Edge Cases:**
- Annual renewals on Feb 29 renew on Feb 28 in non-leap years
- Timezone matters: renewal date calculated in account's configured timezone
- Prorated periods renew based on original subscription start date

**Related Concepts:** Billing schedules, Failed payments, Subscription lifecycle

**Sources:**
- [Subscription Renewals](https://notion.so/...) - Renewal process details
- [Billing Schedules](https://notion.so/...) - Renewal timing and scheduling
```

## Comparison Questions

### Example 4: What's the difference between graduated and volume pricing?

**User Question:**
```
What's the difference between graduated and volume pricing?
```

**Search Query:**
```
"graduated volume pricing"
```

**Expected Response:**
```
Graduated and volume pricing are both tiered models, but they calculate charges
differently based on total quantity.

**Graduated Pricing:**
Each unit is charged at the rate of its tier:
- Units 1-10: $10/unit
- Units 11-50: $8/unit
- For 30 units: (10 × $10) + (20 × $8) = $260

**Volume Pricing:**
All units charged at the rate of the highest tier reached:
- Tier 1 (1-10 units): $10/unit for all units
- Tier 2 (11-50 units): $8/unit for all units
- For 30 units: 30 × $8 = $240

**Key Differences:**
- Graduated: Per-unit rate changes as quantity increases (incremental)
- Volume: Single rate applies to all units based on total (all-or-nothing)
- Graduated typically results in higher total costs for same quantity
- Volume provides stronger incentive for bulk purchasing

**When to Use:**
- Graduated: When you want gradual price reduction (like tax brackets)
- Volume: When you want to reward bulk purchases more aggressively

**Sources:**
- [Graduated Pricing Model](https://notion.so/...) - Graduated pricing details
- [Volume Pricing Model](https://notion.so/...) - Volume pricing details
- [Pricing Models Comparison](https://notion.so/...) - Side-by-side comparison
```

## Multi-Concept Questions

### Example 5: How do discounts work with graduated pricing?

**User Question:**
```
How do discounts work with graduated pricing?
```

**Search Query:**
```
"discounts graduated pricing"
```

**Expected Response:**
```
Discounts can be applied to graduated pricing in two ways: before tier calculation
or after final total.

**Discount Application Methods:**

1. **Post-Calculation Discount (Most Common):**
   - Calculate graduated pricing total first
   - Apply discount to final amount
   - Example: 20% discount on $470 total = $376

2. **Pre-Tier Adjustment:**
   - Modify tier rates before calculation
   - Each tier rate reduced by discount percentage
   - Recalculate with adjusted rates

**Example with 20% Discount:**

Graduated tiers:
- 1-10 units: $10/unit
- 11-50 units: $8/unit
- 51+ units: $5/unit

For 60 units with post-calculation discount:
- Base: (10×$10) + (40×$8) + (10×$5) = $470
- With 20% discount: $470 × 0.8 = $376

**Special Considerations:**
- Discount type affects calculation (percentage vs fixed amount)
- Fixed discounts always apply post-calculation
- Promotional codes typically use post-calculation
- Volume discounts may affect tier thresholds

**Related Concepts:** Volume pricing with discounts, Promotional pricing, Credits

**Sources:**
- [Discount Application](https://notion.so/...) - How discounts are calculated
- [Graduated Pricing Model](https://notion.so/...) - Graduated pricing mechanics
- [Discount Types](https://notion.so/...) - Percentage vs fixed discounts
```

## Implementation Questions

### Example 6: How do I configure a billing schedule?

**User Question:**
```
How do I configure a billing schedule for monthly subscriptions?
```

**Search Query:**
```
"billing schedule configuration monthly"
```

**Expected Response:**
```
Billing schedules define when customers are invoiced and charged for their
subscriptions.

**Configuration Steps:**
1. Define billing frequency (monthly, annual, quarterly, custom)
2. Set billing timing (advance or arrears)
3. Configure invoice generation lead time
4. Set payment due date offset
5. Define renewal behavior

**Monthly Billing Configuration:**

**Billing Frequency:** Monthly
**Billing Timing Options:**
- **In Advance:** Charge for upcoming month (most common for SaaS)
- **In Arrears:** Charge for previous month (common for usage-based)

**Example Advance Configuration:**
- Subscription starts: January 1
- Invoice generated: December 25 (7-day lead time)
- Charge date: January 1
- Service period: January 1 - January 31
- Next billing: February 1

**Example Arrears Configuration:**
- Service period: January 1 - January 31
- Invoice generated: February 1
- Charge date: February 1 (or per payment terms)
- Period billed: January 1 - January 31

**Additional Settings:**
- **Anchor Date:** Lock billing to specific day of month
- **Proration:** Enable/disable for mid-cycle starts
- **Grace Period:** Days before subscription suspends for non-payment

**Related Concepts:** Billing runs, Invoice generation, Payment terms

**Sources:**
- [Billing Schedules](https://notion.so/...) - Schedule configuration guide
- [Billing Timing](https://notion.so/...) - Advance vs arrears billing
- [Monthly Billing Setup](https://notion.so/...) - Monthly-specific configuration
```

## Edge Case Questions

### Example 7: What happens when a customer upgrades mid-cycle?

**User Question:**
```
What happens when a customer upgrades their subscription mid-cycle?
```

**Search Query:**
```
"mid-cycle upgrades proration"
```

**Expected Response:**
```
Mid-cycle upgrades immediately change the subscription to the new plan and generate
a prorated charge for the difference.

**Upgrade Process:**
1. Calculate unused time on current plan
2. Credit prorated amount for unused time
3. Calculate new plan cost for remaining period
4. Charge difference (new plan cost - credit)
5. Update subscription to new plan
6. Next full billing occurs at original renewal date

**Calculation Example:**

Current plan: $100/month
New plan: $200/month
Upgrade date: Day 15 of 30-day month (50% through cycle)

- Unused time credit: $100 × 0.5 = $50
- New plan cost for remaining time: $200 × 0.5 = $100
- Immediate charge: $100 - $50 = $50
- Next renewal: Full $200 charge on original renewal date

**Important Behaviors:**

**Immediate Effect:**
- New plan features activate immediately
- Customer billed immediately for difference
- No waiting until next cycle

**Billing Date:**
- Original renewal date stays the same
- Upgrade doesn't reset billing cycle
- Next charge will be for full new plan price

**Addons:**
- Existing addons transfer to new plan
- Addon proration calculated separately
- Incompatible addons may be removed

**Edge Cases:**
- **Upgrade on last day:** Minimal proration charge
- **Upgrade on first day:** Nearly full new plan charge
- **Multiple upgrades:** Each proration calculated independently
- **Downgrade protection:** Some plans prevent immediate downgrades

**Related Concepts:** Proration, Subscription lifecycle, Downgrades

**Sources:**
- [Subscription Upgrades](https://notion.so/...) - Upgrade process details
- [Proration Logic](https://notion.so/...) - Proration calculations
- [Mid-Cycle Changes](https://notion.so/...) - Mid-cycle change handling
```

## Complex Multi-Page Synthesis

### Example 8: How do minimum commitments work with usage-based billing?

**User Question:**
```
How do minimum commitments work with usage-based pricing and monthly billing?
```

**Search Query:**
```
"minimum commitments usage-based billing monthly"
```

**Expected Response:**
```
Minimum commitments guarantee a minimum monthly payment regardless of actual usage,
with usage-based charges applying when usage exceeds the commitment.

**How It Works:**

**Commitment Structure:**
- Minimum monthly commitment: $500
- Usage rate: $10 per unit
- Commitment covers: 50 units ($500 / $10)

**Billing Scenarios:**

1. **Usage Below Commitment (30 units):**
   - Actual usage cost: 30 × $10 = $300
   - Minimum commitment: $500
   - **Charge: $500** (minimum applies)
   - Unused commitment: 20 units (may or may not carry over)

2. **Usage Equals Commitment (50 units):**
   - Actual usage cost: 50 × $10 = $500
   - **Charge: $500** (at minimum)

3. **Usage Exceeds Commitment (80 units):**
   - Actual usage cost: 80 × $10 = $800
   - Minimum commitment: $500
   - **Charge: $800** (usage exceeds minimum)
   - Overage: 30 units

**Monthly Billing Process:**
1. Track usage throughout billing cycle
2. Calculate total usage cost at cycle end
3. Compare usage cost to minimum commitment
4. Charge greater of the two amounts
5. Generate invoice with commitment details

**Configuration Options:**

**Commitment Period:**
- Monthly commitments (most common)
- Annual commitments with monthly billing
- Quarterly commitments

**Unused Commitment:**
- **Forfeited:** Unused commitment doesn't carry over
- **Rollover:** Unused amounts apply to future months
- **Credited:** Unused amounts become account credits

**True-Up Process:**
- For annual commitments with monthly billing
- Track cumulative usage vs annual commitment
- Final month includes true-up charge/credit

**Example Annual Commitment:**
- Annual commitment: $6,000 ($500/month average)
- Billed monthly based on usage
- Month 1-11 usage: $400/month = $4,400 total
- Month 12 usage: $500
- Month 12 true-up: $6,000 - $4,900 = $1,100
- Month 12 invoice: $500 (usage) + $1,100 (true-up) = $1,600

**Edge Cases:**
- **Mid-cycle start:** Prorated minimum for partial month
- **Plan changes:** Commitment may adjust with plan
- **Subscription pause:** Commitment may pause or continue
- **Early termination:** Remaining commitment may be due

**Related Concepts:** Usage-based billing, Billing schedules, Proration

**Sources:**
- [Minimum Commitments](https://notion.so/...) - Commitment structure and logic
- [Usage-Based Billing](https://notion.so/...) - Usage tracking and charging
- [Monthly Billing](https://notion.so/...) - Monthly billing process
- [True-Up Billing](https://notion.so/...) - Annual commitment reconciliation
```

## "Not Found" Examples

### Example 9: Information not available

**User Question:**
```
What's the API endpoint for creating custom billing rules?
```

**Search Query:**
```
"API custom billing rules"
```

**Expected Response:**
```
I searched the Billing Engine Specification for information about API endpoints for
custom billing rules, but couldn't find specific documentation on this topic.

Here's what I found that might be related:

**Billing API Overview:**
The specification covers standard billing operations like subscription management,
invoice generation, and payment processing, but doesn't include details about
custom billing rule creation via API.

**You might want to:**
- Check the API reference documentation separately (may not be in this database)
- Ask in the #billing-engine or #engineering Slack channels
- Review the Integration Guide if you're looking for billing automation
- Contact the billing team directly for custom billing rule capabilities

**Related Topics in Specification:**
- Standard billing configurations
- Webhook integrations for billing events
- Billing run customization

**Sources Searched:**
- [Billing API Overview](https://notion.so/...) - General API documentation
- [Integration Guide](https://notion.so/...) - API integration patterns
```

## Troubleshooting Example

### Example 10: Proration not calculating correctly

**User Question:**
```
Why isn't proration calculating correctly for our annual subscriptions?
```

**Search Query:**
```
"proration annual subscriptions calculation"
```

**Expected Response:**
```
Proration for annual subscriptions can behave unexpectedly due to how time periods
are calculated. Here are common issues and explanations:

**Common Proration Issues with Annual Plans:**

1. **Days-Based Calculation:**
   - Annual proration uses exact days, not months
   - 365-day year (366 for leap years)
   - Can result in unexpected amounts

2. **Example Calculation:**
   - Annual plan: $1,200/year
   - Daily rate: $1,200 / 365 = $3.29 per day
   - Upgrade after 200 days:
     - Unused days: 165 days
     - Credit: 165 × $3.29 = $542.85
   - Different from monthly proration which might use 12 months

3. **Leap Year Handling:**
   - Leap years have 366 days
   - Daily rate adjusted: $1,200 / 366 = $3.28 per day
   - Can cause slight differences year-to-year

4. **Month-End Edge Cases:**
   - Subscriptions starting Jan 31 renewing in Feb
   - February has fewer days
   - Proration must account for varying month lengths

**Verification Steps:**

1. Check subscription start date
2. Identify exact day of upgrade/change
3. Calculate days used vs days remaining
4. Multiply daily rate by remaining days
5. Compare with actual proration amount

**Things to Check:**
- Is the subscription actually annual or monthly?
- What timezone is the account using?
- Are there any custom proration rules configured?
- Is rounding configured correctly?

**If Still Incorrect:**
- Review the specific subscription details
- Check for any manual adjustments applied
- Verify billing run logs for calculation details
- Contact billing team with subscription ID for investigation

**Related Concepts:** Proration calculation, Annual billing, Subscription upgrades

**Sources:**
- [Proration Logic](https://notion.so/...) - Core proration calculation
- [Annual Billing](https://notion.so/...) - Annual subscription specifics
- [Date Calculations](https://notion.so/...) - How dates and periods are calculated
```

---

## Response Quality Checklist

Use these examples to ensure responses meet quality standards:

- [ ] **Direct answer** in first 1-2 sentences
- [ ] **Supporting details** with specific examples
- [ ] **Edge cases** mentioned when relevant
- [ ] **Related concepts** suggested
- [ ] **Sources cited** with URLs and descriptions
- [ ] **Proper formatting** with headers and lists
- [ ] **Accurate information** based on documentation
- [ ] **Concise** but complete coverage of topic
- [ ] **Helpful tone** that guides user to solution
- [ ] **Token-efficient** summarization, not full page copies

---

**Remember:** These examples demonstrate the expected quality and structure of responses. Always synthesize information from documentation rather than guessing or making assumptions.
