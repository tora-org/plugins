import builtinModules from "builtin-modules"
import dts from "rollup-plugin-dts"
import json from "@rollup/plugin-json"
import pkg from './package.json'
import typescript from 'rollup-plugin-typescript2'
import ts from 'typescript'

const external = [
    ...builtinModules,
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
]

export default [
    {
        input: './src/index.ts',
        external,
        plugins: [
            json(),
            typescript({ tsconfigOverride: { compilerOptions: { module: "esnext" } } })
        ],
        output: [
            { file: pkg.main, format: 'cjs' },
            { file: pkg.module, format: 'es' }
        ]
    },
    {
        input: './src/index.ts',
        external,
        plugins: [
            dts({ compilerOptions: { module: ts.ModuleKind.ESNext } })
        ],
        output: [
            { file: pkg.types, format: "es" }
        ]
    }
]

