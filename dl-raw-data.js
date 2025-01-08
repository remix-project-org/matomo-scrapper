const fs = require('fs').promises; // Use the promise-based version of fs
const axios = require('axios');
const { spawnSync } = require('child_process');

async function dlRawData() {
    try {
        // token_auth=f7e336d4005db3206f904b04aa412159" --data "idSite=23&period=day&date=yesterday&filter_limit=1000&filter_offset=40000"
        const filterLimit = 1000
        let offset = 0        
        while (true) {
            console.log(offset)
            const postRequestData = {
                token_auth: 'f7e336d4005db3206f904b04aa412159',
                idSite: 23,
                period: 'day',
                date: 'yesterday',
                filter_limit: filterLimit,
                filter_offset: offset
            }   
            const response =  spawnSync(
                `curl -X POST "https://ethereumfoundation.matomo.cloud/index.php?module=API&method=Live.getLastVisitsDetails&format=JSON" --data "idSite=23&period=day&date=yesterday&filter_limit=${filterLimit}&filter_offset=${offset}&token_auth=f7e336d4005db3206f904b04aa412159" >> data/matomo_${offset}.json`, { shell:true })
            const data = await fs.readFile(`data/matomo_${offset}.json`, 'utf8');
            if (data === '[]') {
                break
            }
            offset = offset + filterLimit
        }        
    } catch (error) {
        console.error('Error loading the JSON file:', error);
        throw error; // Rethrow the error if needed
    }
}

console.log('dlRawData')
dlRawData()
