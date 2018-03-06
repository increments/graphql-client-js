import { parse } from "graphql/language/parser"
import { GraphQLClient } from "./GraphQLClient"

describe("GraphQLClient", () => {
  it("bundles sequence of method calls to a single request", done => {
    const request = jest.fn()
    const client = new GraphQLClient({ wait: 0, request })

    client.query("", {})
    client.query("", {})
    client.query("", {})

    setTimeout(() => {
      expect(request.mock.calls.length).toBe(1)
      done()
    }, 10)
  })

  it("calls request with valid graphql query and variables", done => {
    const client = new GraphQLClient({
      wait: 0,
      request: (query, variables, success) => {
        const ast = parse(query)

        // Query should contain only one operation.
        expect(ast.definitions.length).toBe(1)
        const def = ast.definitions[0]
        expect(def.operation).toBe("query")

        // There is `$name: String!` only.
        expect(def.variableDefinitions.length).toBe(1)
        const varDef = def.variableDefinitions[0]
        expect(varDef.type.kind).toBe("NonNullType")
        expect(varDef.type.type.name.value).toBe("String")

        const varName = varDef.variable.name.value
        // { name: "foo" } was transformed as { [varName]: "foo" } in the query
        expect(variables[varName]).toBe("foo")

        // There are two selections: user and viewer
        expect(def.selectionSet.selections.length).toBe(2)

        const userSelection = def.selectionSet.selections[0]
        expect(userSelection.name.value).toBe("user")
        const userAlias = userSelection.alias.value

        const viewerSelection = def.selectionSet.selections[1]
        expect(viewerSelection.name.value).toBe("viewer")
        const viewerAlias = viewerSelection.alias.value

        success({
          data: {
            [userAlias]: {
              id: "bar",
            },
            [viewerAlias]: null,
          },
          errors: [
            {
              message: "baz",
              fields: [viewerAlias, "name"],
            },
          ],
        })
      },
    })

    const spy1 = jest.fn()
    client
      .query("user(name: $name) { id }", {
        name: {
          type: "String!",
          value: "foo",
        },
      })
      .then(spy1)
    const spy2 = jest.fn()
    // TODO: Make variables argument optional
    client.query("viewer { name }", {}).then(spy2)

    setTimeout(() => {
      expect(spy1.mock.calls.length).toBe(1)
      expect(spy1.mock.calls[0][0]).toEqual({
        data: {
          user: {
            id: "bar",
          },
        },
      })
      expect(spy2.mock.calls.length).toBe(1)
      expect(spy2.mock.calls[0][0]).toEqual({
        data: {
          viewer: null,
        },
        errors: [
          {
            message: "baz",
            fields: ["viewer", "name"],
          },
        ],
      })
      done()
    }, 10)
  })

  it("rejects all promise by calling errors callback", done => {
    const client = new GraphQLClient({
      wait: 0,
      request: (query, variables, success, errors) => {
        errors("hello")
      },
    })

    const spy1 = jest.fn()
    client.query("", {}).catch(spy1)
    const spy2 = jest.fn()
    client.query("", {}).catch(spy2)

    setTimeout(() => {
      expect(spy1.mock.calls.length).toBe(1)
      expect(spy1.mock.calls[0][0]).toEqual("hello")
      expect(spy2.mock.calls.length).toBe(1)
      expect(spy2.mock.calls[0][0]).toEqual("hello")
      done()
    }, 10)
  })

  it("treats #query and #mutation separatly", done => {
    const request = jest.fn()
    const client = new GraphQLClient({ wait: 0, request })

    client.query("", {})
    client.mutation("", {})

    setTimeout(() => {
      expect(request.mock.calls.length).toBe(2)
      done()
    }, 10)
  })
})
