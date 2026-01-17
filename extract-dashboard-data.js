const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs').promises
const { spawnSync } = require('child_process');

require('dotenv').config()

const writeCSV = (name, entries) => {
    if (entries.length === 0) return;
    console.log(entries)
    console.log('__')
    const csvWriter = createCsvWriter({
        path: 'data/' + name + '.csv',
        header: [{ id: entries[0][0], title: entries[0][0] },
            { id: entries[0][1], title: entries[0][1] }]
    });

    entries.shift()
    csvWriter.writeRecords(entries)
        .then(() => {
            console.log('CSV file written successfully');
        });
}

function convertJsonToCsv(jsonData) {
    const keys = Object.keys(jsonData);
    const dates = jsonData[keys[0]].map(item => item.Date);
  
    let csvContent = 'Date,';
    csvContent += keys.join(',') + '\n';
  
    dates.forEach(date => {
      csvContent += date + ',';
      keys.forEach(key => {
        const event = jsonData[key].find(item => item.Date === date);
        csvContent += event ? event.nb_events : '0';
        csvContent += ',';
      });
      csvContent += '\n';
    });
  
    return csvContent;
  }

const ite = {}
const getData = async (date, csvs, filter) => {
    console.log(`getting ${date}`)

    // const response =  spawnSync(
    //                `curl -X POST "https://ethereumfoundation.matomo.cloud/index.php?module=API&method=Events.getName&idSite=23&period=day&date=${date}&format=JSON&token_auth=${process.env.MATOMO_API_KEY}&force_api_session=1&secondaryDimension=eventAction&flat=1&filter_limit=100000" --output ./dashboard_data.json`, { shell:true })
    
    const ret = await fetch(`https://matomo.remix.live/matomo/index.php?module=API&format=JSON&idSite=3&period=day&date=yesterday&method=Live.getLastVisitsDetails&filter_limit=10&expanded=1&segment=eventAction%3D%3DsendTransaction-from-gui%3BeventAction%3D%3DsendTransaction-from-gui&showMetadata=0&token_auth=${process.env.MATOMO_API_KEY}`) // https://matomo.remix.live/matomo/index.php?module=API&format=JSON&idSite=3&period=day&method=Live.getLastVisitsDetails&date=${date}&filter_limit=100000&expanded=1&segment=eventAction%3D%3DsendTransaction-from-gui%3BeventAction%3D%3DsendTransaction-from-gui&showMetadata=0&token_auth=${process.env.MATOMO_API_KEY}`)
    
    // const data = await fs.readFile(`dashboard_data.json`, 'utf8');
    let retJson = []
    try {
        const txt = await ret.text()
        retJson = JSON.parse(txt)
    } catch (e) {
        console.log(e)
        return
    }
    
    await fs.writeFile(`data/raw-${date}.json`, JSON.stringify(retJson, null, '\t'))
    for (const entry of retJson) {
        if (filter(entry)) {
            // console.log(entry.Events_EventName)
            if (!ite[entry.label]) ite[entry.label] = parseInt(entry.nb_events)
            else ite[entry.label] = ite[entry.label] + parseInt(entry.nb_events)
            // console.log(entry)

            if (!csvs[entry.label]) csvs[entry.label] = []
            csvs[entry.label].push({ Date: date, nb_events: entry.nb_events })
        }
    }
    
}

let it = 0
const run = async (startDate, endDate, filter) => {
    const csvs = {}
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const formattedDate = currentDate.toISOString().split('T')[0];
        await getData(formattedDate, csvs, filter);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    // console.log(csvs, Object.keys(csvs).length)
    // console.log('____________________')
    // console.log(csvs['Main (1) network - DeployContractTo'])
    // const content = convertJsonToCsv(csvs)
    // fs.writeFile('data/transactions.csv', content)
    fs.writeFile('data/transactions.json', JSON.stringify(csvs, null, '\t'))
    fs.writeFile('data/networks.json', JSON.stringify(ite, null, '\t'))
    console.log('it', it)
}

console.log('API KEY', process.env.MATOMO_API_KEY)
const startDate = new Date(2025, 8, 22)
console.log(startDate)
const endDate = new Date()

const eventsAction = ['DeployContractTo', 'transact', 'call', 'send', 'sendTransaction-from-gui', 'sendTransaction-from-plugin']

run(startDate, endDate, (entry) => {
    /*if (entry.Events_EventName.startsWith('0x') && entry.Events_EventCategory === 'udapp') {
        it++
        return true
    }*/
    return eventsAction.includes(entry.Events_EventAction)
}).catch(console.error);

