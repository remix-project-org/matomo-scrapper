const fs = require('fs').promises

require('dotenv').config()

const getData = async (date, reportUniqueId) => {
    console.log(`getting ${date}`)
    const ret = await fetch(`https://matomo.remix.live/matomo/index.php?module=API&format=JSON&idSite=3&period=day&date=${date}&method=CustomReports.getCustomReport&idCustomReport=${reportUniqueId}&reportUniqueId=CustomReports_getCustomReport_idCustomReport--${reportUniqueId}&showMetadata=0&token_auth=${process.env.MATOMO_API_KEY}&flat=1&filter_limit=-1`)

    let retJson = []
    try {
        const txt = await ret.text()
        retJson = JSON.parse(txt)
    } catch (e) {
        console.log(e)
        return
    }
    await fs.writeFile(`data/${reportUniqueId}/raw-${date}.json`, JSON.stringify(retJson, null, '\t'))
}

const run = async (startDate, endDate, reportUniqueId) => {
    let currentDate = new Date(startDate)
    fs.mkdir(`data/${reportUniqueId}`, { recursive: true })
    console.log(`--- getting custom report with id ${reportUniqueId} ---`)
    while (currentDate <= endDate) {
        const formattedDate = currentDate.toISOString().split('T')[0]

        await getData(formattedDate, reportUniqueId)
        currentDate.setDate(currentDate.getDate() + 1)
    }
}

const startDate = new Date(2025, 8, 25)
const endDate = new Date()

const main = async () => {
    await run(startDate, endDate, 9)
    await run(startDate, endDate, 14)
}

main().catch(console.error)

