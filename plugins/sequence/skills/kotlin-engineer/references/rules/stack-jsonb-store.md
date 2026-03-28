---
title: JSONB Store Pattern
impact: CRITICAL
impactDescription: Every new entity must follow this pattern. Deviating means inconsistent data access, broken migrations, and unmaintainable stores.
tags: [database, store, jsonb, pattern]
---

# JSONB Store Pattern

Every table in this project has exactly two columns: `id UUID PRIMARY KEY` and `data JSONB NOT NULL`. All entity fields live inside the JSONB blob. There is no other table structure.

## The Migration

```sql
-- GOOD
CREATE TABLE crawler(id UUID PRIMARY KEY, data JSONB NOT NULL);

-- BAD — never add typed columns
CREATE TABLE crawler(
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  sites TEXT[],
  created_at TIMESTAMP
);
```

## The Store

Every store extends `GeneralStore<T>` and passes three lambdas to the constructor. It is a Kotlin `object` (singleton).

```kotlin
// GOOD
object CrawlerStore : GeneralStore<Crawler>(
    tableName = "crawler",
    getId = { it.id },
    toJson = { it.toJson() },
    fromJson = { Crawler.fromJson(it) }
)

// BAD — do not hand-roll basic CRUD
class CrawlerStore {
    fun insert(crawler: Crawler) {
        Db.session().use { session ->
            session.run(queryOf("INSERT INTO crawler ...").asExecute)
        }
    }
}
```

## Custom Queries

Add specific queries as additional functions on the store object. Always query JSONB fields with `->>` for text equality.

```kotlin
// GOOD
object CrawlerStore : GeneralStore<Crawler>(
    tableName = "crawler",
    getId = { it.id },
    toJson = { it.toJson() },
    fromJson = { Crawler.fromJson(it) }
) {
    fun findByUserId(userId: String): List<Crawler> =
        Db.session().use { session ->
            session.run(
                queryOf("SELECT data FROM crawler WHERE data->>'userId' = ?", userId)
                    .map { row -> Crawler.fromJson(row.string("data")) }
                    .asList
            )
        }
}

// BAD — raw string interpolation is SQL injection risk
fun findByUserId(userId: String) =
    Db.session().use { session ->
        session.run(
            queryOf("SELECT data FROM crawler WHERE data->>'userId' = '$userId'")
                .map { row -> Crawler.fromJson(row.string("data")) }
                .asList
        )
    }
```

## Session Management

Always use `.use { }` to close the session. Never hold a session open across multiple operations.

```kotlin
// GOOD
fun find(id: UUID): Crawler? =
    Db.session().use { session ->
        session.run(
            queryOf("SELECT data FROM crawler WHERE id = ?", id)
                .map { row -> Crawler.fromJson(row.string("data")) }
                .asSingle
        )
    }

// BAD — session leak
val session = Db.session()
val result = session.run(...)
// session never closed
```
