#!/bin/bash
git submodule update --init --recursive
docker build -f ../Dockerfile --build-arg AVALANCHE_VERSION=v1.11.10 -t ghcr.io/multisig-labs/gogopro-container .
