set dotenv-load

run-watchdog:
  deno run --allow-env --allow-net watchdog/main.ts

gen-types:
  supabase gen types --project-id=sstqretxgcehhfbdjwcz > watchdog/types.ts
