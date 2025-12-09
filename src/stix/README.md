# Summary

The STIX module provides a Data Access Object (DAO) to the TAXII module. It is the primary vehicle by which
STIX data is retrieved.

The STIX module was designed to be dynamic in that users can select one of three ways to source their STIX data.
They are summarized below:

| Provider Name       | Description                                                    | Status          |
| ------------------- | -------------------------------------------------------------- | --------------- |
| WorkbenchRepository | Retrieves STIX data from an instance of the Workbench REST API | Implemented     |
| FileRepository      | Retrieves STIX data from one or more JSON files                | Not Implemented |
| OrmRepository       | Retrieves STIX data from a relational database                 | Not Implemented |

At the time of this writing, only one of the STIX providers has been fully implemented. The other two may be
implemented in future releases.

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
