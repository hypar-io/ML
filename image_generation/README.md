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
npm run ts-node generateImages.ts [INPUT_DIRECTORY] [OUTPUT_DIRECTORY]
```

Where:
* `[INPUT_DIRECTORY]` is the path to a directory containing .glb files
* `[OUTPUT_DIRECTORY]` is the path where output .png files will be written.