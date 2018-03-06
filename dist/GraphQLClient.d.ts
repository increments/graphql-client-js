import { Error, Handler, VariableDecls } from "./sendRequest";
export declare class GraphQLClient {
    private wait;
    private handle;
    private buffers;
    private timerIds;
    constructor(options: {
        wait?: number;
        handle: Handler;
    });
    query<T>(query: string, decls?: VariableDecls): Promise<{
        data?: T;
        errors?: Error[];
    }>;
    mutation<T>(query: string, decls?: VariableDecls): Promise<{
        data?: T;
        errors?: Error[];
    }>;
    private buffer<T>(name, query, decls);
    private flush(name);
}
