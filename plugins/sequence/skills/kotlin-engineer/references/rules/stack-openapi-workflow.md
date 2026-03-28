---
title: OpenAPI → Frontend Workflow
impact: CRITICAL
impactDescription: Any API change not followed by this workflow will leave the frontend with stale types, causing runtime errors in production.
tags: [openapi, workflow, frontend, deployment]
---

# OpenAPI → Frontend Workflow

**Every API change — new endpoint, changed response shape, new field, renamed field — MUST trigger this workflow. No exceptions.**

The backend is the single source of truth for types. The frontend consumes generated types from the OpenAPI spec. Manual type definitions in the frontend for backend data are forbidden.

## The Workflow

```
1. Change the backend (new contract, new model, updated response)
         ↓
2. Deploy the backend
         ↓
3. Run the OpenAPI generator
         ↓
4. Update the frontend to use the new generated types
         ↓
5. Verify the frontend builds with no TypeScript errors
```

**Do not skip steps. Do not do steps out of order.**

## What Counts as an API Change

| Change | Triggers workflow? |
|--------|--------------------|
| New endpoint | ✅ Yes |
| New field on response model | ✅ Yes |
| Removed field from response model | ✅ Yes |
| Renamed field | ✅ Yes |
| Changed field type | ✅ Yes |
| New status code on existing endpoint | ✅ Yes |
| Internal refactor (no contract change) | ❌ No |
| DB migration only | ❌ No |
| Bug fix with identical response shape | ❌ No |

## OpenAPI Spec Location

The spec is served at `/api/openapi.json` when the server is running.

## Running the Generator

```bash
# From the frontend root (new-rota-ui/ or house-tracker/)
npm run generate-api

# Or directly
npx openapi-typescript-codegen \
  --input http://localhost:9000/api/openapi.json \
  --output src/generated/api \
  --client axios
```

Check `package.json` for the exact `generate-api` script in each project.

## After Generation

1. Check the diff in `src/generated/api/` — confirm the changes match what you added
2. Update any frontend hooks or components that use the affected types
3. Run `npm run build` to confirm no TypeScript errors
4. Do not commit generated files with unrelated changes mixed in

## Red Flags

- Manually adding types to the frontend that mirror backend models
- Calling a new API endpoint from the frontend using `any` typed responses
- Committing frontend changes that reference new API fields before running the generator
- Running the generator against a locally running server that hasn't been updated yet
