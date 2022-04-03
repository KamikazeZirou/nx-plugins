/*
Copyright (c) 2022 KamikazeZirou

Released under the MIT license.
https://github.com/KamikazeZirou/nx-plugins/blob/main/LICENSE

I have modified the file at the following URL so that I can specify the prefix of the go module path from workspace.json or nx.json.
https://github.com/nx-go/nx-go/blob/cf139e99bf840d3aaa76ad2cc3b5e73b23c5cb34/packages/nx-go/src/go-package-graph/index.ts


Copyright (c) 2020-2021 Bram Borggreve

Released under the MIT license.
https://github.com/nx-go/nx-go/blob/cf139e99bf840d3aaa76ad2cc3b5e73b23c5cb34/LICENSE
*/
import {
    ProjectGraph,
    ProjectGraphBuilder,
    ProjectGraphProcessorContext,
    DependencyType,
} from '@nrwl/devkit'
import { basename, dirname, extname, join } from 'path'
import { execSync } from 'child_process'
import { existsSync } from 'fs'

export function processProjectGraph(
    graph: ProjectGraph,
    context: ProjectGraphProcessorContext
): ProjectGraph {
    const workspaceRootPath = findNxWorkspaceRootPath()

    const projectRootLookupMap: Map<string, string> = new Map()
    for (const projectName in graph.nodes) {
        projectRootLookupMap.set(graph.nodes[projectName].data.root, projectName)
    }

    const builder = new ProjectGraphBuilder(graph)

    // Define dependencies using the context of files that were changed to minimize work
    // between each run.
    for (const projectName in context.filesToProcess) {
        context.filesToProcess[projectName]
            .filter((f) => extname(f.file) === '.go')
            .map(({ file }) => ({
                projectName,
                file,
                dependencies: getGoDependencies(context, workspaceRootPath, projectRootLookupMap, file),
            }))
            .filter((data) => data.dependencies && data.dependencies.length > 0)
            .forEach(({ projectName, file, dependencies }) => {
                for (const dependency of dependencies) {
                    builder.addExplicitDependency(projectName, file, dependency)
                }
            })
    }

    // We will see how this is used below.
    return builder.getUpdatedProjectGraph();
}

/**
 * getGoDependencies will use `go list` to get dependency information from a go file
 * @param projectRootLookup
 * @param file
 * @returns
 */
const getGoDependencies = (
    context: ProjectGraphProcessorContext,
    workspaceRootPath: string,
    projectRootLookup: Map<string, string>,
    file: string) => {

    const goModPath = context.workspace.pluginsConfig?.['@nx-kz/nx-go']?.['goModPath'] ?? ""

    try {
        const goPackageDataJson = execSync('go list -json ./' + file, { encoding: 'utf-8', cwd: workspaceRootPath })
        const goPackage: GoPackage = JSON.parse(goPackageDataJson)
        const isTestFile = basename(file, '.go').endsWith('_test')

        // Use the correct imports list depending if the file is a test file.
        const listOfImports = (!isTestFile ? goPackage.Imports : goPackage.TestImports) ?? []

        return listOfImports
            .filter((d) => d.startsWith(goModPath))
            .map((d) => d.substring(goModPath.length + 1))
            .map((rootDir) => projectRootLookup.get(rootDir))
            .filter((projectName) => projectName)
    } catch (ex) {
        console.error(`Error processing ${file}`)
        console.error(ex)
        return [] // Return an empty array so that we can process other files
    }
}

/**
 * GoPackage shape needed by the code
 */
interface GoPackage {
    Deps?: string[]
    Module: {
        Path: string
    }
    Imports?: string[]
    TestImports?: string[]
}

/**
 * Finds the absolute path for the root path of the workspace.
 *
 * This is useful when modules are executed from Nx processes in the node_modules
 * folder like when running as a graph plugin
 */
const findNxWorkspaceRootPath = () => {
    let workingDirectory = process.cwd()
    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (existsSync(join(workingDirectory, 'nx.json'))) {
            return workingDirectory
        } else if (workingDirectory === dirname(workingDirectory)) {
            throw new Error('At the root of the filesystem')
        }
        workingDirectory = dirname(workingDirectory)
    }
}
