const SELECTION_DELIMITER = /\s|\(|{/;
// Generate unique variable name
const uniqId = (() => {
    let counter = 0;
    return (name) => `${name || "id"}${counter++}`;
})();
const buildQueryAndVariables = (name, params) => {
    const queries = [];
    const variableDefinitions = [];
    const variables = {};
    Object.keys(params).forEach(aliasName => {
        const param = params[aliasName];
        let query = param.query;
        Object.keys(param.decls)
            .sort((a, b) => b.length - a.length) // Sort by length in descending order
            .forEach(varName => {
            const uniqName = uniqId(varName);
            query = query.replace(`$${varName}`, `$${uniqName}`);
            variableDefinitions.push(`$${uniqName}: ${param.decls[varName].type}`);
            variables[uniqName] = param.decls[varName].value;
        });
        queries.push(`${aliasName}:${query}`);
    });
    const defs = variableDefinitions.length
        ? `(${variableDefinitions.join(",")})`
        : "";
    const query = `${name}${defs}{\n${queries.join("\n")}\n}`;
    return { query, variables };
};
const createSuccessCallback = (params) => ({ data, errors, }) => {
    if (data) {
        Object.keys(data).forEach(aliasName => {
            const param = params[aliasName];
            const originalName = param.query.split(SELECTION_DELIMITER, 1)[0];
            param.resolve({ [originalName]: data[aliasName] });
        });
    }
    if (errors) {
        // TODO: Implement
    }
};
const createErrorsCallback = (params) => (message) => {
    Object.keys(params).forEach(aliasName => {
        params[aliasName].reject(message ? [message] : []);
    });
};
export const sendRequest = (name, params, handler) => {
    const { query, variables } = buildQueryAndVariables(name, params);
    handler(query, variables, createSuccessCallback(params), createErrorsCallback(params));
};
export class GraphQLClient {
    constructor(options) {
        this.buffers = {
            query: {},
            mutation: {},
        };
        this.timerIds = {
            query: null,
            mutation: null,
        };
        this.wait = options.wait == null ? 50 : options.wait;
        this.request = options.request;
    }
    query(query, decls) {
        return this.buffer("query", query, decls);
    }
    mutation(query, decls) {
        return this.buffer("mutation", query, decls);
    }
    buffer(name, query, decls) {
        return new Promise((resolve, reject) => {
            this.buffers[name][uniqId("alias")] = {
                query,
                decls,
                resolve,
                reject,
            };
            if (!this.timerIds[name]) {
                this.timerIds[name] = setTimeout(() => {
                    this.flush(name);
                }, this.wait);
            }
        });
    }
    flush(name) {
        sendRequest(name, this.buffers[name], this.request);
        this.buffers[name] = {};
        this.timerIds[name] = null;
    }
}
//# sourceMappingURL=index.js.map