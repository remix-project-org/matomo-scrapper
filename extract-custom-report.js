const fs = require('fs').promises

require('dotenv').config()

const getData = async (date) => {
    console.log(`getting ${date}`)
    const ret = await fetch(`https://matomo.remix.live/matomo/index.php?module=API&format=JSON&idSite=3&period=day&date=${date}&method=CustomReports.getCustomReport&idCustomReport=9&reportUniqueId=CustomReports_getCustomReport_idCustomReport--9&flat=1&showMetadata=0&token_auth=${process.env.MATOMO_API_KEY}&filter_limit=-1`)

    let retJson = []
    try {
        const txt = await ret.text()
        retJson = JSON.parse(txt)
    } catch (e) {
        console.log(e)
        return
    }
    await fs.writeFile(`data/raw-${date}.json`, JSON.stringify(retJson, null, '\t'))
}

const run = async (startDate, endDate) => {
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const formattedDate = currentDate.toISOString().split('T')[0];
        await getData(formattedDate);
        currentDate.setDate(currentDate.getDate() + 1);
    }
}
const startDate = new Date(2025, 8, 25)
console.log(startDate)
const endDate = new Date()

run(startDate, endDate).catch(console.error);

