-- Combined migration — run this file in Supabase SQL Editor for one-shot setup.
-- Or run files 001–004 in order via Supabase CLI.

\i 001_initial_schema.sql
\i 002_rls_policies.sql
\i 003_functions.sql
\i 004_seed_data.sql
