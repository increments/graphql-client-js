import { uniqId } from "./uniqId";
const SELECTION_DELIMITER = /\s|\(|{/;
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
//# sourceMappingURL=sendRequest.js.map