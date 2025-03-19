set dotenv-load

run-watchdog:
  deno run --allow-env --allow-net watchdog/main.ts

gen-types:
  supabase gen types --project-id=sstqretxgcehhfbdjwcz > watchdog/types.ts

# annoyingly, we need to fake having a git repo to build the avalanchego image
# create a git repo with a single commit and build the image
# then delete the git repo while preserving the directory
build-avalanche:
  #!/bin/bash
  echo "Building Avalanchego..."
  cd avalanchego
  docker build -f ../Dockerfile.avago --build-arg GO_VERSION=1.23.6  -t multisig-labs/avalanchego:latest .
  cd ..

build-lancer-container:
  #!/bin/bash
  cd subnet-evm
  docker build -f ../Dockerfile -t ghcr.io/multisig-labs/lancer-container .
  cd ..

build: build-avalanche build-lancer-container
