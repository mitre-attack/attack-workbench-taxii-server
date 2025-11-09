#!/bin/bash
# shellcheck source=./run.sh

dockerClean() {
  docker stop taxii || true
  docker rm taxii || true
}

loadVars() {
  echo "Loading variables from $(pwd)/config/${TAXII_ENV}.env"
  source "$(pwd)/config/${TAXII_ENV}.env"
}

dockerBuild() {
  # The build-args injects the environment variables to the Docker build context
  docker build \
    --build-arg TAXII_ENV="$TAXII_ENV" \
    --tag attack-workbench-taxii-server .
}

dockerRunOnLinux () {

  # If using Docker for Linux, use --network="host" in your docker run command, then 127.0.0.1 in your docker container
  # will point to your docker host.

  # If you are using Docker-for-Linux 20.10.0+, you can also use the host host.docker.internal if you started your
  # Docker container with the --add-host host.docker.internal:host-gateway option.

  if [[ "${TAXII_HTTPS}" == "true" ]]; then
      echo "HTTPS will be enabled..."
      docker run \
          -p $TAXII_APP_PORT_HTTPS:8443 \
          --network="host" \
          --name taxii \
          attack-workbench-taxii-server
  else
      docker run \
          -p $TAXII_APP_PORT:8000 \
          --network="host" \
          --name taxii \
          attack-workbench-taxii-server
  fi
}

dockerRunOnMacOrWindows () {

  # IMPORTANT: If Workbench is running on the same system as the TAXII server and both are Dockerized, then set
  # TAXII_STIX_SRC_URL=host.docker.internal to allow the TAXII server to connect to Workbench via localhost/127.0.0.1

  if [[ "${TAXII_HTTPS}" == "true" ]]; then
      echo "HTTPS will be enabled..."
      docker run \
          -p $TAXII_APP_PORT:8000 \
          --name taxii \
          attack-workbench-taxii-server
  else
      docker run \
          -p $TAXII_APP_PORT:8000 \
          --name taxii \
          attack-workbench-taxii-server
  fi
}

dockerRun() {
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
      # Linux
      echo "Executing from Linux..."
      dockerRunOnLinux

  elif [[ "$OSTYPE" == "darwin"* ]]; then
      # MacOS
      echo "Executing from macOS..."
      dockerRunOnMacOrWindows

  elif [[ "$OSTYPE" == "cygwin" ]]; then
      # POSIX compatibility layer and Linux environment emulation for Windows
      echo "Executing from Windows..."
      dockerRunOnMacOrWindows

  elif [[ "$OSTYPE" == "msys" ]]; then
      # Lightweight shell and GNU utilities compiled for Windows (part of MinGW)
      echo "Executing from Windows..."
      dockerRunOnMacOrWindows

  elif [[ "$OSTYPE" == "win32" ]]; then
      # I'm not sure this can happen.
      echo "Not sure how to handle win32"

  elif [[ "$OSTYPE" == "freebsd"* ]]; then
      # FreeBSD not supported
      echo "FreeBSD not supported"

  else
      # Unknown.
      echo "Could not determine OS of Docker host"

  fi
}

getDockerVersion () {
  # You can use this function to quickly determine your Docker version
  return "$(docker --version | awk -F' ' '{print $3}' | awk -F'.' '{print $1}')"
}


# You can uncomment the following line if you prefer to set your TAXII_ENV here (as opposed to declaring an env. variable)
# TAXII_ENV=dev.local

# Do the thing!
dockerClean \
  && loadVars \
  && dockerBuild \
  && dockerRun
