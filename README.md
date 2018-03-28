# @increments/graphql-client

[![NPM version](http://img.shields.io/npm/v/@increments/graphql-client.svg)](https://www.npmjs.com/package/@increments/graphql-client)
[![Build Status](https://travis-ci.org/increments/graphql-client-js.svg?branch=master)](https://travis-ci.org/increments/graphql-client-js)
[![Maintainability](https://api.codeclimate.com/v1/badges/456eb6c2b8dc26ff88bb/maintainability)](https://codeclimate.com/github/increments/graphql-client-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/456eb6c2b8dc26ff88bb/test_coverage)](https://codeclimate.com/github/increments/graphql-client-js/test_coverage)
[![Stable Release Size](http://img.badgesize.io/https://unpkg.com/@increments/graphql-client/dist/graphql-client.es5.min.js?compression=gzip)](https://github.com/ngryman/badge-size)

A lightweight GraphQL client which bundles sequence of queries into a single HTTP request. Zero dependency.

## Installation

If your project is using npm, you can install [@increments/graphql-client](https://www.npmjs.com/package/@increments/graphql-client) package by npm command:

```bash
npm install --save @increments/graphql-client
# or
yarn add @increments/graphql-client
```

### Distribution files

- **dist/index.js** -  The CommonJS version of this package. (default)
- **dist/index.es.js** -  The native modules version of this package.
- **dist/graphql-client.es5.js** - ES5 / UMD version of this package. This version exports itself to `window.GraphQLClient`.

## Size

Package | min.js.gz size
--------|----------------
@increments/graphql-client | 800 B
[apollo-client](https://github.com/apollographql/apollo-client) (apollo-client-preset + graphql-tag + graphql) | 29 KB

## Synopsis

```js
import { GraphQLClient } from "@increments/graphql-client"

const client = new GraphQLClient({
  /** How long the client wait before invoking batch request in msec. */
  wait: 50, // defualt value

  /**
   * Batch request handler.
   *
   * @param {string} query - Bundled GraphQL query string.
   * @param {Object} variables - Bundled variables.
   * @param {Function} resolve - Callback for successful response.
   * @param {Function} reject - Callback for failure response.
   */
  handle(query, variables, resolve, reject) {
    // Send a HTTP request to your GraphQL server in your favorite way.

    // Sample:
    axios.post("/graphql", { query, variables })
      .then(response => resolve(response.data)
      .catch(reject)
  }
})

// The handle function will be executed once, even though client.query is called twice.
Promise.all([
  client.query("viewer { name }"),
  client.query(`
    repository(owner: $owner, name: $name) {
      url
    }`,
    {
      owner: {
        type: "String!",
        value: "increments",
      },
      name: {
        type: "String!",
        value: "graphql-client",
      },
    }
  ),
]).then((
  viewer,
  repository,
) => {
  console.log(viewer.data.viewer.name)
  console.log(repository.data.repository.url)
})
```
