export type RequestHandler = (
  query: string,
  variables: Variables,
  success: SuccessCallback,
  errors: ErrorsCallback,
) => void

export type SuccessCallback = (resp: { data?: any; errors?: any }) => void
export type ErrorsCallback = (message?: string) => void
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

// Generate unique variable name
const uniqId = (() => {
  let counter = 0
  return (name?: string): string => `${name || "id"}${counter++}`
})()

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
  if (data) {
    Object.keys(data).forEach(aliasName => {
      const param = params[aliasName]
      const originalName = param.query.split(SELECTION_DELIMITER, 1)[0]
      param.resolve({ [originalName]: data[aliasName] })
    })
  }
  if (errors) {
    // TODO: Implement
  }
}

const createErrorsCallback = (params: RequestParams): ErrorsCallback => (
  message?: string,
) => {
  Object.keys(params).forEach(aliasName => {
    params[aliasName].reject(message ? [message] : [])
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

export class GraphQLClient {
  private wait: number
  private request: RequestHandler
  private buffers: { [operation in OperationName]: RequestParams } = {
    query: {},
    mutation: {},
  }
  private timerIds: { [operation in OperationName]: number | null } = {
    query: null,
    mutation: null,
  }

  constructor(options: { wait?: number; request: RequestHandler }) {
    this.wait = options.wait == null ? 50 : options.wait
    this.request = options.request
  }

  public query<T>(query: string, decls: VariableDecls): Promise<T> {
    return this.buffer("query", query, decls)
  }

  public mutation<T>(query: string, decls: VariableDecls): Promise<T> {
    return this.buffer("mutation", query, decls)
  }

  private buffer<T>(
    name: OperationName,
    query: string,
    decls: VariableDecls,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.buffers[name][uniqId("alias")] = {
        query,
        decls,
        resolve,
        reject,
      }
      if (!this.timerIds[name]) {
        this.timerIds[name] = setTimeout(() => {
          this.flush(name)
        }, this.wait)
      }
    })
  }

  private flush(name: OperationName): void {
    sendRequest(name, this.buffers[name], this.request)
    this.buffers[name] = {}
    this.timerIds[name] = null
  }
}
