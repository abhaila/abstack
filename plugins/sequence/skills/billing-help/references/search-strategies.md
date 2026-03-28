# Search Strategies Reference

This document provides detailed guidance on transforming user questions into effective Notion search queries.

## Query Transformation Principles

### 1. Extract Core Concepts
Identify the main billing concepts in the user's question and use them as search terms.

**Examples:**
- "What is proration?" → Core concept: "proration"
- "How does graduated pricing work?" → Core concept: "graduated pricing"
- "Tell me about subscription renewals" → Core concept: "subscription renewals"

### 2. Remove Question Words
Strip out question words and focus on nouns and key concepts.

**Remove:**
- What, how, why, when, where, who
- Is, are, does, do, can, should
- Tell me about, explain, describe

**Keep:**
- Nouns (proration, invoice, subscription)
- Adjectives (graduated, volume, fixed)
- Verbs when they're domain-specific (upgrade, downgrade, renew)

**Examples:**
- "How does proration work?" → "proration"
- "What are the different pricing models?" → "pricing models"
- "Can you explain subscription upgrades?" → "subscription upgrades"

### 3. Combine Multi-Concept Queries
When questions involve multiple concepts, search for them together.

**Examples:**
- "How do discounts work with graduated pricing?" → "discounts graduated pricing"
- "What happens to proration during upgrades?" → "proration upgrades"
- "Trial periods and subscription creation" → "trial periods subscription creation"

### 4. Add Context for Implementation Questions
For "how to" questions, add implementation-related terms.

**Context Words:**
- configuration, setup, implementation
- create, configure, enable, set up
- example, guide, steps

**Examples:**
- "How do I configure graduated pricing?" → "graduated pricing configuration"
- "How to set up volume pricing?" → "volume pricing setup"
- "Steps to create a subscription" → "subscription creation steps"

## Question Type Taxonomy

### Type 1: Definition Questions
**Pattern:** "What is X?", "Define X", "Explain X"

**Strategy:** Direct search for concept X

**Examples:**
- "What is proration?" → Search: "proration"
- "Define graduated pricing" → Search: "graduated pricing"
- "Explain billing runs" → Search: "billing runs"

### Type 2: Process Questions
**Pattern:** "How does X work?", "What happens when X?"

**Strategy:** Search for concept X (process documentation usually includes "how it works")

**Examples:**
- "How does proration work?" → Search: "proration"
- "What happens during subscription renewal?" → Search: "subscription renewal"
- "How are invoices generated?" → Search: "invoice generation"

### Type 3: Comparison Questions
**Pattern:** "What's the difference between X and Y?", "X vs Y"

**Strategy:** Search for both concepts together, or search separately and synthesize

**Examples:**
- "Difference between graduated and volume pricing?" → Search: "graduated volume pricing"
- "Fixed vs usage-based billing" → Search: "fixed usage-based billing"
- "Upgrades vs downgrades" → Search: "upgrades downgrades"

**Alternative:** Search separately then compare
- Search 1: "graduated pricing"
- Search 2: "volume pricing"
- Synthesize differences from both pages

### Type 4: Interaction Questions
**Pattern:** "How does X affect Y?", "X with Y", "X during Y"

**Strategy:** Search for both concepts together

**Examples:**
- "How do discounts work with volume pricing?" → Search: "discounts volume pricing"
- "Proration during upgrades" → Search: "proration upgrades"
- "Tax handling with credits" → Search: "tax credits"

### Type 5: Implementation Questions
**Pattern:** "How do I X?", "How to X?", "Steps to X"

**Strategy:** Add implementation context words

**Examples:**
- "How do I configure graduated pricing?" → Search: "graduated pricing configuration"
- "How to set up a billing schedule?" → Search: "billing schedule setup"
- "Steps to create a subscription" → Search: "subscription creation"

### Type 6: Edge Case Questions
**Pattern:** "What if X?", "What happens when X?", "Can I X?"

**Strategy:** Search for main concept and look for edge cases in documentation

**Examples:**
- "What if a customer upgrades mid-cycle?" → Search: "upgrades mid-cycle"
- "What happens when a trial expires?" → Search: "trial expiration"
- "Can I change billing schedule?" → Search: "billing schedule change"

### Type 7: Troubleshooting Questions
**Pattern:** "Why is X happening?", "X not working", "Error with X"

**Strategy:** Search for concept and look for common issues

**Examples:**
- "Why isn't proration calculating correctly?" → Search: "proration calculation"
- "Discount not applying" → Search: "discount application"
- "Invoice generation failing" → Search: "invoice generation"

## Advanced Search Patterns

### Multi-Stage Search
For complex questions, perform multiple searches and synthesize results.

**Example Question:** "How do minimum commitments work with usage-based pricing and monthly billing?"

