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
import { ApplicationGeneratorSchema } from './schema';

interface NormalizedSchema extends ApplicationGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: ApplicationGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;

  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;

  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');

  const projectRoot = options.parent
    ? `${options.parent}/${projectDirectory}`
    : `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;

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

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

export default async function (tree: Tree, options: ApplicationGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
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
      build: {
        executor: '@nrwl/workspace:run-commands',
        options: {
          command: `go build -o ${offsetFromRoot(normalizedOptions.projectRoot)}/dist/${normalizedOptions.projectRoot} main.go`,
          cwd: normalizedOptions.projectRoot
        }
      },
      serve: {
        executor: '@nrwl/workspace:run-commands',
        options: {
          command: `go run main.go`,
          cwd: normalizedOptions.projectRoot
        }
      }
    },
    tags: normalizedOptions.parsedTags,
  });

  addFiles(tree, normalizedOptions);
  await formatFiles(tree);
}
