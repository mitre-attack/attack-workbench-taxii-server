#!/bin/bash

cd ..

docker build \
  --no-cache \
  --build-arg TAXII_ENV="${TAXII_ENV}" \
  --tag attack-workbench-taxii-server \
  .