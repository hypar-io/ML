# Input generation

Samples the input domain of a [Hypar](https://hypar.io) function. Produces a batch input spec that can be passed to the Hypar CLI, in order to run the function and capture the generated geometry for each sampled input condition.

## Setup

Requirements:
* [NodeJS](https://nodejs.org/)
* [Hypar CLI](https://www.nuget.org/packages/Hypar.CLI/)

Run `npm install` inside this directory to fetch all remaining dependencies.

## Generating a batch input spec

Run the following command to sample a function's input domain:
```
npm run ts-node generateBatchInput.ts [HYPAR_JSON] [OUTPUT_JSON] [INPUT_MODEL]
```

Where:
* `[HYPAR_JSON]` is the path to a `hypar.json` Hypar function spec, which is found within the top level of a function's source code directory.
* `[OUTPUT_JSON]` is the path to the batch input spec file that will be created. The filename must end in `.json`.
* `[INPUT_MODEL]` is the path to the input model containing the function's model dependencies.

## Running a function across a batch input spec

After you have created a Hypar batch input spec, you can run your function across it and capture the resulting .glb glTF 3d models.

`cd` into your function's directory and run:
```
hypar run --batch-input-file=[INPUT_JSON] --batch-gltf-output-dir=[OUTPUT_DIR]
```

Where:
* `[INPUT_JSON]` is the batch input spec produced by generateBatchInput.ts (called `[OUTPUT_JSON]` there)
* `[OUTPUT_DIR]` is the directory that will contain all generated models.

If you need .png files rather than 3d models, see the "image_generation" tool in a sibling directory.
