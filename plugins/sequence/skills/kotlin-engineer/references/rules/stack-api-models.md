---
title: API Models vs DB Models
impact: CRITICAL
impactDescription: DB models and API models must never be the same class. Conflating them leaks internal data, makes API versioning impossible, and couples the DB schema to the API contract.
tags: [api, models, separation, pattern]
---

# API Models vs DB Models

This project has two separate model layers:
- **DB model** (`db/model/`) — the entity as stored in the JSONB column. Drives serialization to/from PostgreSQL.
- **API model** (`api/model/`) — the shape returned to or received from the client. Drives the OpenAPI contract.

They are different classes. Always.

## DB Model

Owns serialization logic. Lives in `db/model/`. Has `toJson()` and `fromJson()` for the store.

```kotlin
// GOOD — in db/model/Crawler.kt
@Serializable
data class Crawler(
    @Serializable(with = UUIDSerializer::class) val id: UUID,
    val userId: String,
    val sites: List<String>,
    @Serializable(with = IsoDateTimeSerializer::class) val createdAt: LocalDateTime
) {
    fun toJson(): String = Json.encodeToString(this)

    companion object {
        fun fromJson(text: String): Crawler = Json.decodeFromString(text)
    }
}
```

## API Model

What the HTTP client sees. Lives in `api/model/`. Only contains fields safe and useful to expose. Always `@Serializable`.

```kotlin
// GOOD — in api/model/ApiCrawler.kt
@Serializable
data class ApiCrawler(
    @Serializable(with = UUIDSerializer::class) val id: UUID,
    val sites: List<String>,
    @Serializable(with = IsoDateTimeSerializer::class) val createdAt: LocalDateTime
    // userId intentionally omitted — client already knows their own ID
)

data class ApiCreateCrawler(
    val sites: List<String>,
    val schedule: String
)
```

## The Transformation: toApi()

Always an extension function on the DB model. Lives alongside the API model file.

```kotlin
// GOOD — in api/model/ApiCrawler.kt
fun Crawler.toApi() = ApiCrawler(
    id = id,
    sites = sites,
    createdAt = createdAt
)

// BAD — transformation logic inside the DB model
data class Crawler(...) {
    fun toApiCrawler() = ApiCrawler(id = id, ...)
}

// BAD — transformation logic inside the handler
private fun find(id: UUID): HttpHandler = { request ->
    val crawler = CrawlerStore.find(id)
    val apiCrawler = ApiCrawler(id = crawler!!.id, sites = crawler.sites, ...) // inline mapping
    Response(OK).with(crawlerLens of apiCrawler)
}
```

## Resolving Relations

When an API model needs related entities (e.g., a board showing its houses), resolve them in `toApi()` via the relevant store.

```kotlin
// GOOD
fun Board.toApi() = ApiBoard(
    id = id,
    name = name,
    houses = HouseStore.listHouses(houseIds).map { it.toApi() }
)
```

## Request DTOs

Create requests (POST body) have their own DTO — never reuse the DB model or full API model for input.

```kotlin
// GOOD
data class ApiCreateCrawler(val sites: List<String>, val schedule: String)

// BAD — using full model as input (forces client to provide id, createdAt, etc.)
data class ApiCrawler(val id: UUID, val sites: List<String>, val createdAt: LocalDateTime)
// ... then used as both request and response shape
```
