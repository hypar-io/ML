const { exec, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const args = process.argv.slice(2)
if (args.length != 2) {
    console.error('Must provide a directory of .glb files and an output directory')
    process.exit()
}

const inputDirectory = path.resolve(args[0])
if (!fs.existsSync(inputDirectory)) {
    console.error('Input directory does not exist: ', inputDirectory)
    process.exit()
}
const outputDirectory = path.resolve(args[1])
if (!fs.existsSync(outputDirectory)){
    fs.mkdirSync(outputDirectory, { recursive: true })
}

// Start a file server for the GLBs so that the web context can fetch them.
const serverPath = path.resolve('cors_simple_server.py')
process.chdir(inputDirectory)
const glbServerPort = 8000
exec(`python ${serverPath} ${glbServerPort}`, (err, stdout, stderr) => {
  if (err) {
    console.error(err)
    return
  }

  // the *entire* stdout and stderr (buffered)
  console.log(`stdout: ${stdout}`)
  console.log(`stderr: ${stderr}`)
})
console.log(`GLB server listening on port ${glbServerPort}`)

// Use a headless web browser to render each GLB through Hypar's rendering engine and take a screenshot. 
const width = 256
const height = 256
let browser = null
const screenshotGltf = async (glbName: string, targetName: string) => {
	return new Promise(async (resolve, reject) => {
		if (!browser) {
			browser = await puppeteer.launch({
				ignoreHTTPSErrors: true,
				args: [
					"--disable-dev-shm-usage",
					"--no-zygote",
					"--use-gl=swiftshader",
					"--enable-webgl",
					"--hide-scrollbars",
					"--mute-audio",
					"--no-sandbox",
					"--single-process",
					"--disable-breakpad",
					"--ignore-gpu-blacklist",
					"--headless"
				],
			})
		}
		const page = await browser.newPage()
		await page.setViewport({ width: width, height: height })
		await page.exposeFunction('onModelLoaded', e => {
			console.log('Capturing screenshot.')
			page.screenshot({ path: targetName }).then(async () => {
                await page.close()
                resolve()
            })
            .catch(async () => {
                await page.close()
                reject()
            })
		})
		await page.evaluateOnNewDocument(() => {
			document.addEventListener('model-loaded', () => {
				(window as any).onModelLoaded()
			})
		})

		await page.goto(`https://hypar.io/render?url=http://localhost:${glbServerPort}/${glbName}`)
	})
}


// Iterate over all .glb files and take a screenshot.
const processFile = (filePath: string) => {
	return new Promise((resolve, reject) => {
		console.log('Processing', filePath)
		const inPath = path.basename(filePath)
		const outPath = path.join(outputDirectory, path.basename(filePath, '.glb') + '.png')
		if (fs.existsSync(outPath)) {
			console.log('Screenshot already exists. Skipping.')
			resolve()
		} else {
			screenshotGltf(inPath, outPath).then(resolve).catch(resolve)
		}
	})
}

async function processAllFiles(files) {
	for (const file of files) {
		await processFile(file)
	}
}
const files = fs.readdirSync(inputDirectory).filter((fileInDir) => path.extname(fileInDir) == '.glb')
processAllFiles(files)