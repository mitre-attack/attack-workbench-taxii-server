# TAXII 2.1 API User Guide

> [!WARNING]
> The TAXII server hosted at `https://attack-taxii.mitre.org` is rate limited to only accept 10 requests per 10 minute period per source IP address.
> If you find yourself needing to query ATT&CK's content more frequently, please consider downloading the STIX/JSON bundles
> and parsing them directly. More information on this process can be found [here](https://github.com/mitre-attack/attack-stix-data/blob/master/USAGE.md)

## Introduction

TAXII (Trusted Automated eXchange of Intelligence Information) is a protocol used to exchange cyber threat intelligence over HTTPS. TAXII 2.1 is the latest version of this protocol.

## Base URL
The MITRE ATT&CK® TAXII 2.1 API is available at `https://attack-taxii.mitre.org`. 

The MITRE ATT&CK® TAXII 2.1 API root is `/api/v21/`.

Thus, the base URL all requests (excluding those sent to the [Discovery Endpoint](#endpoint-discovery)) is [https://attack-taxii.mitre.org/api/v21/](https://attack-taxii.mitre.org/api/v21/)

## Headers

A valid Accept header is required. The client must specify a media type supported by the TAXII 2.1 server. These include the following:

| Media Type                         | Description                                      |
| ---------------------------------- | ------------------------------------------------ |
| application/taxii+json;version=2.1 | TAXII version 2.1 in JSON                        |
| application/taxii+json             | Latest version of TAXII that the server supports |


## Endpoints

### Endpoint: Discovery
```
GET /taxii2/
```

Returns information about the TAXII server, including the API roots available.

Example request:
```bash
curl --request GET \
  --url https://attack-taxii.mitre.org/taxii2/ \
  --header 'Accept: application/taxii+json;version=2.1'
```

Example response:
```json
{
  "title": "MITRE ATT&CK TAXII 2.1",
  "description": "This API Root contains TAXII 2.1 REST API endpoints that serve MITRE ATT&CK STIX 2.1 data",
  "default": "api/v21",
  "api_roots": [
    "api/v21"
  ]
}
```
* In the example response above, the API root (`<api-root>`) is listed as `api/v21`. This is the API root used by the [MITRE ATT&CK® TAXII 2.1 Server](https://attack-taxii.mitre.org). We'll use this in subsequent examples.

### Endpoint: Get API Root Information
```
GET /<api-root>/
```

Returns information about the API root, including the collections available.

Example request:
```bash
curl --request GET \
  --url https://attack-taxii.mitre.org/api/v21/ \
  --header 'Accept: application/taxii+json;version=2.1'
```

Example response:
```json
{
  "title": "MITRE ATT&CK TAXII 2.1",
  "description": "This API Root contains TAXII 2.1 REST API endpoints that serve MITRE ATT&CK STIX 2.1 data",
  "version": "application/taxii+json;version=2.1",
  "maxContentLength": 1000
}
```

### Endpoint: Get Collections
```
GET /<api-root>/collections/
```

Returns a list of the collections available at the API root.

Example request:
```bash
curl --request GET \
  --url https://attack-taxii.mitre.org/api/v21/collections \
  --header 'Accept: application/taxii+json;version=2.1'
```

Example response:
```json
{
  "collections": [
    {
      "id": "x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019",
      "title": "Enterprise ATT&CK",
      "description": "ATT&CK for Enterprise provides a knowledge base of real-world adversary behavior targeting traditional enterprise networks. ATT&CK for Enterprise covers the following platforms: Windows, macOS, Linux, PRE, Office 365, Google Workspace, IaaS, Network, and Containers.",
      "canRead": true,
      "canWrite": false,
      "mediaTypes": [
        "application/taxii+json;version=2.1",
        "application/taxii+json"
      ]
    },
    {
      "id": "x-mitre-collection--90c00720-636b-4485-b342-8751d232bf09",
      "title": "ICS ATT&CK",
      "description": "The ATT&CK for Industrial Control Systems (ICS) knowledge base categorizes the unique set of tactics, techniques, and procedures (TTPs) used by threat actors in the ICS technology domain. ATT&CK for ICS outlines the portions of an ICS attack that are out of scope of Enterprise and reflects the various phases of an adversary's attack life cycle and the assets and systems they are known to target.",
      "canRead": true,
      "canWrite": false,
      "mediaTypes": [
        "application/taxii+json;version=2.1",
        "application/taxii+json"
      ]
    },
    {
      "id": "x-mitre-collection--dac0d2d7-8653-445c-9bff-82f934c1e858",
      "title": "Mobile ATT&CK",
      "description": "ATT&CK for Mobile is a matrix of adversary behavior against mobile devices (smartphones and tablets running the Android or iOS/iPadOS operating systems). ATT&CK for Mobile builds upon NIST's Mobile Threat Catalogue and also contains a separate matrix of network-based effects, which are techniques that an adversary can employ without access to the mobile device itself.",
      "canRead": true,
      "canWrite": false,
      "mediaTypes": [
        "application/taxii+json;version=2.1",
        "application/taxii+json"
      ]
    }
  ]
}
```

The response is an object with a key called `collections`. `collections` is an array of `collection` objects.

Note that each `collection` object contains an `id` property. You can use these identifiers to query the 'Get Collection' endpoint described in the next section.

### Endpoint: Get Collection
```
GET /<api-root>/collections/<collection-id>/
```

Returns information about a specific collection.

Example request:
```bash
curl --request GET \
  --url https://attack-taxii.mitre.org/api/v21/collections/x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019 \
  --header 'Accept: application/taxii+json;version=2.1'
```

Example response:
```json
{
  "id": "x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019",
  "title": "Enterprise ATT&CK",
  "description": "ATT&CK for Enterprise provides a knowledge base of real-world adversary behavior targeting traditional enterprise networks. ATT&CK for Enterprise covers the following platforms: Windows, macOS, Linux, PRE, Office 365, Google Workspace, IaaS, Network, and Containers.",
  "canRead": true,
  "canWrite": false,
  "mediaTypes": [
    "application/taxii+json;version=2.1",
    "application/taxii+json"
  ]
}
```

### Endpoint: Get Objects
```
GET /<api-root>/collections/<collection-id>/objects/
```

Returns a list of the STIX objects in a specific collection.

Example request:
```bash
curl --request GET \
  --url https://attack-taxii.mitre.org/api/v21/collections/x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019/objects \
  --header 'Accept: application/taxii+json;version=2.1'
```

Example response:
```json
{
  "more": false,
  "objects": [
    ...STIX 2.1 objects
]
```

### Endpoint: Get Object
```
GET /<api-root>/collections/<collection-id>/objects/<object-id>/
```
Returns a specific STIX object.

Example request:
```
curl --request GET \
  --url https://attack-taxii.mitre.org/api/v21/collections/x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019/objects/attack-pattern--ad255bfe-a9e6-4b52-a258-8d3462abe842 \
  --header 'Accept: application/taxii+json;version=2.1'
```

Example response:
```json
{
  "more": false,
  "objects": [
    {
      "id": "attack-pattern--ad255bfe-a9e6-4b52-a258-8d3462abe842",
      "modified": "2021-04-29T14:49:39.188Z",
      "created": "2017-05-31T21:30:18.931Z",
      "type": "attack-pattern",
      "spec_version": "2.1",
      "name": "Data Obfuscation",
      "description": "Adversaries may obfuscate command and control traffic to make it more difficult to detect. Command and control (C2) communications are hidden (but not necessarily encrypted) in an attempt to make the content more difficult to discover or decipher and to make the communication less conspicuous and hide commands from being seen. This encompasses many methods, such as adding junk data to protocol traffic, using steganography, or impersonating legitimate protocols. ",
      "kill_chain_phases": [
        {
          "kill_chain_name": "mitre-attack",
          "phase_name": "command-and-control"
        }
      ],
      "x_mitre_attack_spec_version": "2.1.0",
      "x_mitre_detection": "Analyze network data for uncommon data flows (e.g., a client sending significantly more data than it receives from a server). Processes utilizing the network that do not normally have network communication or have never been seen before are suspicious. Analyze packet contents to detect communications that do not follow the expected protocol behavior for the port that is being used. (Citation: University of Birmingham C2)",
      "x_mitre_domains": [
        "enterprise-attack"
      ],
      "x_mitre_is_subtechnique": false,
      "x_mitre_modified_by_ref": "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
      "x_mitre_platforms": [
        "Linux",
        "macOS",
        "Windows"
      ],
      "x_mitre_version": "1.1",
      "x_mitre_data_sources": [
        "Network Traffic: Network Traffic Content"
      ],
      "created_by_ref": "identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5",
      "external_references": [
        {
          "source_name": "mitre-attack",
          "url": "https://attack.mitre.org/techniques/T1001",
          "external_id": "T1001"
        },
        {
          "source_name": "University of Birmingham C2",
          "description": "Gardiner, J.,  Cova, M., Nagaraja, S. (2014, February). Command & Control Understanding, Denying and Detecting. Retrieved April 20, 2016.",
          "url": "https://arxiv.org/ftp/arxiv/papers/1408/1408.1136.pdf"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ]
    }
  ]
}
```

### Endpoint: Get Object Versions
```
GET /<api-root>/collections/<collection-id>/objects/<object-id>/versions/
```

Returns a list of object versions from a collection.

Example request:
```bash
curl --request GET \
  --url https://attack-taxii.mitre.org/api/v21/collections/x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019/objects/malware--72f54d66-675d-4587-9bd3-4ed09f9522e4/versions/ \
  --header 'Accept: application/taxii+json;version=2.1'
```

Example response:
```json
{
  "more": false,
  "versions": [
    "2022-04-25T14:00:00.188Z",
    "2023-08-17T19:51:14.195Z"
  ]
}
```


### Endpoint: Get Object Manifests
```
GET /<api-root>/collections/<collection-id>/manifest/
```

Returns manifest information about the contents of a specific collection.

Example Request:
```bash
curl --request GET \
  --url https://attack-taxii.mitre.org/api/v21/collections/x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019/manifest \
  --header 'Accept: application/taxii+json;version=2.1'
```

Example Response:
```json
{
  "more": false,
  "objects": [
    {
      "id": "attack-pattern--ad255bfe-a9e6-4b52-a258-8d3462abe842",
      "date_added": "Wed May 31 2017 21:30:18 GMT+0000 (Coordinated Universal Time)",
      "version": "2021-04-29T14:49:39.188Z",
      "media_type": "application/stix+taxii;version=2.1"
    }
    ...
  ]
}
```

## Authentication
TAXII 2.1 does not specify an authentication method. It's up to the implementation to provide this. Common methods include Basic Auth and Bearer Tokens.

## Error Handling
If an error occurs, the server will return a HTTP status code in the 400 or 500 range, along with a JSON object containing more information about the error.

## Filtering

TAXII Clients can request specific content from the TAXII Server by specifying a set of *filters* included in the request to the server. If no URL query parameter is specified then the TAXII Server returns all content for that Endpoint.

* `added_after`, A single timestamp that filters objects to only include those objects added after the specified timestamp. The value of this parameter is a timestamp. The `added_after` parameter is not in any way related to dates or times in a STIX object or any other CTI object.<br>**Example**: `?added_after=2022-01-01`

* `match[<field>]`, The match parameter defines filtering on the specified <field>. The list of fields that MUST be supported is defined per Endpoint. The match parameter can be specified any number of times, where each match instance specifies an additional filter to be applied to the resulting data and each <field> MUST NOT occur more than once in a request. Said another way, all match fields are ANDed together.

**Supported Fields for Match**:

| Field          | Description                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | The STIX ID of the object(s) that are being requested.<br>**Examples**: `?match[id]=indicator--3600ad1b-fff1-4c98-bcc9-4de3bc2e2ffb`                                                                                                                                                                                                                                                                                                      |
| `spec_version` | The specification version(s) of the STIX object that are being requested. If no `spec_version` parameter is provided, the server will return only the latest specification version that it can provide for each object.<br>**Examples**: `?match[spec_version]=2.0`, `?match[spec_version]=2.0,2.1`                                                                                                                                       |
| `type`         | The type of the object(s) that are being requested.<br>**Examples**: `?match[type]=indicator`, `?match[type]=indicator,sighting`                                                                                                                                                                                                                                                                                                          |
| `version`      | The version(s) of the object(s) that are being requested from either an object or manifest endpoint. If no version parameter is provided, the server will return only the latest version for each object matching the remainder of the request.<br>**Examples**: `?match[version]=all`, `?match[version]=last,first`, `?match[version]=first,2018-03-02T01:01:01.123Z,last`, `?match[version]=2016-03-23T01:01:01.000Z,2018-03-02T01:01:` |
