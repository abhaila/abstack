---
title: Serialization Pattern (kotlinx.serialization)
impact: HIGH
impactDescription: Incorrect serialization causes silent data corruption in the JSONB column and broken API responses.
tags: [serialization, kotlinx, uuid, datetime, pattern]
---

# Serialization Pattern

This project uses `kotlinx.serialization` (not Jackson, not Gson) for all JSON. Every DB model and API model that touches JSON must be `@Serializable`.

## Every Model Must Be @Serializable

```kotlin
// GOOD
@Serializable
data class Crawler(
    @Serializable(with = UUIDSerializer::class) val id: UUID,
    val userId: String,
    val sites: List<String>,
    @Serializable(with = IsoDateTimeSerializer::class) val createdAt: LocalDateTime
)

// BAD — missing annotation; will fail at runtime
data class Crawler(val id: UUID, val userId: String)
```

## UUID Fields

Always annotate UUID fields with `@Serializable(with = UUIDSerializer::class)`. UUID is not natively supported by kotlinx.serialization.

```kotlin
// GOOD
@Serializable(with = UUIDSerializer::class) val id: UUID

// BAD — will throw at runtime
val id: UUID
```

The serializer is in `utility/UUIDSerializer.kt`. Do not create duplicate serializers.

## LocalDateTime Fields

Always annotate `LocalDateTime` with `@Serializable(with = IsoDateTimeSerializer::class)`.

```kotlin
// GOOD
@Serializable(with = IsoDateTimeSerializer::class) val createdAt: LocalDateTime

// BAD
val createdAt: LocalDateTime
```

## List<UUID> Fields

Use `UUIDListSerializer` for lists of UUIDs.

```kotlin
// GOOD
@Serializable(with = UUIDListSerializer::class) val houseIds: List<@Contextual UUID>

// BAD
val houseIds: List<UUID>
```

## toJson() and fromJson()

Every DB model must have these two methods for the store to call.

```kotlin
// GOOD — on every DB model
fun toJson(): String = Json.encodeToString(this)

companion object {
    fun fromJson(text: String): Crawler = Json.decodeFromString(text)
}
```

## Nullable Fields

Nullable fields with defaults are safe to add to existing models — JSONB reads will use the default when the field is absent. Always provide a default for new optional fields on existing entities.

```kotlin
// GOOD — new optional field added to existing entity
@Serializable
data class Crawler(
    @Serializable(with = UUIDSerializer::class) val id: UUID,
    val userId: String,
    val sites: List<String>,
    val notes: String? = null,  // safe to add — existing rows deserialize with null
    @Serializable(with = IsoDateTimeSerializer::class) val createdAt: LocalDateTime
)

// BAD — no default on new field; all existing rows will fail to deserialize
val notes: String
```

## Do Not Mix with Jackson

The http4k lenses (`Body.auto<T>().toLens()`) use Jackson internally. Do not attempt to use kotlinx.serialization classes directly in lenses — use the API model layer which is separately serialized by http4k.
