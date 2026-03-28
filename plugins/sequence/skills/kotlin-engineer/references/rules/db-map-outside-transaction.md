---
title: Map Data Outside Transaction Blocks
impact: MEDIUM
impactDescription: releases connections faster, prevents blocking
tags: database, exposed, transactions, performance
---

## Map Data Outside Transaction Blocks

**Impact: MEDIUM (releases connections faster, prevents blocking)**

When querying data with Exposed, perform mapping and transformation outside the transaction block. This releases the database connection sooner and prevents issues with suspending functions.

**Incorrect (mapping inside transaction):**

```kotlin
fun findAllProducts(): List<Product> {
    return db.transaction {
        productsTable
            .selectAll()
            .toList()
            .map { row ->
                // Mapping inside transaction - holds connection longer
                Product(
                    id = ProductId(row[productsTable.id]),
                    name = row[productsTable.name],
                    // If this calls a suspending function, connection held while suspended!
                    category = fetchCategory(row[productsTable.categoryId])
                )
            }
    }
}
```

**Correct (mapping outside transaction):**

```kotlin
fun findAllProducts(): List<Product> {
    // Transaction only for database access
    val rows = db.transaction {
        productsTable
            .selectAll()
            .toList()  // Important: materialise results inside transaction
    }

    // Mapping happens after connection is released
    return rows.map { row ->
        Product(
            id = ProductId(row[productsTable.id]),
            name = row[productsTable.name],
            category = categoryCache.get(row[productsTable.categoryId])
        )
    }
}
```

**For single results:**

```kotlin
fun findById(id: ProductId): Product? {
    // Use single() or singleOrNull() inside transaction
    val row = db.transaction {
        productsTable
            .select { productsTable.id eq id.value }
            .singleOrNull()  // Materialises the single result
    }

    // Map outside
    return row?.let { mapToProduct(it) }
}
```

**With coroutines - especially important:**

```kotlin
// Incorrect: suspending inside transaction
suspend fun findAndEnrich(id: ProductId): EnrichedProduct {
    return db.transaction {
        val row = productsTable.select { productsTable.id eq id.value }.single()
        // DANGEROUS: suspension point inside transaction!
        val enrichment = externalService.enrich(row[productsTable.sku])
        EnrichedProduct(row, enrichment)
    }
}

// Correct: suspend outside transaction
suspend fun findAndEnrich(id: ProductId): EnrichedProduct {
    val row = db.transaction {
        productsTable.select { productsTable.id eq id.value }.single()
    }
    // Suspension happens after connection is released
    val enrichment = externalService.enrich(row[productsTable.sku])
    return EnrichedProduct(row, enrichment)
}
```

Key rules:
- Always use `.toList()`, `.single()`, or `.singleOrNull()` inside the transaction to materialise results
- Perform all mapping, transformation, and enrichment outside the transaction
- Never call suspending functions inside transaction blocks
