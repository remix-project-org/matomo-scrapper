

const fs = require('fs').promises; // Use the promise-based version of fs

const { reportEventAction } = require('./report-event-actions')
const { reportUniqueVisitors } = require('./report-unique-visitors')

async function loadJsonFile(filePath) {
    try {
        // Read the file content
        const data = await fs.readFile(filePath, 'utf8');

        // Parse the JSON data
        const jsonData = JSON.parse(data);
        // console.log('JSON data successfully loaded:', jsonData);

        return jsonData; // Return the JSON data if needed
    } catch (error) {
        console.error('Error loading the JSON file:', error);
        throw error; // Rethrow the error if needed
    }
}

async function loadJsonFiles() {
    try {
        const files = []
        let offset = 0
        const filterLimit = 1000
        while (true) {
            try {
                // Read the file content
                console.log(offset)
                await fs.access(`data/matomo_${offset}.json`);
                files.push(await loadJsonFile(`data/matomo_${offset}.json`))
                offset += filterLimit
            } catch (e) {
                break
            }
        }
        return files
    } catch (error) {
        console.error('Error loading the JSON file:', error);
        throw error; // Rethrow the error if needed
    }
}

(async () => {
    // Specify the path to your JSON file

    try {
        const report = {}
        // Load the JSON file
        const jsonData = await loadJsonFiles();
        console.log(jsonData.length, 'files')

        const walkers = [
            reportEventAction(report),
            reportUniqueVisitors(report)
        ]
        
        jsonData.map((files) => {
            files.map((visit) => {
                walkers.map((walker) => walker.visit ? walker.visit(visit) : null)
                visit.actionDetails.map((action) => {
                    walkers.map((walker) => walker.actionDetailsWalker ? walker.actionDetailsWalker(visit, action) : null)
                })
                walkers.map((walker) => walker.endVisit ? walker.endVisit(visit) : null)
            })
        })
        walkers.map((walker) => walker.report ? walker.report() : null)
    } catch (error) {
        console.error('Failed to load JSON:', error);
    }
})()
