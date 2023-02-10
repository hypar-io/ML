const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
if (args.length < 2) {
    console.error('You must provide a path to a hypar.json, and a target output path.')
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

// The optional third argument specifies dependencies on other functions' outputs.
// If the argument is a JSON object, it's a map from dependency name to JSON file paths.
// If the argument is a path to a .json file model, all import keys will be set to this model.
var modelInputKeys = null
if (args.length > 2) {
    const modelArg = args[2]
    if (modelArg.includes('{')) {
        modelInputKeys = JSON.parse(modelArg)
    } else {
        if (path.extname(modelArg) != '.json') {
            console.error(`Input model must be a .json file or a JSON object. Currently: ${modelArg}`)
            process.exit()
        }
        modelInputKeys = {}
        if (configFile.model_dependencies) {
            configFile.model_dependencies.map((md) => (modelInputKeys[md.name] = modelArg))
        }
    }
}
if (configFile.model_dependencies) {
    const missingDependencies = configFile.model_dependencies.filter((dep) => !dep.optional && (!modelInputKeys || !(dep.name in modelInputKeys)))
    if (missingDependencies.length > 0) {
        const missingNames = missingDependencies.map((dep) => dep.name)
        missingNames.sort()
        console.error(`No input models were given for required model dependencies: ${missingNames.join(', ')}`)
        process.exit()
    }
}

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

var parameters = null

// TODO: Remove this section when we are sure
// that the majority of functions are using input_schema
if (configFile.inputs) {
    parameters = configFile.inputs
    parameters.forEach((param) => {
        switch (param.type) {
            case 'geometry':
                const vertices = [[0, 0], [40, 0], [40, 40], [0, 40]].map(([x, y]) => ({ X: x, Y: y, Z: 0 }))
                options[param.name] = [{
                    discriminator: param.primitive_type == 'polyline' ? 'Elements.Geometry.Polyline' : 'Elements.Geometry.Polygon',
                    Vertices: vertices
                }]
                break
            case 'range':
                const rangeLength = Math.floor((param.max - param.min) / param.step) + 1
                const fullRange = Array.from({ length: rangeLength }, (_, i) => param.min + (i * param.step))
                options[param.name] = evenlyDistributedSubset(fullRange, Math.min(maxOptionsPerParam, fullRange.length))
                break
            default:
                throw new Error(`Cannot generate options for param type ${param.type} (${param.name})`)
        }
    })
} else {
    parameters = configFile.input_schema.properties
    Object.keys(parameters).forEach(key => {
        const param = parameters[key]

        // Parameters that defined by schemas.
        if (param.$ref) {
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
        } else if (param.type) {
            // Parameters that are built-in like number and string.
            switch (param.type) {
                case 'boolean':
                    options[key] = [true, false]
                    break
                case 'number':
                    const rangeLength = Math.floor((param.maximum - param.minimum) / param.multipleOf) + 1
                    const fullRange = Array.from({ length: rangeLength }, (_, i) => param.minimum + (i * param.multipleOf))
                    options[key] = evenlyDistributedSubset(fullRange, Math.min(maxOptionsPerParam, fullRange.length))
                    break
                case 'string':
                    if (!param.enum) {
                        throw new Error(`Cannot generate options for strings without enum values (${key})`)
                    }
                    options[key] = evenlyDistributedSubset(param.enum, Math.min(maxOptionsPerParam, param.enum))
                    break
                default:
                    if (param.default) {
                        options[key] = [param.default]
                    } else {
                        throw new Error(`Cannot generate options for param type ${param.type} (${key})`)
                    }
            }
        }
    })
}

const executions = []
const assignExecutions = function (paramIndex, executionParams) {

    const name = configFile.inputs ? parameters[paramIndex].name : Object.keys(parameters)[paramIndex]
    const length = configFile.inputs ? parameters.length : Object.keys(parameters).length

    options[name].forEach((option: any) => {
        const newExecutionParams = {}
        Object.assign(newExecutionParams, executionParams)
        newExecutionParams[name] = option
        if (paramIndex < length - 1) {
            assignExecutions(paramIndex + 1, newExecutionParams)
        }
        else {
            if (modelInputKeys) {
                newExecutionParams['model_input_keys'] = modelInputKeys
            }
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
