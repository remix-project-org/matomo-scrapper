const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs')

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

const getData = async (date, csvs) => {
    console.log(`getting ${date}`)
    const ret = await fetch(`https://ethereumfoundation.matomo.cloud/index.php?module=API&method=Events.getName&idSite=23&period=day&date=${date}&format=JSON&token_auth=${process.env.MATOMO_API_KEY}&force_api_session=1&secondaryDimension=eventAction&flat=1`)
    const retJson = await ret.json()
    
    for (const entry of retJson) {
        // console.log(entry)
        if (filter_deployContractTo(entry)) {
            if (!csvs[entry.label]) csvs[entry.label] = []
            csvs[entry.label].push({ Date: date, nb_events: entry.nb_events })
        }
    }
}

const run = async (startDate, endDate) => {
    const csvs = {}
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const formattedDate = currentDate.toISOString().split('T')[0];
        await getData(formattedDate, csvs);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log(csvs, Object.keys(csvs).length)
    const content = convertJsonToCsv(csvs)
    fs.writeFileSync('data/deployContractTo.csv', content)
}

const startDate = new Date(2025, 0, 1)
console.log(startDate)
const endDate = new Date()
run(startDate, endDate).catch(console.error);

const filter_deployContractTo = (entry) => {
    return entry.Events_EventAction === 'DeployContractTo'
}

