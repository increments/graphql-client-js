import {
  Error,
  OperationName,
  RequestHandler,
  RequestParams,
  sendRequest,
  VariableDecls,
} from "./sendRequest"
import { uniqId } from "./uniqId"

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

  public query<T>(
    query: string,
    decls: VariableDecls = {},
  ): Promise<{ data?: T; errors?: Error[] }> {
    return this.buffer("query", query, decls)
  }

  public mutation<T>(
    query: string,
    decls: VariableDecls = {},
  ): Promise<{ data?: T; errors?: Error[] }> {
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
