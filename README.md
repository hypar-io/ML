# Hypar ML utilities

Tools for training and deploying models on [Hypar](https://hypar.io).

**Glossary**
- Function - A Hypar function. Locally, this is a directory containing a `hypar.json` file and a function's code. On Hypar's web application, functions are added to workflows.
- Workflow - A set of functions that execute on Hypar's web application.
- Input file - A JSON file containing one or more sets of input arguments for a function.
- Input model - A JSON Hypar model, usually exported from Hypar, that contains input data required by a function being executed locally.

**Getting Started**
- Follow the [Things You Need](https://hypar-io.github.io/Elements/C-Sharp.html#things-youll-need) section in the Getting Started guide to install the prerequisites to build and run a Hypar function.
- Install the Hypar command line interface (CLI). In [Installing and Using the Command Line Interface](https://hypar-io.github.io/Elements/C-Sharp.html#installing-and-using-the-hypar-command-line-interface-cli) you may need to install an alpha release of the CLI as new features are added. To do so, you can do:
  ```bash
  dotnet tool install -g hypar.cli --version [VERSION]
  ```
  Where:
    - `[VERSION]` is the latest alpha version available [here](https://www.nuget.org/packages/Hypar.CLI/).
- Create a workflow using Hypar's web application that will generate an input model that provides the data required by your function. 
  - For example, if you are using Hypar's Facade function to generate a facade, you'll need a workflow that generates an envelope and some levels. You will not need to add the facade function to that workflow. The facade function will be run locally.
- Export the workflow from Hypar using `More -> Export -> glTF`.
- Follow the instructions in https://github.com/hypar-io/ML/tree/master/input_generation/ to generate an input file for the function and execute the function using the input file.
