---
title: Test Domain Entities and Aggregates Directly
impact: MEDIUM
impactDescription: faster tests, better error messages, comprehensive edge case coverage
tags: testing, domain, entities, aggregates
---

## Test Domain Entities and Aggregates Directly

**Impact: MEDIUM (faster tests, better error messages, comprehensive edge case coverage)**

Domain entities and aggregates contain business logic. This logic should be tested directly, not indirectly through use cases or APIs. Testing directly is faster, gives better error messages, and allows comprehensive edge case coverage.

**Example domain entity with validation:**

```kotlin
data class EmailAddress private constructor(
    @get:JsonValue override val value: String
) : StringValue(value) {
    companion object : ValueFactory<String, EmailAddress> {
        private val apacheValidator = EmailValidator.getInstance()

        override fun of(value: String): Result4k<EmailAddress, Exception> {
            return resultFrom {
                val cleaned = value.lowercase().trim()
                if (apacheValidator.isValid(cleaned)) {
                    EmailAddress(cleaned)
                } else {
                    throw IllegalEmailAddressException(value, cleaned)
                }
            }
        }
    }

    class IllegalEmailAddressException(
        val rawEmailString: String,
        val cleanedEmailString: String
    ) : IllegalArgumentException("Invalid email address: '$rawEmailString'")
}
```

**Testing the domain object directly:**

```kotlin
class EmailAddressTest {
    @ParameterizedTest
    @ValueSource(strings = [
        "test@example.com",
        "test.user@example.com",
        "test+user@example.com",
        "user@sub.example.com",
        "user@example.co.uk",
    ])
    fun `should create EmailAddress for valid email strings`(validEmail: String) {
        val emailAddress = EmailAddress.of(validEmail).orThrow()

        assertNotNull(emailAddress)
        assertEquals(validEmail, emailAddress.value)
    }

    @ParameterizedTest
    @ValueSource(strings = [
        "plainaddress",
        "@missinglocalpart.com",
        "test@.com",
        "test@",
        "",
        " ",
    ])
    fun `should throw IllegalEmailAddressException for invalid email strings`(invalidEmail: String) {
        val exception = assertThrows<EmailAddress.IllegalEmailAddressException> {
            EmailAddress.of(invalidEmail).orThrow()
        }

        assertEquals("Invalid email address: '$invalidEmail'", exception.message)
    }

    @Test
    fun `should normalize email to lowercase`() {
        val emailAddress = EmailAddress.of("User@Example.COM").orThrow()

        assertEquals("user@example.com", emailAddress.value)
    }

    @Test
    fun `should trim whitespace from email`() {
        val emailAddress = EmailAddress.of("  test@example.com  ").orThrow()

        assertEquals("test@example.com", emailAddress.value)
    }
}
```

**Key points:**

Test the domain entity directly by constructing it and calling its methods. Don't go through a repository, use case, or HTTP endpoint. This makes tests fast and focused. Create valid objects, then modify specific fields to test edge cases.

Use `@ParameterizedTest` with `@ValueSource` to test multiple inputs with the same assertion logic.
