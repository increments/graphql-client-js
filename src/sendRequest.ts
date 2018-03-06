import { uniqId } from "./uniqId"

export type RequestHandler = (
  query: string,
  variables: Variables,
  success: SuccessCallback,
  errors: ErrorsCallback,
) => void
export interface Error {
  message: string
  fields?: string[]
}
export type SuccessCallback = (resp: { data?: any; errors?: Error[] }) => void
export type ErrorsCallback = (message: string) => void
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

const createSuccessCallback = (params: RequestParams): SuccessCallback => ({
  data,
  errors,
}) => {
  const payloads: { [name: string]: { data?: any; errors?: Error[] } } = {}
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
      if (error.fields && error.fields.length) {
        const field = error.fields[0]
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
        ;(payloads[field].errors as Error[]).push({
          message: error.message,
          fields: [nameMap[field]].concat(error.fields.slice(1)),
        })
      }
    })
  }
  Object.keys(payloads).forEach(name => {
    if (params[name]) {
      params[name].resolve(payloads[name])
    }
  })
}

const createErrorsCallback = (params: RequestParams): ErrorsCallback => (
  ...args: any[]
) => {
  Object.keys(params).forEach(aliasName => {
    params[aliasName].reject(...args)
  })
}

export const sendRequest = (
  name: OperationName,
  params: RequestParams,
  handler: RequestHandler,
): void => {
  const { query, variables } = buildQueryAndVariables(name, params)
  handler(
    query,
    variables,
    createSuccessCallback(params),
    createErrorsCallback(params),
  )
}
