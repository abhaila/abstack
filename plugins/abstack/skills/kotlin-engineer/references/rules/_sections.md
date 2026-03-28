# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Domain Modelling (domain)

**Impact:** CRITICAL
**Description:** Rich domain models with type safety, smart constructors, and explicit state representation form the foundation of maintainable business logic.

## 2. Architecture Patterns (arch)

**Impact:** CRITICAL
**Description:** Hexagonal architecture, imperative shell/functional core, and proper separation of concerns enable testable, maintainable systems.

## 3. Error Handling (error)

**Impact:** HIGH
**Description:** Using Result4k for expected failures and proper exception handling for unexpected conditions prevents silent failures and improves debugging.

## 4. Data Consistency (data)

**Impact:** HIGH
**Description:** Idempotency, optimistic concurrency control, and proper transaction boundaries prevent data corruption and race conditions.

## 5. API Design (api)

**Impact:** MEDIUM-HIGH
**Description:** RESTful design, consistent naming, proper error responses, and clear documentation create APIs that are easy to use and maintain.

## 6. Testing Practices (test)

**Impact:** MEDIUM
**Description:** Tests are the foundation of moving fast with confidence. Following the testing pyramid, using in-memory test doubles, self-contained scenarios, and testing observable behaviour enables fearless refactoring and comprehensive coverage.

## 7. Database Patterns (db)

**Impact:** MEDIUM
**Description:** Proper table definitions, repository patterns, and transaction handling with Exposed framework ensure data integrity and performance.

## 8. Code Style (style)

**Impact:** LOW-MEDIUM
**Description:** Consistent naming conventions, class layout, and Kotlin idioms improve readability and maintainability across the codebase.
