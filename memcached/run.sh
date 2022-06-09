#!/bin/bash
docker image build --tag attack-workbench-taxii-server-cache .
docker run --name attack-workbench-taxii-server-cache -p 11211:11211 -d attack-workbench-taxii-server-cache