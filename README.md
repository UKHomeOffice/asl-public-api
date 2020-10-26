# asl-public-api

## About

API server providing access to licence and user data

## Usage

To run a local instance:

```
npm run dev
```

## Dependencies

* `@asl/service/api` provides the common api boilerplate - body-parsing, auth etc.
* `@asl/schema` provides models for interacting with database objects

## Configuration

The service can be configured for local development by setting environment variables in a `.env` file.

The following environment variables are required:

* `WORKFLOW_SERVICE` - the url of the `asl-workflow` instance
* `SEARCH_SERVICE` - the url of the `asl-public-search` instance
* `PERMISSIONS_SERVICE` - the url of the `asl-permissions` instance
* `DATABASE_NAME` - the name of your postgres database
* `KEYCLOAK_REALM` - the keycloak realm used for authentication
* `KEYCLOAK_URL` - the url of the keycloak server
* `KEYCLOAK_CLIENT` - the client name used to authenticate with keycloak
* `KEYCLOAK_SECRET` - the secret used to authenticate with the keycloak client
* `KEYCLOAK_USERNAME` - administrator username to authenticate with the keycloak client
* `KEYCLOAK_PASSWORD` - administrator password used to authenticate with the keycloak client

The following environment variables can be optionally defined:

* `PORT` - port that the service will listen on - default `8080`
* `DATABASE_HOST` - hostname of the postgres instance - default `localhost`
* `DATABASE_PORT` - port of the postgres instance - default `5432`
* `DATABASE_USERNAME` - username of the postgres instance - default `undefined`
* `DATABASE_PASSWORD` - password of the postgres instance - default `undefined`
* `DATABASE_POOL_SIZE` - maximum size of the postgres connection pool - default `5`
* `REDIS_HOST` - redis instance used to store rate limit data - default `localhost`
* `REDIS_PORT` - redis instance used to store rate limit data - default `6379`
* `REDIS_PASSWORD` - redis instance used to store rate limit data - default `undefined`
* `RATE_LIMIT_TOTAL` - maximum requests per hour allowable per-user - default `1000`
* `BODY_SIZE_LIMIT` - maximum body size for requests - default `50mb`

## Connected services

### Upstream

* `asl` - establishment facing ui
* `asl-inspector-ui` - internal facing ui.

### Downstream

The following services must be available in order to run:

* `asl-permissions` - permissions microservice
* `asl-workflow` - api providing workflow management on change requests
* `postgres` - to store licence data

## Development

### Database setup

Scripts for setting up a local database with dev data are available in the [`asl-schema` project](https://github.com/ukhomeoffice/asl-schema). First clone that repo and install the dependencies. Then run the following commands in the schema project directory:

To setup the inital table schemas:

```
npm run migrate
```

To seed the database with a development dataset:

```
npm run seed
```

_Note: these scripts will require the database described by `DATABASE_NAME` to be created before they can run. If running against services run with [`asl-conductor`](https://github.com/ukhomeoffice/asl-conductor) then this will be done automatically._

### Testing

Project contains a set of unit tests driven by `supertest` to make mock requests to the API. To run these:

```
npm test
```

#### Mocking test data

The tests are run against a real database instance seeded with data found in [./test/data/default.js](./test/data/default.js). This is regenerated before each test.

The configuration for the database used for the test runner can be set with the following environment variables (note that these are different from the variables used to configure a running instance to avoid conflicts with "real" data):

* `POSTGRES_DB` - default `asl-test`
* `POSTGRES_USER` - default `undefined`
* `POSTGRES_HOST` - default `localhost`
* `POSTGRES_PASSWORD` - default `undefined`

_Note: you may need to create the database `asl-test` locally before running tests for the first time. If running against services run with [`asl-conductor`](https://github.com/ukhomeoffice/asl-conductor) then this will be done automatically._

#### Mocking permissions

By default when running tests the user will have full permissions. To define a custom permissions function to use in a test, run the the following code before making an API call:

```js
this.api.setUser({ can: (task, params) => <Promise> });
```
