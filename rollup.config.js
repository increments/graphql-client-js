import typescript from "rollup-plugin-typescript2"
import uglify from "rollup-plugin-uglify"

export default [
  {
    input: "./src/index.ts",
    output: {
      file: "./lib/index.js",
      format: "cjs",
      sourcemap: true
    },
    plugins: [typescript()]
  },
  {
    input: "./src/index.ts",
    output: {
      file: "./dist/graphql-client.js",
      format: "iife",
      name: "GraphQLClient",
      sourcemap: false
    },
    plugins: [
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            declaration: true
          }
        }
      })
    ]
  },
  {
    input: "./src/index.ts",
    output: {
      file: "./dist/graphql-client.min.js",
      format: "iife",
      name: "GraphQLClient",
      sourcemap: false
    },
    plugins: [
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            declaration: true
          }
        }
      }),
      uglify()
    ]
  }
]
