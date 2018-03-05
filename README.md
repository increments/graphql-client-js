# @increments/graphql-client

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
  request(query, variables, success, error) {
    // Send a HTTP request to your GraphQL server in your favorite way.
  }
})

// The request function will be executed once, even though client.query is called twice.
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
  { data },
  { data }
) => {
  console.log(data.viewer.name)
  console.log(data.repository.url)
})
```
