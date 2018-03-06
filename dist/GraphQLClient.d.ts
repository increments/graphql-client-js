import { RequestHandler, VariableDecls } from "./sendRequest";
export declare class GraphQLClient {
    private wait;
    private request;
    private buffers;
    private timerIds;
    constructor(options: {
        wait?: number;
        request: RequestHandler;
    });
    query<T>(query: string, decls: VariableDecls): Promise<T>;
    mutation<T>(query: string, decls: VariableDecls): Promise<T>;
    private buffer<T>(name, query, decls);
    private flush(name);
}
