# Supabase Setup

Run `202605250001_initial_schema.sql` in the Supabase SQL editor or through the Supabase CLI.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
```

When the Supabase URL is missing or invalid, Bhojan intentionally falls back to local demo mode so the hackathon demo keeps running.
