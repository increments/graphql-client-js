// Generate unique variable name
export const uniqId = (() => {
    let counter = 0;
    return (name) => `${name}${counter++}`;
})();
//# sourceMappingURL=uniqId.js.map