#!/bin/bash

cd ..

TAXII_ENV=dev

# Load environment variables from dotenv file
# The set -a command means that any variable or function that is defined or changed in the .env file will be exported. This means these variables will be available to any child processes spawned from the script. The set +a command then turns off the automatic export of variables, preventing variables defined later in the script from being automatically exported.
set -a
source config/${TAXII_ENV}.env
set +a

docker build \
  --no-cache \
  --build-arg TAXII_ENV="${TAXII_ENV}" \
  --tag attack-workbench-taxii-server \
  .