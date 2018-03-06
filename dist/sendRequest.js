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
const createResolveCallback = (params) => ({ data, errors, }) => {
    const payloads = {};
    const nameMap = {};
    if (data) {
        Object.keys(data).forEach(aliasName => {
            const param = params[aliasName];
            const originalName = param.query.split(SELECTION_DELIMITER, 1)[0];
            payloads[aliasName] = {
                data: {
                    [originalName]: data[aliasName],
                },
            };
            nameMap[aliasName] = originalName;
        });
    }
    if (errors) {
        errors.forEach(error => {
            if (error.fields && error.fields.length) {
                const field = error.fields[0];
                if (!nameMap[field]) {
                    return; // Unknown field
                }
                if (!payloads[field]) {
                    payloads[field] = {
                        errors: [],
                    };
                }
                if (!payloads[field].errors) {
                    payloads[field].errors = [];
                }
                ;
                payloads[field].errors.push({
                    message: error.message,
                    fields: [nameMap[field]].concat(error.fields.slice(1)),
                });
            }
        });
    }
    Object.keys(payloads).forEach(name => {
        if (params[name]) {
            params[name].resolve(payloads[name]);
        }
    });
};
const createRejectCallback = (params) => (...args) => {
    Object.keys(params).forEach(aliasName => {
        params[aliasName].reject(...args);
    });
};
export const sendRequest = (name, params, handler) => {
    const { query, variables } = buildQueryAndVariables(name, params);
    handler(query, variables, createResolveCallback(params), createRejectCallback(params));
};
//# sourceMappingURL=sendRequest.js.map