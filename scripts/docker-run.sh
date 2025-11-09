#!/bin/bash

# Notes on the use of this script:
#
# - The shell environment from which you are executing this script must have environment variable 'TAXII_ENV' set
#   as this script will pass that environment variable into the container.
#
# - This script assumes that your dotenv configuration and PEM files are stored in the 'config' directory located in
#   the root of the project. This is important because {project-dir}/config/ on the host gets volume-mounted to
#   /app/config on the container. The TAXII application reads configuration parameters from this directory.
#
# - This script assumes that your TAXII server wants to communicate with a Workbench instance connected to a virtual
#   network bridge called "attack-workbench-deployment_default". This name is used by default when initializing
#   Workbench from the docker-compose.taxii.yml template in the "ATT&CK Workbench Deployment" GitHub repository.
#   If your Workbench containers (e.g., attack-workbench-rest-api) is connected to a different network bridge, you
#   should modify the --network flag accordingly, otherwise your TAXII application may not be able to communicate
#   with the other Workbench containers.

# Change to the root project directory
cd ..

# Start the container
docker run \
  -d \
  -p 8000:8000 \
  -e "TAXII_ENV=${TAXII_ENV}" \
  --network="attack-workbench-deployment_default" \
  -v "${PWD}"/config:/app/config \
  --name taxii \
  attack-workbench-taxii-server