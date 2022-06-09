# Summary

The `TaxiiModule` is responsible for generating TAXII resources and exposing them through 
a REST API.

The available TAXII endpoints are summarized below:

| Method | Path                                                | Endpoint Name            | Class.function                           | Response Type       | Description                                                                                            |
|--------|-----------------------------------------------------|--------------------------|------------------------------------------|---------------------|--------------------------------------------------------------------------------------------------------|
| GET    | /taxii2/                                            | Server Discovery         | RootController.serverDiscovery           | DiscoveryDto        | This Endpoint provides general information about the TAXII Server, including the advertised API Roots. |
| GET    | /{api-root}/                                        | Get API Root Information | RootController.getApiRootInformation     | ApiRootDto          | This Endpoint provides general information about an API Root.                                          |
| GET    | /{api-root}/{status-id}/                            | Get Status               | NOT IMPLEMENTED                          | -                   | This Endpoint has not been implemented.                                                                |
| GET    | /{api-root}/collections/                            | Get Collections          | CollectionsController.getCollections     | TaxiiCollectionsDto | This Endpoint provides information about the Collections hosted under this API Root.                   |
| GET    | /{api-root}/collections/{id}/                       | Get A Collection         | CollectionsController.getACollection     | TaxiiCollectionDto  | This Endpoint provides general information about a Collection.                                         |
| GET    | /{api-root}/collections/{id}/manifest/              | Get Object Manifests     | CollectionsController.getObjectManifests | ManifestDto         | This Endpoint retrieves a manifest (metadata) about the objects in a Collection.                       |
| GET    | /{api-root}/collections/{id}/objects/               | Get Objects              | CollectionsController.getObjects         | EnvelopeDto         | This Endpoint retrieves objects from a Collection.                                                     |
| GET    | /{api-root}/collections/{id}/objects/{id}/          | Get An Object            | CollectionsController.getAnObject        | EnvelopeDto         | This Endpoint gets an object from a Collection by its `id`.                                            |
| POST   | /{api-root}/collections/{id}/objects/{id}/          | Add An Object            | NOT IMPLEMENTED                          | -                   | This Endpoint has not been implemented.                                                                |
| DELETE | /{api-root}/collections/{id}/objects/{id}/          | Delete An Object         | NOT IMPLEMENTED                          | -                   | This Endpoint has not been implemented.                                                                |
| GET    | /{api-root}/collections/{id}/objects/{id}/versions/ | Get Object Versions      | CollectionsController.getObjectVersions  | VersionsDto         | This Endpoint retrieves a list of one or more versions of an object in a Collection.                   |