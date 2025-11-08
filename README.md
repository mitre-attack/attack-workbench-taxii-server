# ATT&CK Workbench TAXII Server

The ATT&CK Workbench TAXII server is a Node.js server designed to serve STIX 2.1 content through a
[TAXII 2.1](https://docs.oasis-open.org/cti/taxii/v2.1/csprd02/taxii-v2.1-csprd02.html) compliant REST API. It
runs as part of the overarching [ATT&CK Workbench project](https://medium.com/mitre-engenuity/att-ck-workbench-a-tool-for-extending-att-ck-e1718cbfe0ef).
The ATT&CK Workbench is an application allowing users to **explore**, **create**, **annotate**, and **share** extensions
of the MITRE ATT&CK® knowledge base.

The following resources provide supporting documentation about the TAXII protocol and use cases:

- [Introduction to TAXII](https://oasis-open.github.io/cti-documentation/taxii/intro.html)
- [TAXII 2.1 Specification](https://docs.oasis-open.org/cti/taxii/v2.1/os/taxii-v2.1-os.html)
- [OASIS Open TAXII Resources](https://oasis-open.github.io/cti-documentation/resources.html#taxii-21-specification)

The ATT&CK Workbench application requires additional components for full operation.
The [ATT&CK Workbench Frontend](https://github.com/center-for-threat-informed-defense/attack-workbench-frontend)
repository contains the full documentation of the scope and function of the project. See the [install and run](#install-and-run)
instructions for more details about setting up the entire project.

## API Roots

This application exposes contents of the local ATT&CK Workbench knowledge base through TAXII 2.1 [Collections](https://docs.oasis-open.org/cti/taxii/v2.1/os/taxii-v2.1-os.html#_Toc31107500).
Currently, one [API Root](https://docs.oasis-open.org/cti/taxii/v2.1/os/taxii-v2.1-os.html#_Toc31107498) is used to
logically group the available STIX collections and their associated endpoints. Users can see which API roots are available
through the server's [discovery endpoint](https://docs.oasis-open.org/cti/taxii/v2.1/os/taxii-v2.1-os.html#_q0a03pfr5x7n) (`/taxii2/`).

### Workbench Collections

The collections API root (`{api-root}/collections/`) provides access to Workbench data segregated by
[Workbench collection](https://github.com/center-for-threat-informed-defense/attack-workbench-frontend/blob/master/docs/collections.md).
Each version of each collection within the knowledge base, including both locally-created and imported collections, is
made available through this API Root. In addition, the most recent version of each collection is made available under a
static ID alias such that when a new version is created/imported the corresponding TAXII endpoint does not change. The
following diagram demonstrates this feature:

```text
TAXII Collection ID                            Workbench Collection
────────────────────────────────────           ───────────────────────────────────
4c936680-22bc-4e68-8037-ca7670493eef ◄───────┐ Enterprise ATT&CK (current version)
                                             │
bacf402e-b767-45bc-ae06-f0620d38ff15 ◄───────┴──── Enterprise ATT&CK v9
cda0f120-c30c-4499-a7f2-3bf859c876c3 ◄──────────── Enterprise ATT&CK v8
9cdda5dd-a8b7-41df-97e5-4fc01608dd26 ◄──────────── Enterprise ATT&CK v7

c7beaddb-f5a0-4602-bbb5-3383c1448de9 ◄───────┐ Mobile ATT&CK (current version)
                                             │
fde5d877-6f13-4694-b5c6-85d3f689f068 ◄───────┴──── Mobile ATT&CK v9
44f5bd59-ad8a-4103-8315-9cbb759c7a96 ◄──────────── Mobile ATT&CK v8
596f2f85-790e-4c37-97b7-cf68caa91f43 ◄──────────── Mobile ATT&CK v7
```

## TAXII Server Documentation

The application uses Swagger UI module to dynamically document the available REST API endpoints. The Swagger report can
be accessed at the path: `/api-docs`.

The [docs](/docs/README.md) folder contains additional documentation about using the TAXII Server:

- [SETUP](/docs/SETUP.md): Includes advanced details and instructions for setting up the TAXII Server.
- [USAGE](/docs/USAGE.md): User Guide on how to query/use the TAXII 2.1 REST API.
- [CONTRIBUTING](/docs/CONTRIBUTING.md): information about how to contribute to this project.

## Install and run

By default, the TAXII Server is not required to use the ATT&CK Workbench, but the ATT&CK Workbench is required to use
the TAXII server. The ATT&CK Workbench consists of the following software components:

- [ATT&CK Workbench Frontend](https://github.com/center-for-threat-informed-defense/attack-workbench-frontend): The front-end user interface for the ATT&CK Workbench tool, and the primary interface through which the knowledge base is accessed.
- [ATT&CK Workbench REST API](https://github.com/center-for-threat-informed-defense/attack-workbench-rest-api): REST API service for storing, querying and editing ATT&CK objects.
- [ATT&CK Workbench Collection Manager](https://github.com/center-for-threat-informed-defense/attack-workbench-collection-manager): REST API service for managing collections, collection indexes, and collection subscriptions. The collection manager is **not** required to be installed to use the ATT&CK Workbench, but is **highly recommended**.

Each of the aforementioned repositories contains their own respective deployment instructions. However, the easiest way
to deploy the entire ATT&CK Workbench is via the [Docker Compose](https://github.com/center-for-threat-informed-defense/attack-workbench-frontend/blob/master/docs/docker-compose.md) contained in the front-end repository.

### Docker

#### Container Registry

The ATT&CK Workbench TAXII server is packaged as a Docker image in the GitHub Container registry:

```shell
docker pull ghcr.io/mitre-attack/attack-workbench-taxii-server:latest
```

#### Build from source

If you wish to build a Docker image from source, a [shell script](./run.sh) is provided to ease the process. It handles
the following:

- loading environment variables from a specified dotenv file
- building a Docker image from source
- creating and starting a container instance

The script requires two environment variables:

- `TAXII_ENV`: used to determine the name of the dotenv configuration file
- `TAXII_APP_PORT`: used in the `docker run` command to expose the desired port

```shell
export TAXII_ENV=prod | dev | local
export TAXII_APP_PORT=443
./run.sh
```

### Manual Installation

#### Requirements

- [Node.js](https://nodejs.org) version `14.20.0` or greater
- [Node.js](https://nodejs.org) version must support `AsyncLocalStorage`

#### Installation

##### Step 1. Clone the git repository

```shell
git clone git@github.com:mitre-attack/attack-workbench-taxii-server.git
cd attack-workbench-taxii-server
```

##### Step 2. Install the dependencies

The ATT&CK Workbench TAXII Server installs all dependencies within the project.
It doesn't depend on the global installation of any modules.

```shell
npm install
```

##### Step 3. Configure the system

The app is configured using environment variables loaded from a dotenv file. A template is provided for your convenience.
See the [SETUP](./docs/SETUP.md#environment-variables) document for a list of supported environment variables and usage descriptions.

Store the dotenv file in the root `config/` directory, and ensure that the `TAXII_ENV` environment variable reflects the dotenv file name. `TAXII_ENV` determines the name of the environment variable which gets loaded by the server. For example:

- If `TAXII_ENV` is equal to `dev`, then the server attempts to load `config/dev.env`.
- If `TAXII_ENV` is equal to `prod`, then the server attempts to load `config/prod.env`.

Example:

```shell
export TAXII_ENV=dev
cp config/template.env config/${TAXII_ENV}.env
# modify the dev.env file
# done!
```

##### Step 4. Run the app

To run the production-mode server with Swagger enabled:

```shell
npm run build
npm run start
```

To run the server with hot-reload enabled (such that the server automatically reloads when you make a change to a file):

```shell
npm run start:dev
```

## Notice

Copyright 2025 The MITRE Corporation

Approved for Public Release; Distribution Unlimited. Case Number 21-2703.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

This project makes use of ATT&CK®

[ATT&CK Terms of Use](https://attack.mitre.org/resources/terms-of-use/)
