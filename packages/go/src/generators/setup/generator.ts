import { formatFiles, readWorkspaceConfiguration, Tree, updateWorkspaceConfiguration } from '@nrwl/devkit'
import { SetupGeneratorSchema } from './schema';

export default async function (tree: Tree, options: SetupGeneratorSchema) {
    const workspaceConfig = readWorkspaceConfiguration(tree)
    if (workspaceConfig.plugins?.includes('@nx-kz/go')) {
        return
    }

    if (workspaceConfig.plugins) {
        workspaceConfig.plugins.push('@nx-kz/go')
    } else {
        workspaceConfig.plugins = ['@nx-kz/go']
    }

    if (!workspaceConfig.pluginsConfig) {
        workspaceConfig.pluginsConfig = {}
    }
    workspaceConfig.pluginsConfig['@nx-kz/go'] = {
        'goModPath': options.goModPath
    }


    updateWorkspaceConfiguration(tree, workspaceConfig)
    await formatFiles(tree)
}