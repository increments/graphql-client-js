import { GraphQLError } from "graphql"

import { Handler, OperationName, RequestParams, sendRequest, VariableDecls } from "./sendRequest"
import { uniqId } from "./uniqId"

export class GraphQLClient {
  private wait: number
  private handle: Handler
  private buffers: { [operation in OperationName]: RequestParams } = {
    query: {},
    mutation: {}
  }
  private timerIds: { [operation in OperationName]: number | null } = {
    query: null,
    mutation: null
  }

  constructor(options: { wait?: number; handle: Handler }) {
    this.wait = options.wait == null ? 50 : options.wait
    this.handle = options.handle
  }

  public query<T>(query: string, decls: VariableDecls = {}): Promise<{ data?: T; errors?: GraphQLError[] }> {
    return this.buffer("query", query.trim(), decls)
  }

  public mutation<T>(query: string, decls: VariableDecls = {}): Promise<{ data?: T; errors?: GraphQLError[] }> {
    return this.buffer("mutation", query.trim(), decls)
  }

  private buffer<T>(name: OperationName, query: string, decls: VariableDecls): Promise<T> {
    return new Promise((resolve, reject) => {
      this.buffers[name][uniqId("alias")] = {
        query,
        decls,
        resolve,
        reject
      }
      if (!this.timerIds[name]) {
        this.timerIds[name] = setTimeout(() => {
          this.flush(name)
        }, this.wait)
      }
    })
  }

  private flush(name: OperationName): void {
    sendRequest(name, this.buffers[name], this.handle)
    this.buffers[name] = {}
    this.timerIds[name] = null
  }
}
