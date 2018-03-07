import { parse } from "graphql/language/parser"
import { GraphQLClient } from "./index"

function shouldContainOnlyOneOperation(ast: any, name: string) {
  expect(ast.definitions.length).toBe(1)
  expect(ast.definitions[0].operation).toBe(name)
}

function shouldDeclareVariables(
  def: any,
  expected: { type: string; nonNull: boolean }[],
) {
  expect(def.variableDefinitions.length).toBe(1)
  expected.forEach((e, index) => {
    if (e.nonNull) {
      expect(def.variableDefinitions[index].type.kind).toBe("NonNullType")
    }
    expect(def.variableDefinitions[index].type.type.name.value).toBe(e.type)
  })
}

function shouldHaveSelectionNames(def: any, names: string[]) {
  expect(def.selectionSet.selections.length).toBe(2)
  names.forEach((name, index) => {
    expect(def.selectionSet.selections[index].name.value).toBe(name)
  })
}

function shouldHaveVariable(
  def: any,
  variables: any,
  index: number,
  value: any,
) {
  expect(variables[def.variableDefinitions[index].variable.name.value]).toBe(
    value,
  )
}

describe("GraphQLClient", () => {
  it("bundles sequence of method calls to a single request", done => {
    const handle = jest.fn()
    const client = new GraphQLClient({ wait: 0, handle })

    client.query("")
    client.query("")
    client.query("")

    setTimeout(() => {
      expect(handle.mock.calls.length).toBe(1)
      done()
    }, 10)
  })

  it("calls request with valid graphql query and variables", done => {
    const client = new GraphQLClient({
      wait: 0,
      handle: (query, variables, resolve) => {
        const ast = parse(query)

        shouldContainOnlyOneOperation(ast, "query")
        shouldDeclareVariables(ast.definitions[0], [
          { type: "String", nonNull: true },
        ])
        shouldHaveVariable(ast.definitions[0], variables, 0, "foo")

        shouldHaveSelectionNames(ast.definitions[0], ["user", "viewer"])
        const userAlias =
          ast.definitions[0].selectionSet.selections[0].alias.value
        const viewerAlias =
          ast.definitions[0].selectionSet.selections[1].alias.value

        resolve({
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
    client.query("viewer { name }").then(spy2)

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

  it("resolves all promises by calling resolve callback", done => {
    const client = new GraphQLClient({
      wait: 0,
      handle(query, variables, resolve) {
        resolve({})
      },
    })

    const spy1 = jest.fn()
    client.query("", {}).then(spy1)
    const spy2 = jest.fn()
    client.query("", {}).then(spy2)

    setTimeout(() => {
      expect(spy1.mock.calls.length).toBe(1)
      expect(spy1.mock.calls[0][0]).toEqual({})
      expect(spy2.mock.calls.length).toBe(1)
      expect(spy2.mock.calls[0][0]).toEqual({})
      done()
    }, 10)
  })

  it("rejects all promise by calling reject callback", done => {
    const client = new GraphQLClient({
      wait: 0,
      handle: (query, variables, resolve, reject) => {
        reject("hello")
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
    const handle = jest.fn()
    const client = new GraphQLClient({ wait: 0, handle })

    client.query("")
    client.mutation("")

    setTimeout(() => {
      expect(handle.mock.calls.length).toBe(2)
      done()
    }, 10)
  })
})
