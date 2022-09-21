#!/bin/bash

cd ..
docker build --build-arg TAXII_ENV=dev --tag attack-workbench-taxii-server .