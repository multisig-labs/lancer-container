set dotenv-load

dev:
  #!/bin/bash
  cd api
  go run main.go
  cd ..

migrate:
  #!/bin/bash
  cd api
  go run cmd/populate/main.go
  cd ..

run-watchdog:
  deno run --allow-env --allow-net watchdog/main.ts
