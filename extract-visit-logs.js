const fs = require('fs').promises
const fsSync = require('fs')
const axios = require('axios')

require('dotenv').config()

const CHUNK_SIZE = 1000 // Number of records per chunk

const getChunkData = async (date, offset) => {
    console.log(`getting segment data for date ${date}`)
    console.log(`Fetching chunk at offset ${offset}...`)
    
    const url = `https://matomo.remix.live/matomo/index.php?module=API&format=JSON&idSite=3&period=day&date=${date}&method=Live.getLastVisitsDetails&filter_limit=${CHUNK_SIZE}&filter_offset=${offset}&token_auth=${process.env.MATOMO_API_KEY}`
    // const url = `https://matomo.remix.live/matomo/index.php?module=API&format=JSON&idSite=3&period=day&date=${date}&method=Live.getLastVisitsDetails&filter_limit=${CHUNK_SIZE}&filter_offset=${offset}&expanded=1&segment=eventAction%3D%3DsendTransaction-from-gui%3BeventName%3D%24-56,eventName%3D%24-97%3BeventAction%3D%3DsendTransaction-from-gui,eventAction%3D%3DsendTransaction-from-plugin&showMetadata=0&token_auth=${process.env.MATOMO_API_KEY}`
    // const url = `https://matomo.remix.live/matomo/index.php?module=API&format=JSON&idSite=3&period=day&date=${date}&method=CustomReports.getCustomReport&idCustomReport=19&reportUniqueId=CustomReports_getCustomReport_idCustomReport--19&expanded=1&filter_limit=${CHUNK_SIZE}&filter_offset=${offset}&showMetadata=0&token_auth=${process.env.MATOMO_API_KEY}`
    const response = await axios.get(url, {
        timeout: 0, // No timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        httpAgent: new (require('http')).Agent({ keepAlive: true }),
        httpsAgent: new (require('https')).Agent({ keepAlive: true }),
        onDownloadProgress: (progressEvent) => {
            const loaded = (progressEvent.loaded / (1024 * 1024)).toFixed(2) // Convert to MB
            if (progressEvent.total) {
                const total = (progressEvent.total / (1024 * 1024)).toFixed(2)
                const percentage = ((progressEvent.loaded / progressEvent.total) * 100).toFixed(2)
                console.log(`Chunk ${offset}: Downloaded ${loaded} MB / ${total} MB (${percentage}%)`)
            } else {
                console.log(`Chunk ${offset}: Downloaded ${loaded} MB`)
            }
        }
    })
    
    return response.data
}

const isDataEmpty = (jsonData) => {
    // Check if the JSON response is empty or contains no data
    if (!jsonData || !Array.isArray(jsonData)) {
        return true
    }
    return jsonData.length === 0
}

const getAllData = async (date) => {
    console.log('Starting chunked data fetch from Matomo...')
    
    // Ensure segment directory exists
    await fs.mkdir(`segments/week5`, { recursive: true })
    
    const filePath = `segments/week5/${date}.json`
    let offset = 0
    let chunkCount = 0
    let totalRecords = 0
    let fileStream = null
    
    try {
        // Create write stream for the JSON file
        fileStream = fsSync.createWriteStream(filePath)
        
        // Write the opening bracket for the JSON array
        fileStream.write('[\n')
        
        while (true) {
            try {
                console.log(`--- Fetching chunk ${chunkCount + 1} (offset: ${offset}) ---`)
                const chunkData = await getChunkData(date, offset)
                
                // Check if this chunk is empty (end of data)
                if (isDataEmpty(chunkData)) {
                    console.log('Reached end of data (empty chunk received)')
                    break
                }
                
                // Write each record as a separate JSON object
                for (let i = 0; i < chunkData.length; i++) {
                    const record = chunkData[i]
                    
                    // Add comma before each record except the first one
                    if (totalRecords > 0) {
                        fileStream.write(',\n')
                    }
                    
                    // Write the record as JSON
                    fileStream.write(JSON.stringify(record, null, 2))
                    totalRecords++
                }
                
                chunkCount++
                offset += CHUNK_SIZE
                
                console.log(`Chunk ${chunkCount} processed successfully. Records in chunk: ${chunkData.length}, Total records: ${totalRecords}`)
                
                // Add a small delay between chunks to be respectful to the server
                await new Promise(resolve => setTimeout(resolve, 1000))
                
            } catch (error) {
                console.error(`Failed to fetch chunk at offset ${offset}:`, error.message)
                throw error
            }
        }
        
        // Write the closing bracket for the JSON array
        fileStream.write('\n]')
        
        console.log(`File saved successfully! Total records: ${totalRecords}, Total chunks processed: ${chunkCount}`)
        
    } catch (error) {
        console.error('Error during data processing:', error)
        throw error
    } finally {
        // Always close the file stream
        if (fileStream) {
            fileStream.end()
        }
    }
}

const run = async (startDate, endDate) => {
    let currentDate = new Date(startDate)
    fs.mkdir(`segments`, { recursive: true })
    while (currentDate <= endDate) {
        const formattedDate = currentDate.toISOString().split('T')[0]

        await getAllData(formattedDate)
        currentDate.setDate(currentDate.getDate() + 1)
    }
}

const main = async () => {
    try {
        const startDate = new Date(2026, 0, 26)
        const endDate = new Date(2026, 1, 2)
        await run(startDate, endDate)
    } catch (error) {
        console.error('Error in main execution:', error)
        process.exit(1)
    }
}

main()
