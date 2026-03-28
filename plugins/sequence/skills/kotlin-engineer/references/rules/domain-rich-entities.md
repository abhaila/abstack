---
title: Create Rich Domain Entities
impact: HIGH
impactDescription: encapsulates business logic, prevents anemic models
tags: domain, entity, ddd, business-logic
---

## Create Rich Domain Entities

**Impact: HIGH (encapsulates business logic, prevents anemic models)**

Entities should encapsulate both data and behaviour. Business logic and rules should reside within the domain object, not in external service classes operating on data-only objects.

**Incorrect (anemic model):**

```kotlin
// Entity is just a data container
data class Product(
    val id: ProductId,
    val sequenceAccountId: SequenceAccountId,
    val name: String,
    val price: MonetaryAmount,
    val status: ProductStatus
)

// Logic scattered in service
class ProductService {
    fun archive(product: Product): Product {
        if (product.status != ProductStatus.ACTIVE) {
            throw IllegalStateException("Cannot archive")
        }
        return product.copy(status = ProductStatus.ARCHIVED)
    }
}
```

**Correct (rich domain model):**

```kotlin
data class Product(
    val id: ProductId,
    val sequenceAccountId: SequenceAccountId,
    val name: String,
    val price: MonetaryAmount,
    val status: ProductStatus,
    val archivedAt: Instant?
) {
    fun publish(): Result<Product, Exception> {
        return when (status) {
            ProductStatus.DRAFT -> Success(copy(status = ProductStatus.ACTIVE))
            ProductStatus.ACTIVE -> Success(this) // Idempotent
            ProductStatus.ARCHIVED -> Failure(ProductError.CannotPublishArchived(id))
        }
    }

    fun archive(): Result<Product, Exception> {
        return when (status) {
            ProductStatus.DRAFT, ProductStatus.ACTIVE -> {
                Success(copy(
                    status = ProductStatus.ARCHIVED,
                    archivedAt = Instant.now()
                ))
            }
            ProductStatus.ARCHIVED -> Success(this) // Idempotent
        }
    }

    fun updatePrice(newPrice: MonetaryAmount): Result<Product, Exception> {
        if (status == ProductStatus.ARCHIVED) {
            return Failure(ProductError.CannotModifyArchived(id))
        }
        return Success(copy(price = newPrice))
    }

    fun rename(newName: String): Result<Product, Exception> {
        if (status == ProductStatus.ARCHIVED) {
            return Failure(ProductError.CannotModifyArchived(id))
        }
        return resultFrom {
            require(newName.isNotBlank()) { "Product name cannot be blank" }
            copy(name = newName.trim())
        }
    }

    companion object {
        fun create(
            sequenceAccountId: SequenceAccountId,
            name: String,
            price: MonetaryAmount
        ): Product {
            require(name.isNotBlank()) { "Product name cannot be blank" }
            return Product(
                id = ProductId.newId(),
                sequenceAccountId = sequenceAccountId,
                name = name.trim(),
                price = price,
                status = ProductStatus.DRAFT,
                archivedAt = null
            )
        }
    }
}

sealed class ProductError(message: String) : Exception(message) {
    data class CannotPublishArchived(val productId: ProductId) :
        ProductError("Cannot publish archived product: $productId")
    data class CannotModifyArchived(val productId: ProductId) :
        ProductError("Cannot modify archived product: $productId")
}
```

Rich entities:
- Enforce business rules at the point of state change
- Make invalid state transitions impossible
- Return `Result` types instead of throwing exceptions for business operations
- Provide `create()` factory for new entities
- Keep the entity as the single source of truth for its behaviour
