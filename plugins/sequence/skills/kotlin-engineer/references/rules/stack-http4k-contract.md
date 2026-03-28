---
title: http4k Contract Pattern
impact: CRITICAL
impactDescription: Every new endpoint must use this pattern. It ensures OpenAPI docs are auto-generated and all routes are type-safe.
tags: [http4k, api, contract, pattern]
---

# http4k Contract Pattern

Every API resource is a `Contract` class. Specs (metadata + OpenAPI) and handlers (logic) are always written as separate private members and paired together in `invoke()`.

## Structure

```kotlin
// GOOD
class CrawlerContract {
    private val endpoint = "/crawler"

    // Paired in invoke() — spec + handler together
    operator fun invoke(): List<ContractRoute> = listOf(
        createSpec to ::create,
        findSpec   to ::find,
        deleteSpec to ::delete
    )

    // Lenses in companion object — reused across specs and tests
    companion object {
        val crawlerLens       = Body.auto<ApiCrawler>().toLens()
        val crawlerCreateLens = Body.auto<ApiCreateCrawler>().toLens()
        val crawlerListLens   = Body.auto<List<ApiCrawler>>().toLens()
    }

    // SPEC: metadata only — OpenAPI tags, summary, examples, status codes
    private val createSpec = endpoint meta {
        tags += Tag("Crawler")
        summary = "Create a crawler"
        consumes += ContentType.APPLICATION_JSON
        produces += ContentType.APPLICATION_JSON
        receiving(crawlerCreateLens to sampleCrawlerCreate)
        returning(CREATED, crawlerLens to sampleCrawler)
    } bindContract Method.POST

    // HANDLER: logic only — extract, process, respond
    private fun create(): HttpHandler = { request ->
        val userId = getUserIdFromRequest(request)
        val body = crawlerCreateLens.extract(request)
        val crawler = Crawler(UUID.randomUUID(), userId, body.sites, body.filters, body.schedule, LocalDateTime.now())
        CrawlerStore.insert(crawler)
        Response(CREATED).with(crawlerLens of crawler.toApi())
    }

    private val findSpec = endpoint / CustomLens.PathId meta {
        tags += Tag("Crawler")
        summary = "Find a crawler"
        produces += ContentType.APPLICATION_JSON
        returning(OK, crawlerLens to sampleCrawler)
        returning(NOT_FOUND)
    } bindContract Method.GET

    private fun find(id: UUID): HttpHandler = { request ->
        val userId = getUserIdFromRequest(request)
        val crawler = CrawlerStore.find(id)
        if (crawler == null || crawler.userId != userId) Response(NOT_FOUND)
        else Response(OK).with(crawlerLens of crawler.toApi())
    }

    private val deleteSpec = endpoint / CustomLens.PathId meta {
        tags += Tag("Crawler")
        summary = "Delete a crawler"
        returning(OK)
    } bindContract Method.DELETE

    private fun delete(id: UUID): HttpHandler = { _ ->
        CrawlerStore.delete(id)
        Response(OK)
    }
}

// BAD — mixing spec and logic, no OpenAPI metadata
class CrawlerRoutes {
    fun routes() = routes(
        "/crawler" bind Method.POST to { request ->
            val body = Json.decodeFromString<ApiCreateCrawler>(request.bodyString())
            // ...
            Response(CREATED)
        }
    )
}
```

## Registering in ApiContract

Every new contract must be added to `ApiContract`.

```kotlin
// GOOD
class ApiContract {
    private val houseContract   = HouseContract()
    private val boardContract   = BoardContract()
    private val crawlerContract = CrawlerContract()  // add here

    val contract = contract {
        renderer = openApiRenderer
        descriptionPath = "/openapi.json"
        routes += houseContract()
        routes += boardContract()
        routes += crawlerContract()  // and here
    }
}
```

## Extracting and Responding

Always use lenses. Never parse request body manually.

```kotlin
// GOOD
val body = crawlerCreateLens.extract(request)
Response(OK).with(crawlerLens of result)

// BAD
val body = Json.decodeFromString<ApiCreateCrawler>(request.bodyString())
Response(OK).body(Json.encodeToString(result))
```

## Path Parameters

Use `CustomLens.PathId` for UUID path segments. For other types, define a new lens in `CustomLens`.

```kotlin
// GOOD
private val findSpec = endpoint / CustomLens.PathId meta { ... } bindContract Method.GET
private fun find(id: UUID): HttpHandler = { ... }

// BAD — string path param parsed manually
private val findSpec = endpoint / Path.string().of("id") meta { ... } bindContract Method.GET
private fun find(id: String): HttpHandler = { UUID.fromString(id); ... }
```
