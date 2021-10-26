# Image generation

Renders a directory of .glb files into .png files using [Hypar's](https://hypar.io) renderer.

This spins up a local static file server on port 8000 to expose the .glb files to the rendering sandbox. It then renders each .glb through the Hypar renderer in a headless Chromium context and saves a screenshot locally.

## Setup

Requirements:
* [NodeJS](https://nodejs.org/)
* Python 2

Run `npm install` inside this directory to fetch all remaining dependencies.

## Usage

Run the following command:
```
npm run ts-node -- generateImages.ts [INPUT_DIRECTORY] [OUTPUT_DIRECTORY]
```

Where:
* `[INPUT_DIRECTORY]` is the path to a directory containing .glb files
* `[OUTPUT_DIRECTORY]` is the path where output .png files will be written.

### Camera angle

A camera angle can be passed as a last argument, as a right-handed vector. This creates top-down screenshots:

```
npm run ts-node -- generateImages.ts [INPUT_DIRECTORY] [OUTPUT_DIRECTORY] --angle "0, 0, -1.0"
```

### Background GLBs

Additional GLBs can be included in each screenshot. This is useful if your input-directory contain many options for one system that all apply on top of another system, e.g. different facades for the same building. Use the `--background-glbs` option to specify which files in input-directory should be treated as backgrounds for all other GLBs.

```
npm run ts-node -- generateImages.ts [INPUT_DIRECTORY] [OUTPUT_DIRECTORY] --background-glbs structure.glb envelope.glb
```