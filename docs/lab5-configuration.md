# Lab 5 configuration and verification

## Local configuration

Copy .env.example to .env.local and replace placeholders locally.
Required variables: SUPABASE_URL and SUPABASE_ANON_KEY.
Use a publishable or legacy anon key; user routes preserve RLS.
The database client imports server-only.
No service-role key is required by the application.
Never put a service-role key in NEXT_PUBLIC variables or Git.

## Database setup

On a new development database, run:
1. supabase/migrations/0001_listing_database.sql
2. supabase/seed.sql

The seed contains only fictional records.
Test profiles are created by scripts/test-rls.mjs after authenticating
the two manually created, confirmed test users.

## Running the project

npm install
npm run dev

GET /api/properties returns approved listings and active sponsors.
POST /api/properties requires a verified Bearer user JWT and valid JSON.
An authenticated user's profile must exist before creating a listing.
The owner ID is derived from authentication, not accepted in the JSON.
Database requests use the Supabase query builder instead of interpolated SQL.

## Tests and evidence

- scripts/test-rls.mjs: live role tests and redacted diagnostic evidence.
- supabase/tests/admin-access.sql: service_role test with rollback.
- supabase/tests/rebuild.sql: rebuild in a temporary schema with rollback.
- docs/database-authorization.md: role matrix and diagnostic explanation.
- docs/evidence/: saved requests, responses, and validation output.

Test passwords are passed through temporary environment variables.
Do not save credentials in evidence or documentation.

## Current limitations

The search form and Favorite button retain their earlier demo behavior.
Authentication for POST is demonstrated through test requests;
a browser sign-in and listing creation form are not implemented.
The app includes loading, empty, and error states; manual state checks
must be completed before marking those checks verified.

The last observed npm audit retained five high findings in one ESLint
dependency chain. The critical Next.js finding was resolved.
See the current audit evidence for the final dependency state.