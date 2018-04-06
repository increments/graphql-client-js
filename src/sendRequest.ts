import { GraphQLError } from "graphql"

import { uniqId } from "./uniqId"

export type Handler = (
  query: string,
  variables: Variables,
  resolve: ResolveCallback,
  reject: RejectCallback,
) => void

export type ResolveCallback = (
  resp: { data?: any; errors?: GraphQLError[] },
) => void

export type RejectCallback = (message: string) => void

export type OperationName = "query" | "mutation"

export interface VariableDecls {
  [name: string]: {
    type: string
    value: any
  }
}

export interface Variables {
  [name: string]: any
}

export interface RequestParams {
  [alias: string]: {
    query: string
    decls: VariableDecls
    resolve: (value?: any | PromiseLike<any> | undefined) => void
    reject: (reason?: any) => void
  }
}

const SELECTION_DELIMITER = /\s|\(|{/

const buildQueryAndVariables = (
  name: OperationName,
  params: RequestParams,
): { query: string; variables: Variables } => {
  const queries: string[] = []
  const variableDefinitions: string[] = []
  const variables: Variables = {}

  Object.keys(params).forEach(aliasName => {
    const param = params[aliasName]
    let query = param.query
    Object.keys(param.decls)
      .sort((a, b) => b.length - a.length) // Sort by length in descending order
      .forEach(varName => {
        const uniqName = uniqId(varName)
        query = query.replace(`$${varName}`, `$${uniqName}`)
        variableDefinitions.push(`$${uniqName}: ${param.decls[varName].type}`)
        variables[uniqName] = param.decls[varName].value
      })
    queries.push(`${aliasName}:${query}`)
  })

  const defs = variableDefinitions.length
    ? `(${variableDefinitions.join(",")})`
    : ""
  const query = `${name}${defs}{\n${queries.join("\n")}\n}`
  return { query, variables }
}

const createResolveCallback = (params: RequestParams): ResolveCallback => ({
  data,
  errors,
}) => {
  const payloads: {
    [name: string]: { data?: any; errors?: GraphQLError[] }
  } = {}
  const nameMap: { [aliasName: string]: string } = {}

  if (data) {
    Object.keys(data).forEach(aliasName => {
      const param = params[aliasName]
      const originalName = param.query.split(SELECTION_DELIMITER, 1)[0]
      payloads[aliasName] = {
        data: {
          [originalName]: data[aliasName],
        },
      }
      nameMap[aliasName] = originalName
    })
  }
  if (errors) {
    errors.forEach(error => {
      if (error.path && error.path.length) {
        const field = error.path[0]
        if (!nameMap[field]) {
          return // Unknown field
        }
        if (!payloads[field]) {
          payloads[field] = {
            errors: [],
          }
        }
        if (!payloads[field].errors) {
          payloads[field].errors = []
        }
        payloads[field].errors!.push({
          ...error,
          path: [nameMap[field]].concat(error.path.slice(1) as any),
        })
      }
    })
  }
  Object.keys(payloads).forEach(name => {
    if (params[name]) {
      params[name].resolve(payloads[name])
    }
  })
  // Resolve all unresolved promises
  Object.keys(params).forEach(name => {
    params[name].resolve({})
  })
}

const createRejectCallback = (params: RequestParams): RejectCallback => (
  ...args: any[]
) => {
  Object.keys(params).forEach(aliasName => {
    params[aliasName].reject(...args)
  })
}

export const sendRequest = (
  name: OperationName,
  params: RequestParams,
  handler: Handler,
): void => {
  const { query, variables } = buildQueryAndVariables(name, params)
  handler(
    query,
    variables,
    createResolveCallback(params),
    createRejectCallback(params),
  )
}
