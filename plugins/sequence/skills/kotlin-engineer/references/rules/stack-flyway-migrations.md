---
title: Flyway Migration Pattern
impact: CRITICAL
impactDescription: Migrations run automatically on deploy. A wrong migration cannot be rolled back in production. Follow this pattern exactly.
tags: [database, flyway, migration, pattern]
---

# Flyway Migration Pattern

All schema and data migrations use Flyway. SQL migrations create tables. Kotlin migrations move or transform existing data.

## Naming

Flyway requires strict naming: `V{N}__{Description}` — two underscores, PascalCase description, no spaces.

```
V1__CreateHouseTable.sql
V2__CreateBoardTable.sql
V3__CreateCrawlerTable.sql
V4__CreateCrawlerForEachUser.kt     ← Kotlin for data migrations
```

Migrations live in `src/main/kotlin/com/toppi/api/db/migration/` (Kotlin) or `src/main/resources/db/migration/` (SQL).

## SQL Migration: Table Creation

Every new entity needs exactly one SQL migration. Always `id UUID PRIMARY KEY, data JSONB NOT NULL`.

```sql
-- GOOD — V3__CreateCrawlerTable.sql
CREATE TABLE crawler(id UUID PRIMARY KEY, data JSONB NOT NULL);

-- BAD — typed columns
CREATE TABLE crawler(
  id UUID PRIMARY KEY,
  user_id TEXT,
  sites JSONB,
  created_at TIMESTAMP
);
```

## Kotlin Migration: Data Transformation

Use a Kotlin class (not SQL) when the migration needs to read existing data, transform it, and write it back. Extend `BaseJavaMigration`.

```kotlin
// GOOD — V4__BackfillCrawlerBoards.kt
@Suppress("SqlNoDataSourceInspection", "ClassName", "unused")
class V4__BackfillCrawlerBoards : BaseJavaMigration() {
    override fun migrate(context: Context) {
        with(context.connection.createStatement()) {
            // Read existing data
            val boards: List<BoardMigration> =
                executeQuery("SELECT data FROM board")
                    .toList("data") { Json.decodeFromString<BoardMigration>(it) }

            // Transform and write back
            boards.forEach { board ->
                val crawlerId = UUID.randomUUID()
                val crawler = CrawlerMigration(
                    id = crawlerId,
                    userId = board.userId,
                    sites = listOf("rightmove"),
                    createdAt = LocalDateTime.now()
                )
                execute("INSERT INTO crawler (id, data) VALUES ('$crawlerId', '${crawler.toJson()}')")
            }
        }
    }
}

// Migration-local data classes — never reuse production models in migrations
// Production models may change; migration must always reproduce the historical shape
@Serializable
private data class BoardMigration(
    @Serializable(with = UUIDSerializer::class) val id: UUID,
    val userId: String,
    val name: String
)

@Serializable
private data class CrawlerMigration(
    @Serializable(with = UUIDSerializer::class) val id: UUID,
    val userId: String,
    val sites: List<String>,
    @Serializable(with = IsoDateTimeSerializer::class) val createdAt: LocalDateTime
) {
    fun toJson() = Json.encodeToString(this)
}
```

## Rules

- **Never modify a committed migration.** Create a new one instead.
- **Use migration-local data classes** for serialization inside Kotlin migrations — never import production domain models. Production models evolve; the historical migration must stay stable.
- **The `@Suppress` annotation is required** on Kotlin migration classes (Flyway naming convention trips IntelliJ inspections).
- **Test migrations** locally by running the full app against a clean database before deploying.

## Registering the Migration Location

Migrations are loaded from the classpath. Flyway is configured in `Db.kt`:

```kotlin
Flyway
    .configure()
    .locations("com/toppi/api/db/migration")
    .dataSource(dataSource)
    .load()
    .migrate()
```

If you add a new sub-package, add it to `.locations()`.