**Search Strategy:**
1. Search: "minimum commitments"
2. Search: "usage-based pricing"
3. Search: "monthly billing"
4. Synthesize how all three interact

**When to Use:**
- Questions with 3+ distinct concepts
- Complex scenarios involving multiple features
- When initial search doesn't provide complete answer

### Progressive Narrowing
Start broad, then narrow based on results.

**Example Question:** "How does proration work for annual subscriptions with addons?"

**Search Strategy:**
1. Search: "proration" (broad)
2. If results exist but don't cover annual specifically, search: "proration annual subscriptions"
3. If addon specifics missing, search: "proration addons"

**When to Use:**
- Initial search returns too many or irrelevant results
- Trying to find specific edge cases
- Looking for detailed information on a subtopic

### Synonym Expansion
Try alternative terms if initial search yields poor results.

**Synonyms in Billing Domain:**
- "Billing run" = "invoice generation" = "billing cycle execution"
- "Subscription" = "plan" = "recurring charge"
- "Customer" = "account" = "subscriber"
- "Charge" = "fee" = "amount" = "price"
- "Discount" = "credit" = "adjustment" (context-dependent)

**Example:**
- Initial search: "billing run" (no results)
- Try: "invoice generation"
- Try: "billing cycle"

### Context-Aware Search
Adjust search based on user's role or context.

**Developer Context:**
- Add technical terms: "API", "integration", "implementation"
- Example: "subscription creation" → "subscription creation API"

**Business Context:**
- Focus on concepts and outcomes
- Example: "subscription creation" → "subscription lifecycle"

**Support Context:**
- Focus on common issues and edge cases
- Example: "proration" → "proration edge cases"

## Search Quality Optimization

### Avoid Over-Specification
Don't make queries too specific initially; you might miss relevant documentation.

**Bad:** "proration for $100 monthly subscription upgraded to $200 plan on day 15"
**Good:** "proration upgrades"

The specific example might be in documentation found with the broader search.

### Avoid Under-Specification
Don't make queries too broad; you'll get too many irrelevant results.

**Bad:** "billing"
**Good:** "billing runs"
**Better:** "billing run execution"

### Use Billing Domain Terms
Use proper billing terminology from the domain.

**Prefer:**
- "Proration" over "partial charge calculation"
- "Graduated pricing" over "tiered pricing with different rates"
- "Usage-based billing" over "consumption pricing"
- "Billing cycle" over "payment period"

### Consider User Intent
Understand what the user is really asking for.

**Example:** "How much does it cost?"
- Intent: Understanding pricing models
- Search: "pricing models" or "subscription costs"

**Example:** "When will customer be charged?"
- Intent: Understanding billing schedule
- Search: "billing schedule" or "invoice generation timing"

## Relevance Filtering

### Prioritize Search Results
Focus on top 3-5 most relevant results.

**Relevance Indicators:**
- Title matches query closely
- Recent modification date (if available)
- Higher in search results ranking
- Comprehensive coverage (longer pages often more complete)

### Skip Irrelevant Pages
Don't fetch pages that are clearly off-topic.

**Skip if:**
- Title is completely unrelated
- Search snippet doesn't mention key concepts
- Page is administrative (meeting notes, drafts)
- Page is deprecated or archived

### Fetch Strategy
1. Always fetch top result
2. Fetch 2nd-3rd results if they add different perspectives
3. Stop at 5 pages maximum
4. Check cache before fetching each page

## Error Recovery

### No Results Found
1. Try synonym expansion
2. Try broader search
3. Try related concepts
4. Inform user that specific information not found
5. Suggest alternative resources

**Example:**
- Initial: "proration algorithms" (no results)
- Try: "proration calculation" (possible results)
- Try: "proration" (broader, more likely to have results)

### Too Many Results
1. Narrow the query
2. Add context words
3. Combine multiple concepts
4. Focus on top-ranked results only

**Example:**
- Initial: "pricing" (too many results)
- Narrowed: "pricing models"
- More specific: "graduated pricing model"

### Irrelevant Results
1. Add more specific terms
2. Use exact billing terminology
3. Add context about what specifically you're looking for
4. Try alternative phrasings

**Example:**
- "billing cycle" returns calendar/scheduling docs
- Try: "subscription billing cycle"
- Try: "invoice billing cycle"

## Best Practices Summary

1. **Extract core concepts** from user questions
2. **Remove question words** that don't add search value
3. **Combine related concepts** in multi-concept queries
4. **Add implementation context** for how-to questions
5. **Use domain-specific terminology** from billing world
6. **Start broad, narrow as needed** for complex questions
7. **Try synonyms** if initial search fails
8. **Prioritize top 3-5 results** for fetching
9. **Check cache first** before fetching pages
10. **Stay within token budget** by limiting page fetches

---

**Remember:** The goal is to find the most relevant documentation quickly and efficiently. Good search queries are the foundation of providing accurate, helpful answers.
