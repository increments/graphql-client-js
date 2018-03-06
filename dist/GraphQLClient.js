import { sendRequest, } from "./sendRequest";
import { uniqId } from "./uniqId";
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
//# sourceMappingURL=GraphQLClient.js.map