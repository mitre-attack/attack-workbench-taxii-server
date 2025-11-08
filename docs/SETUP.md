# SETUP

The ATT&CK Workbench TAXII server is a Node.js server designed to serve STIX 2.1 content through a
[TAXII 2.1](https://docs.oasis-open.org/cti/taxii/v2.1/csprd02/taxii-v2.1-csprd02.html) compliant REST API. It is
loosely coupled to ATT&CK Workbench in that users are empowered to connect their own STIX repositories. By default, the
TAXII server sources all STIX data from the Workbench REST API. The TAXII server can run in several deployment models:

1. As a standalone Node.js instance.
2. As a standalone Docker container.
3. As a multi-container Workbench ensemble via Docker Compose.

## Endpoints

All available HTTP endpoints are summarized in the
[taxii module](https://github.com/mitre-attack/attack-workbench-taxii-server/tree/main/src/taxii).

While the TAXII _protocol_ does allow for POST requests, this implementation is read-only and does not provide the means
to write data to the local knowledge base.

There are a few notable endpoint-related deviations from the TAXII 2.1 specifications:

1. The `POST` (_"Add an Object"_) and `DELETE` (_"Delete An Object"_) endpoints are not implemented. The
   reason for these exclusions come from the fundamental design decision to loosely couple the TAXII 2.1 server to
   Workbench. The TAXII 2.1 server reads STIX data from the Workbench REST API, and re-expresses the data in accordance
   with the TAXII specification. In other words, data flow is unidirectional. We opted to omit any TAXII endpoints
   that duplicate existing Workbench functionality, which happens to include the aforementioned `POST` and `DELETE`
   endpoints. However, we recognize that some community members may prefer to not use Workbench, so we designed the
   `stix` module to be capable of loading data from other sources. More details can be found in the
   [stix module](https://github.com/mitre-attack/attack-workbench-taxii-server/tree/main/src/stix).
2. The _"Get Status"_ endpoint is not implemented. This endpoint only serves to monitor the status of `POST` requests
(i.e., adding objects to a collection). This endpoint was omitted because there are no `POST` endpoints to monitor.

## Environment Variables

All environment variables are assessed at runtime. Any subsequent changes (after the server is started) will require
the server to be rebooted for the changes to take effect.

At present, the following environment variables are supported:

| Name                          | Type | Default Value                                                                             | Description                                                                                                                                                                                                                               |
| ----------------------------- | ---- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TAXII_APP_ADDRESS`           | str  | 0.0.0.0                                                                                   | Specifies which network interface the server should bind to                                                                                                                                                                               |
| `TAXII_APP_PORT`              | int  | 443                                                                                       | Specifies which port the server should listen on                                                                                                                                                                                          |
| `TAXII_MAX_CONTENT_LENGTH`    | int  | 0                                                                                         | Limits the maximum size of the message body that the server will accept                                                                                                                                                                   |
| `TAXII_API_ROOT_PATH`         | str  | /api/v21/                                                                                 | Prefix for all TAXII 2.1 endpoints (excluding the Discovery endpoint [/taxii2/])                                                                                                                                                          |
| `TAXII_API_ROOT_TITLE`        | str  | MITRE ATT&CK TAXII 2.1                                                                    | A title for the API root (observed on responses to the 'Get API Root Information' endpoint)                                                                                                                                               |
| `TAXII_API_ROOT_DESCRIPTION`  | str  | This API Root contains TAXII 2.1 REST API endpoints that serve MITRE ATT&CK STIX 2.1 data | A summary or description of the API root                                                                                                                                                                                                  |
| `TAXII_CONTACT_EMAIL`         | str  | <no-reply@your-company.tld>                                                               | The email address which is advertised on responses to the Discovery endpoint (/taxii2/)                                                                                                                                                   |
| `TAXII_CACHE_TYPE`            | str  | default                                                                                   | Specifies what type of cache the TAXII server should use; Supported values: 'default' or 'memcached'                                                                                                                                      |
| `TAXII_CACHE_HOST`            | str  | localhost                                                                                 | IP or FQDN of the cache host. Supports multiple comma-separated hosts. e.g., a.b.c.d, w.x.y.z                                                                                                                                             |
| `TAXII_CACHE_PORT`            | int  | 6379                                                                                      | Port on which cache daemon/service is listening                                                                                                                                                                                           |
| `TAXII_CACHE_TTL`             | int  | 600                                                                                       | Amount of time a cache entry can idle in cache before removal/expiration. Measured in seconds.                                                                                                                                            |
| `TAXII_CACHE_MAX_ITEM_SIZE`   | int  | 50m                                                                                       | The maximum size (in bytes) per item that can be cached. Analogous to the memcached `-I` parameter which allows you to specify the maximum item size at runtime. It supports a unit postfix to allow for natural expression of item size. |
| `TAXII_CACHE_NET_TIMEOUT`     | int  | 6000                                                                                      | Specifies how long the TAXII server will wait for responses from Memcached. Measured in ms.                                                                                                                                               |
| `TAXII_CACHE_RECONNECT`       | bool | true                                                                                      | Specifies whether the server should continue re-attempting to connect the cache host in the event there is a disconnect                                                                                                                   |
| `TAXII_CACHE_MEM_SIZE`        | int  | 4096                                                                                      | Sets the amount of memory allocated to memcached for object storage. ONLY USED BY MEMCACHED.                                                                                                                                              |
| `TAXII_CORS_ENABLED`          | bool | false                                                                                     | Specifies whether CORS should be enabled on the server                                                                                                                                                                                    |
| `TAXII_STIX_SRC_URL`          | str  | <http://localhost:3000>                                                                   | Specifies the address and port on which the Workbench REST API is listening.                                                                                                                                                              |
| `TAXII_STIX_DATA_SRC`         | str  | workbench                                                                                 | Specifies how the server will source/ingest STIX data. At the moment, only 'workbench' is supported.                                                                                                                                      |
| `TAXII_WORKBENCH_AUTH_HEADER` | str  | dGF4aWktc2VydmVyOnNlY3JldC1zcXVpcnJlbA==                                                  | Specifies the base64-encoded portion of the Authorization header that should be used on HTTP requests to the Workbench REST API.                                                                                                          |
| `TAXII_MONGO_URI`             | str  | mongodb://localhost/taxii                                                                 | Specifies the URI of the MongoDB instance.                                                                                                                                                                                                |
| `TAXII_LOG_LEVEL`             | str  | info                                                                                      | Default winston logging level. Conforms to RFC5424                                                                                                                                                                                        |
| `TAXII_LOG_TO_FILE`           | bool | false                                                                                     | Specifies whether the server should write logs to file (in addition to stdout)                                                                                                                                                            |
| `TAXII_HTTPS_ENABLED`         | bool | true                                                                                      | Specifies whether the server should use HTTPS (SSL/TLS)                                                                                                                                                                                   |
| `TAXII_HYDRATE_ON_BOOT`       | bool | false                                                                                     | Specifies whether the TAXII collector should begin database hydration at runtime.                                                                                                                                                         |
| `TAXII_LOG_TO_HTTP_HOST`      | str  | -                                                                                         | Specifies the address (IP or FQDN) of a log listener. The server will attempt to send logs to this address if a value is set.                                                                                                             |
| `TAXII_LOG_TO_HTTP_PORT`      | int  | -                                                                                         | Specifies the port of the log listener                                                                                                                                                                                                    |
| `TAXII_LOG_TO_HTTP_PATH`      | str  | -                                                                                         | Specifies the HTTP endpoint of the log listener                                                                                                                                                                                           |
| `TAXII_LOG_TO_SLACK_URL`      | str  | -                                                                                         | Specifies a Slack URL. The server will attempt to send logs to this address if a value is set.                                                                                                                                            |
| `TAXII_LOG_TO_SENTRY_DSN`     | str  | -                                                                                         | Specifies a Sentry Data Source Name (DSN). The server will attempt to send logs to this address if a value is set.                                                                                                                        |
| `TAXII_SSL_PRIVATE_KEY`       | str  | -                                                                                         | Base64 encoded string containing the SSL/TLS private key.                                                                                                                                                                                 |
| `TAXII_SSL_PUBLIC_KEY`        | str  | -                                                                                         | Base64 encoded string containing the SSL/TLS public key.                                                                                                                                                                                  |

## Authorization

If the TAXII server is configured to source STIX from the `WorkbenchRepository`, then the TAXII server must authenticate
to the Workbench REST API using Basic Auth. There are two steps to enabling the TAXII server to authenticate to
the Workbench REST API:

1. Basic Auth must be enabled on the Workbench REST API and a service account & API key must be provisioned for the
TAXII server. Here is
[an example](https://github.com/center-for-threat-informed-defense/attack-workbench-rest-api/blob/develop/resources/sample-configurations/test-service-basic-apikey.json).

2. On the TAXII server, `TAXII_WORKBENCH_AUTH_HEADER` must be set to the aforementioned encoded service account
name and API key. The values must be base64 encoded from the string format `service-name:api-key`.

_e.g._, The Workbench REST API has configured a basic authorization service account for the TAXII server.
The username is `taxii-server` and the key is `secret-squirrel`.

```json5
// rest-api-service-config.json

{
  "serviceAuthn": {
    "basicApikey": {
      "enable": true,
      "serviceAccounts": [
        {
          "name": "taxii-server",
          "apikey": "secret-squirrel",
          "serviceRole": "read-only"
        }
      ]
    }
  }
}
```

The Workbench REST API expects clients to authenticate with `Authorization` header
`Basic dGF4aWktc2VydmVyOnNlY3JldC1zcXVpcnJlbA==`.

The string is a base-64 encoded string generated from the UTF-8 string value, `taxii-server:secret-squirrel`.

```json
{
  "decoded": "taxii-server:secret-squirrel",
  "encoded": "dGF4aWktc2VydmVyOnNlY3JldC1zcXVpcnJlbA=="
}
```

The TAXII server is configured to send HTTP requests to the Workbench REST API with the following header:

```json
{
  "Authorization": "Basic dGF4aWktc2VydmVyOnNlY3JldC1zcXVpcnJlbA=="
}
```

The base64 encoded portion of the authorization string is injected to the TAXII server using environment variable
`TAXII_WORKBENCH_AUTH_HEADER`.

```js
{
  Authorization: `Basic ${env.TAXII_WORKBENCH_AUTH_HEADER}`
}
```

## HTTPS (TLS)

SSL/TLS can be enabled or disabled by setting the `TAXII_HTTPS_ENABLED` environment variable.

```shell
export TAXII_HTTPS_ENABLED=true   # enable HTTPS
export TAXII_HTTPS_ENABLED=false  # disable HTTPS
```

If enabled, a private key and a public key must be provided. The public and private keys can be provided in **two ways**:

1. Set environment variables `TAXII_SSL_PRIVATE_KEY` and `TAXII_SSL_PUBLIC_KEY`. Both keys must be base64 encoded. A
   simple JS utility, `encodePem.js`, is provided in the project root directory to help convert your PEM files to base64
   encoded strings. See the `encodePem.js` file for instructions on how to use it.
2. Place the keys in `{project-root}/config/`. Name the file containing the public key `public-certificate.pem` and name
   the file containing the private key `private-key.pem`.

The server will prioritize option 1 over option 2 if both are set.  In other words, if `config/private-key.pem` &
`config/public-certificate.pem` exists, _and_ `TAXII_SSL_PRIVATE_KEY` & `TAXII_SSL_PRIVATE_KEY` are set, then the
former (`config/*.pem`) will take precedence.

## Database

An instance of MongoDB is required in order to run the TAXII 2.1 server. By default, the server will query for STIX
objects from the `taxii` database. The TAXII server will generate (and serve) TAXII resources based on the contents of
the following two Mongo Collections:

- `attackObjects` : Stores STIX resources
- `taxiicollections` : Stores TAXII Collection resources

The `taxii` database is populated by the TAXII Collector, which can be initialized & run via `npm run hydrate`.
Synchronization is handled by the `HydrateModule` and occurs every hour at the `HH:00` and `HH:30` minute mark (_e.g._, 12:00,
12:30, 1:00, 1:30).

The TAXII Collector can be configured to start hydrating the database as soon as it initializes by setting the
`TAXII_HYDRATE_ON_BOOT` environment variable to `true`. This can be helpful in instances where the database is empty
(and thus requires hydration) but the time is something like 12:45. In this example, rather than wait 15 minutes for the
automated task scheduler to trigger, `TAXII_HYDRATE_ON_BOOT` can be used to force hydration to occur as soon as the TAXII
collector initializes. Alternatively, if the database is already hydrated (and thus hydration is not needed at runtime),
`TAXII_HYDRATE_ON_BOOT` can be disabled. This will restrict the task scheduler to only run at the `HH:00` and `HH:30`
minute mark.

## Clustering

The production instance of the TAXII server (`npm run start:prod`) is encapsulated in a PM2 cluster. Two independent
processes are contained in the cluster:

1. TAXII 2.1 Server (`taxii21-server`) : Initialized by `src/main.ts`, this process runs the user-facing web API and
serves STIX data from an instance of MongoDB (as defined by the `TAXII_MONGO_URI` environment variable).

2. TAXII Collector (`taxii21-collector`) : Initialized by `src/hydrate.ts`, this process is responsible for synchronizing
and hydrating the Mongo database. This process is expected to run in the background and operates on a timer via the
Nest.js native [task scheduler](https://docs.nestjs.com/techniques/task-scheduling). It retrieves STIX objects from an
instance of Workbench (as determined by the `TAXII_STIX_SRC_URL` environment variable) and writes them to Mongo
Collections that the `taxii21-server` process queries resources from.

```text
/app # pm2 list
┌─────┬──────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name                 │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼──────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 1   │ taxii21-collector    │ default     │ 0.9.0   │ cluster │ 19       │ 4h     │ 0    │ online    │ 0%       │ 96.0mb   │ root     │ disabled │
│ 0   │ taxii21-server       │ default     │ 0.9.0   │ cluster │ 18       │ 4h     │ 0    │ online    │ 0%       │ 129.4mb  │ root     │ disabled │
│ 2   │ taxii21-server       │ default     │ 0.9.0   │ cluster │ 32       │ 4h     │ 0    │ online    │ 0%       │ 129.5mb  │ root     │ disabled │
│ 3   │ taxii21-server       │ default     │ 0.9.0   │ cluster │ 39       │ 4h     │ 0    │ online    │ 0%       │ 129.2mb  │ root     │ disabled │
│ 4   │ taxii21-server       │ default     │ 0.9.0   │ cluster │ 46       │ 4h     │ 0    │ online    │ 0%       │ 129.0mb  │ root     │ disabled │
└─────┴──────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

## Logging

The TAXII server ships with a custom logger implementation that extends an instance of
[winston](https://www.npmjs.com/package/winston) to the default Nest.js module. The logger is a Nest.js provider that
uses the `REQUEST` [injection scope](https://docs.nestjs.com/fundamentals/injection-scopes) in conjunction with the
[request-context](../src/common/middleware/request-context/index.ts) module to correlate all log output to the user request. All
inbound user HTTP request objects are assigned a unique ID.

In the following example, the server received an HTTP request on the discovery endpoint, `GET /taxii2/`. The first line
indicates that the `SetRequestIdMiddleware` provider received the request and assigned random uuid
`a48bab11-e950-5e4f-9b9d-dcd9372ac3dd` to it. The second and third lines show the request object flowing through the
request pipeline. The same UUID appears in all log output, so we can easily trace how & where the user request flowed
through the system.

```Nest
[Nest] 1  - 06/08/2022, 2:15:28 PM     LOG [SetRequestIdMiddleware] New request: [a48bab11-e950-5e4f-9b9d-dcd9372ac3dd] GET /taxii2/ - application/taxii+json;version=2.1  insomnia/2022.3.0 ::ffff:172.17.0.1
[Nest] 1  - 06/08/2022, 2:15:28 PM   DEBUG [RootController] [a48bab11-e950-5e4f-9b9d-dcd9372ac3dd]  Received a discovery request
[Nest] 1  - 06/08/2022, 2:15:28 PM     LOG [ResLoggerMiddleware] Outgoing response: [a48bab11-e950-5e4f-9b9d-dcd9372ac3dd] 200 GET /taxii2/ 214 - insomnia/2022.3.0 ::ffff:172.17.0.1
```

### Log Level

Environment variable `TAXII_LOG_LEVEL` is used to configure the embedded `winston` instance, which conveniently conforms
to the severity ordering specified by [RFC5424](https://tools.ietf.org/html/rfc5424).

> Logging levels in winston conform to the severity ordering specified by RFC5424: severity of all levels is assumed to be numerically ascending from most important to least important.
>
> Each level is given a specific integer priority. The higher the priority the more important the message is considered to be, and the lower the corresponding integer priority. For example, as specified exactly in RFC5424 the syslog levels are prioritized from 0 to 7 (highest to lowest).

Logs sent to stdout cannot be disabled or filtered at this time.

The following values are supported by `TAXII_LOG_LEVEL`:

- `emerg`
- `alert`
- `crit`
- `error`
- `warning`
- `notice`
- `info` (default)
- `debug`

### Log To File

Set environment variable `TAXII_LOG_TO_FILE` to `true` to configure the server to write logs to a file _in addition_ to
stdout. If `TAXII_LOG_TO_FILE` is not set, then the logger will not attempt to write logs to file.

When enabled, logs are written to a file named `taxii_server_${timestamp}.log`, _e.g._, `taxii_server_2022-02-17.log`.

Logs written to file by `winston` are formatted in `JSON`.

### Log To HTTP

The embedded `winston` implementation is capable of sending logs to an HTTP endpoint. The logger can be configured to
send logs to an HTTP listener by enabling the following three environment variables:

- `TAXII_LOG_TO_HTTP_HOST`: the log listener's IP or FQDN
- `TAXII_LOG_TO_HTTP_PORT`: the log listener's port
- `TAXII_LOG_TO_HTTP_PATH`: the log listener's endpoint (e.g., `/api/logs`)

The TAXII server will attempt to enable the HTTP log forwarder when `TAXII_LOG_TO_HTTP_HOST` is set to a defined value.

Please note that logging to HTTP has not been fully tested. This feature is provided as is.

### Log To Slack

The embedded `winston` implementation takes advantage of [winston-slack-webhook-transport](https://www.npmjs.com/package/winston-slack-webhook-transport)
to forward logs to a Slack webhook. The full webhook URL can be configured via environment variable `TAXII_LOG_TO_SLACK_URL`.
If `TAXII_LOG_TO_SLACK_URL` is not set, then the logger will not attempt to send logs to Slack.

Please note that logging to Slack has not been fully tested. This feature is provided as is.

### Log To Sentry

The embedded `winston` implementation takes advantage of [winston-transport-sentry-node](https://www.npmjs.com/package/winston-transport-sentry-node)
to forward logs to Sentry. The Sentry DSN path (_e.g._, `'https://******@sentry.io/12345'`) can be configured via
environment variable `TAXII_LOG_TO_SENTRY_DSN`. If `TAXII_LOG_TO_SENTRY_DSN` is not set, then the logger will not attempt
to send logs to Sentry.

Please note that logging to Sentry has not been fully tested. This feature is provided as is.

## Caching

The TAXII server provides a dynamic cache provider that supports two types of caches:

1. An [in-memory cache](https://docs.nestjs.com/techniques/caching) (default)
2. [Memcached](https://memcached.org/)

Caching is used by the `WorkbenchModule` to store responses from the Workbench REST API.

### Memcached

The TAXII server can be configured to use Memcached by setting environment variable `TAXII_CACHE_TYPE` to `memcached`.

```shell
export TAXII_CACHE_TYPE=memcached
```

While external cache implementations are outside the scope of the TAXII server, a containerized instance of `memcached`
can easily be spun-up by using the Docker Compose template located in the [attack-workbench-deployment](https://github.com/mitre-attack/attack-workbench-deployment)
repository.

The following configuration parameters can be set via environment variables when `memcached` is enabled:

- `TAXII_CACHE_HOST`: The IP address or FQDN of the Memcached server
- `TAXII_CACHE_PORT`: The port on which the Memcached server is listening
- `TAXII_CACHE_TTL`: The duration of time that an item should remain in the cache before removal
- `TAXII_CACHE_MAX_ITEM_SIZE`: The maximum size of each item allowed in the cache. This value also sets the corresponding server-side setting (i.e., Maps to the `memcached -I` flag.)
- `TAXII_CACHE_MEM_SIZE`: Sets the amount of memory allocated to memcached for object  storage. (e.g., Maps to the `memcached -m` flag.) This setting only applies to the Memcached server; not the TAXII app!

Note that the TAXII application can only map to one instance of Memcached. Multiple Memcached servers cannot be used.

The following configuration parameters can be set via environment variables when the in-memory (`default`) cache is enabled:

- `TAXII_CACHE_TTL`: The duration of time that an item should remain in the cache before removal

## Scripts

`package.json` contains a number of scripts that can be used to perform recurring tasks.

- `prebuild`: deletes the entire `dist/` directory if it exists.
- `build`: transpiles the TypeScript code to JavaScript in the `dist/` directory.
- `start`: starts the server in a single Node.js process.
- `hydrate`: starts the TAXII collector process.
- `start:prod`: starts the server in a PM2 cluster. References [ecosystem.config.js](../ecosystem.config.js) for instructions.
- `start:dev`: starts the server in "hot-reload" mode. Useful for development.
- `test:e2e`: starts the end-to-end HTTP tests to ensure that all available TAXII endpoints are working as expected. Note
that the E2E test suite requires a live, pre-populated database to run correctly.
- `test`: executes a series of unit tests to ensure that all Nest.js components/modules are working as expected.

A few additional scripts are provided to simplify various aspects of the deployment process:

- [docker_build.sh](../scripts/docker_build.sh) is a simple wrapper script that makes it easier to [re]build the Docker image.

- [run.sh](../run.sh) cleans, builds, and runs a containerized instance of the TAXII server. Details are described in
the [Build from source](../README.md#build-from-source) section of the [README](../README.md) file.

- [encode.js](../scripts/encodePem.js) is described in the [HTTPS](#https-tls) section of this document.
