# nx-go

Nx plugin to use Go in a Nx workspace.

## Features

- Generation of go applications/modules
- Building, packaging, testing, etc your go projects
- Integration with Nx's dependency graph (through nx dep-graph or nx affected:dep-graph): this allows you to visualize the dependencies of any go projects inside your workspace, just like Nx natively does it for JS/TS-based projects!

## Getting started

First, make sure you have a Nx Workspace.

Next, install the nx-go plugin:

```bash
## using npm
npm install -D @nx-kz/nx-go
## Or using yarn
# yarn add -D @nx-kz/nx-go
## Or using pnpm
# pnpm add -D @nx-kz/nx-go
```

Generate a go project:

```bash
# generating application
nx g @nx-kz/nx-go:app your-app-name
## Or generating library
# nx g @nx-kz/nx-go:lib your-lib-name
```

## Usage

### Linting the go project

```bash
nx lint your-project-name
```

By default, lint the go-project using the `go vet` command.

### Testing the go project

```bash
nx test your-project-name
```

### Building the application

```bash
nx build your-app-name
```

By default, this command builds the application using the `go build` command, and stores the output in the dist/apps/your-app-name.


### Serving the application

```bash
nx serve your-app-name
```

Serves the application using the `go run` command.

### Using dependency graph

Setup with the following command:

```bash
nx g @nx-kz/nx-go:setup
```

Then run the following command:

```bash
nx graph
```
