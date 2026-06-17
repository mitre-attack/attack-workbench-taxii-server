# Summary

The STIX module provides a Data Access Object (DAO) to the TAXII module. It is the primary vehicle by which
STIX data is retrieved.

The STIX module was designed to be dynamic in that users can select one of three ways to source their STIX data.
They are summarized below:

| Provider Name         | Description                                                                              | Status          |
| --------------------- | ---------------------------------------------------------------------------------------- | --------------- |
| WorkbenchRepository   | Retrieves STIX data from an instance of the Workbench REST API                           | Implemented     |
| MitreAttackRepository | Retrieves STIX data from the official MITRE ATT&CK releases on GitHub (attack-stix-data) | Implemented     |
| FileRepository        | Retrieves STIX data from one or more JSON files                                          | Not Implemented |
| OrmRepository         | Retrieves STIX data from a relational database                                           | Not Implemented |

The active provider is selected at boot time via the `TAXII_STIX_DATA_SRC` environment variable (`workbench`
or `mitre-attack`). The remaining providers may be implemented in future releases.

## MitreAttackRepository

The `MitreAttackRepository` sources STIX 2.1 content from the official MITRE ATT&CK releases published on
GitHub at [mitre-attack/attack-stix-data](https://github.com/mitre-attack/attack-stix-data), removing the need
to run an ATT&CK Workbench instance altogether. It is driven entirely by the repository's collection index
([index.json](https://github.com/mitre-attack/attack-stix-data/blob/master/index.json)), which documents every
STIX bundle that is available as a distinct ATT&CK release, organized by collection (one collection per ATT&CK
domain: `enterprise-attack`, `mobile-attack`, and `ics-attack`).

To use it, set:

```dotenv
TAXII_STIX_DATA_SRC=mitre-attack
# Optional. Defaults to the raw GitHub content URL for mitre-attack/attack-stix-data. Useful for mirrors.
TAXII_MITRE_ATTACK_DATA_URL=https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master
```

Because ATT&CK releases are immutable once published, the repository caches fetched resources (the collection
index and STIX bundles) in memory for a configurable TTL (10 minutes by default) to avoid re-downloading
multi-megabyte bundles on every hydration pass.

# Design

One of the primary goals of implementing this module was figuring out how to support multiple STIX storage mediums while
keeping the resultant accessor and mutator interfaces consistent and predictable. Though the TAXII 2.1 implementation
was primarily engineered to run alongside Workbench, in order to promote adoption, the implementation should at least be
capable of easily expanding to support other STIX storage types (e.g., JSON file, relational database) aside from Workbench.

The answer was to build a dynamic Nest module that provides the scaffolding, but leaves the implementation details up to
those interested in storing STIX in alternative storage mediums. At present, the scaffolding has been laid to support
the following three provider types (but more can be easily added):

1. Loading STIX via the Workbench REST API (**default**)
2. Loading STIX via a relational database
3. Loading STIX via JSON file(s)

The `StixModule` was designed to obfuscate provider details by exposing all available providers through the
`STIX_REPO_TOKEN` string. Developers are free to design STIX providers according to their preferences, and TAXII
administrators are free to use whichever STIX provider makes the most sense for them. This is accomplished by
masquerading all STIX providers behind the `STIX_REPO_TOKEN` provider string. Consuming services (i.e., TAXII providers)
need only declare a dependency on the `STIX_REPO_TOKEN` using Nest.js's dependency injection system, and map the
type definition of the injected token to the `StixRepositoryAbstract` parent class. All STIX providers (e.g.
`WorkbenchRepository`) must extend both the `StixRepositoryAbstract` class and the common interface
(`StixRepositoryInterface`) to ensure that consuming TAXII services have a uniform, consistent, and predictable API for
accessing STIX data.
