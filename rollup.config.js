import typescript from "rollup-plugin-typescript2"

export default {
  input: "./src/index.ts",
  output: {
    file: "./dist/index.es5.js",
    format: "iife",
    name: "GraphQLClient",
    sourcemap: true,
  },
  plugins: [
    typescript()
  ],
}
