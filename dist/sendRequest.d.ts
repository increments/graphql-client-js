import { GraphQLError } from "graphql";
export declare type Handler = (query: string, variables: Variables, resolve: ResolveCallback, reject: RejectCallback) => void;
export declare type ResolveCallback = (resp: {
    data?: any;
    errors?: GraphQLError[];
}) => void;
export declare type RejectCallback = (message: string) => void;
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
export declare const sendRequest: (name: OperationName, params: RequestParams, handler: Handler) => void;
