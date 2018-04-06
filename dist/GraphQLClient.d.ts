import { GraphQLError } from "graphql";
import { Handler, VariableDecls } from "./sendRequest";
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
        errors?: GraphQLError[];
    }>;
    mutation<T>(query: string, decls?: VariableDecls): Promise<{
        data?: T;
        errors?: GraphQLError[];
    }>;
    private buffer<T>(name, query, decls);
    private flush(name);
}
