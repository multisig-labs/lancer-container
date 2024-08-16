#!/bin/bash
# check if ghcr.io/multisig-labs/gogopro-container exists
# if it does not exist, build it
if ! docker inspect ghcr.io/multisig-labs/gogopro-container:latest > /dev/null 2>&1; then
    git submodule update --init --recursive
    docker build -f ../Dockerfile --build-arg AVALANCHE_VERSION=v1.11.10 -t ghcr.io/multisig-labs/gogopro-container .
fi

# check if there is a volume called avalanche-data
# if there is not, create it
if ! docker volume inspect avalanche-data > /dev/null 2>&1; then
    docker volume create avalanche-data
fi

# list of directories that need mounted
# /root/.avalanchego/config needs mounted to local directory /root/avalanchego-config
# mount /root/.avalanchego/chainData to avalanchego-data/chainData
# mount /root/.avalanchego/db to avalanchego-data/db
# mount /root/.avalanchego/logs to local directory /root/avalanchego-logs
# mount /root/.avalanchego/staking to local directory /root/avalanchego-staking

docker run --rm -it -v avalanche-data:/root/.avalanchego/chainData -v avalanche-data:/root/.avalanchego/db -v avalanche-data:/root/.avalanchego/staking -v /root/avalanchego-config:/root/.avalanchego/config -v /root/avalanchego-logs:/root/.avalanchego/logs -v /root/avalanchego-staking:/root/.avalanchego/staking -p 9650:9650 -p 9651:9651 -p 9652:9652 -p 9653:9653 ghcr.io/multisig-labs/gogopro-container --network-id=fuji
