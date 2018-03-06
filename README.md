# @increments/graphql-client

[![Build Status](https://travis-ci.org/increments/graphql-client-js.svg?branch=master)](https://travis-ci.org/increments/graphql-client-js)

A lightweight GraphQL client which bundles sequence of queries into a single HTTP request. Zero dependency.

## Installation

```
yarn add @increments/graphql-client
```

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
   * @param {Function} success - Callback for successful response.
   * @param {Function} error - Callback for failure response.
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
