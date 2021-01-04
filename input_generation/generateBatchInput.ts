const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
if (args.length != 3) {
    console.error('You must provide a path to a hypar.json, a target output path, and an input model path.')
    process.exit()
}

const hyparConfigPath = args[0]
if (path.basename(hyparConfigPath) != 'hypar.json') {
    console.error(`Hypar config path must point to a file called 'hypar.json'. Currently: ${hyparConfigPath}`)
    process.exit()
}

const targetFile = args[1]
if (path.extname(targetFile) != '.json') {
    console.error(`Target output path must be a .json file. Currently: ${targetFile}`)
    process.exit()
}

const configFile = JSON.parse(fs.readFileSync(hyparConfigPath))
const parameters = configFile.input_schema.properties

// TODO: Expand this to support multiple model import keys. Currently,
// All model import keys will be set to the same model.
var modelInputKeys = {}
const inputModel = args[2]
if (path.extname(inputModel) != '.json') {
    console.error(`Input model must be a .json file. Currently: ${inputModel}`)
    process.exit()
}
configFile.model_dependencies.map((md) => (modelInputKeys[md.name] = inputModel))

// https://stackoverflow.com/questions/32439437/retrieve-an-evenly-distributed-number-of-elements-from-an-array
function evenlyDistributedSubset(items, n) {
    var elements = [items[0]]
    var totalItems = items.length - 2
    var interval = Math.floor(totalItems / (n - 2))
    for (var i = 1; i < n - 1; i++) {
        elements.push(items[i * interval])
    }
    elements.push(items[items.length - 1])
    return elements
}

// Sample options on each axis
const maxOptionsPerParam = 10
const options = {}
Object.keys(parameters).forEach(key => {
    const param = parameters[key]

    // Parameters that are built-in like number and string.
    if (param.type) {
        switch (param.type) {
            case 'number':
                const rangeLength = Math.floor((param.maximum - param.minimum) / param.step) + 1
                const fullRange = Array.from({ length: rangeLength }, (_, i) => param.minimum + (i * param.step))
                options[key] = evenlyDistributedSubset(fullRange, Math.min(maxOptionsPerParam, fullRange.length))
                break
            default:
                throw new Error(`Cannot generate options for param type ${param.type} (${key})`)
        }
        // Parameters that defined by schemas.
    } else if (param.$ref) {
        const vertices = [[0, 0], [40, 0], [40, 40], [0, 40]].map(([x, y]) => ({ X: x, Y: y, Z: 0 }))
        switch (param.$ref) {
            case 'https://hypar.io/Schemas/Geometry/Polyline.json':
                options[key] = [{
                    discriminator: 'Elements.Geometry.Polyline',
                    Vertices: vertices,
                }]
                break
            case 'https://hypar.io/Schemas/Geometry/Polygon.json':
                options[key] = [{
                    discriminator: 'Elements.Geometry.Polygon',
                    Vertices: vertices,
                }]
                break
            case 'https://hypar.io/Schemas/Geometry/Color.json':
                options[key] = [{
                    discriminator: 'Elements.Geometry.Color',
                    Red: 1.0,
                    Green: 1.0,
                    Blue: 1.0,
                    Alpha: 1.0
                }]
                break
            default:
                throw new Error(`Cannot generate options for param type ${param.$ref} (${key})`)
        }
    }
})

const executions = []
const assignExecutions = function (paramIndex, executionParams) {
    const name = Object.keys(parameters)[paramIndex]
    const length = Object.keys(parameters).length

    options[name].forEach((option: any, idx) => {
        const newExecutionParams = {}
        Object.assign(newExecutionParams, executionParams)
        newExecutionParams[name] = option
        if (paramIndex < length - 1) {
            assignExecutions(paramIndex + 1, newExecutionParams)
        }
        else {
            newExecutionParams['model_input_keys'] = modelInputKeys
            executions.push(newExecutionParams)
        }
    })
}
assignExecutions(0, {})

fs.writeFile(targetFile, JSON.stringify(executions), function (err) {
    if (err) {
        console.log(err)
    }
    else {
        console.log('Success')
    }
})
