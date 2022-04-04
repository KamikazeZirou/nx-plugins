import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import * as path from 'path';
import { LibraryGeneratorSchema } from './schema';

interface NormalizedSchema extends LibraryGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: LibraryGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;

  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;

  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');

  const projectRoot = options.parent
    ? `${options.parent}/${projectDirectory}`
    : `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

export default async function (tree: Tree, options: LibraryGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'library',
    sourceRoot: normalizedOptions.projectRoot,
    targets: {
      lint: {
        executor: '@nrwl/workspace:run-commands',
        options: {
          command: `go vet ./...`,
          cwd: normalizedOptions.projectRoot
        }
      },
      test: {
        executor: '@nrwl/workspace:run-commands',
        options: {
          command: `go test -p 1 ./...`,
          cwd: normalizedOptions.projectRoot
        }
      },
    },
    tags: normalizedOptions.parsedTags,
  });

  await formatFiles(tree);
}
