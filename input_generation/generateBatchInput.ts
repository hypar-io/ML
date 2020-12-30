const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
if (args.length != 2) {
    console.error('Must provide a path to a hypar.json and a target output path.')
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
const parameters = configFile.inputs

// https://stackoverflow.com/questions/32439437/retrieve-an-evenly-distributed-number-of-elements-from-an-array
function evenlyDistributedSubset(items, n) {
    var elements = [items[0]]
    var totalItems = items.length - 2
    var interval = Math.floor(totalItems/(n - 2))
    for (var i = 1; i < n - 1; i++) {
        elements.push(items[i * interval])
    }
    elements.push(items[items.length - 1])
    return elements
}

// Sample options on each axis
const maxOptionsPerParam = 10
const options = {}
parameters.forEach((param) => {
    switch (param.type) {
        case 'geometry':
            const vertices = [[0, 0], [40, 0], [40, 40], [0, 40]].map(([x, y]) => ({X: x, Y: y, Z: 0}))
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

const executions = []
const assignExecutions = function (paramIndex, executionParams) {
    const param = parameters[paramIndex]
    options[param.name].forEach((option: any, idx) => {
        const newExecutionParams = {}
        Object.assign(newExecutionParams, executionParams)
        newExecutionParams[param.name] = option
        if (paramIndex < parameters.length - 1) {
            assignExecutions(paramIndex + 1, newExecutionParams)
        }
        else {
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
