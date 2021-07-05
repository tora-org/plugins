import json from '@rollup/plugin-json'
import fs from 'fs'
import dts, { Options } from 'rollup-plugin-dts'
import typescript from 'rollup-plugin-typescript2'
import builtinModules from 'builtin-modules'

const typesDir = './types'

const tsconfigOverride: Options = {
    compilerOptions: {
        module: 'ESNext' as any,
    }
}

function readTextFileSync(path: string) {
    return fs.readFileSync(path, 'utf-8')
}

export function read_json_file_sync(path: string) {
    if (fs.existsSync(path)) {
        const json_file = (readTextFileSync(path) || '').trim()
        if (json_file) {
            return JSON.parse(json_file)
        }
    }
    return undefined
}

export function render_js(external: string[], input: string, out_cjs: string, out_es: string) {
    return {
        input,
        external,
        plugins: [
            json(),
            typescript({
                tsconfigOverride: tsconfigOverride,
            })
        ],
        output: [
            { file: out_cjs, format: 'cjs' },
            { file: out_es, format: 'es' }
        ]
    }
}

export function render_dts(external: string[], input: string, output: string) {

    const dtsInTypes = fs.existsSync(typesDir) ?
        fs.readdirSync(typesDir).filter(name => name.endsWith('.d.ts'))
            .map(name => `// merge from ${typesDir}/${name}\n${fs.readFileSync(`${typesDir}/${name}`, 'utf8').trim()}`)
            .join('\n\n') + '\n\n// generate by rollup-plugin-dts\n'
        : ''

    return {
        input,
        external,
        plugins: [
            {
                name: 'merge .d.ts files', renderChunk(code: any) {
                    return dtsInTypes + code
                }
            },
            dts({ compilerOptions: tsconfigOverride.compilerOptions })
        ],
        output: [
            { file: output, format: 'es' }
        ]
    }
}

export interface PackageJson {
    dependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    main: string
    module: string
    types: string
}

export function gen_external(pkg: PackageJson, external: string[]) {
    return [
        ...builtinModules,
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...(external),
    ]
}

export function create_rollup_config(pkg: PackageJson, external: string[]) {

    if (!Array.isArray(external)) {
        throw new Error(`rollup.external_modules is NOT Array`)
    }

    const external_list = gen_external(pkg, external)

    return [
        render_js(external_list, './src/index.ts', pkg.main, pkg.module),
        render_dts(external_list, './src/index.ts', pkg.types),
    ]
}
