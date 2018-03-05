export declare type RequestHandler = (query: string, variables: Variables, success: SuccessCallback, errors: ErrorsCallback) => void;
export declare type SuccessCallback = (resp: {
    data?: any;
    errors?: any;
}) => void;
export declare type ErrorsCallback = (message?: string) => void;
export declare type OperationName = "query" | "mutation";
export interface VariableDecls {
    [name: string]: {
        type: string;
        value: any;
    };
}
export interface Variables {
    [name: string]: any;
}
export interface RequestParams {
    [alias: string]: {
        query: string;
        decls: VariableDecls;
        resolve: (value?: any | PromiseLike<any> | undefined) => void;
        reject: (reason?: any) => void;
    };
}
export declare const sendRequest: (name: OperationName, params: RequestParams, handler: RequestHandler) => void;
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
