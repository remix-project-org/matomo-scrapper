const reportEventAction = (report) => {
    const event = ['broadcastCompilationResult', 'providerChanged', 'usageType', 'DeployContractTo', 'Preload']
    report.actionDetails = {}
    event.map((e) => {
        report.actionDetails[e] = {
            nbEvent: 0,
            uniqueVisitors: [],
            notFoundInVisits: []
        }
    })
    
    return {
        actionDetailsWalker: (visit, action) => {
            if (event.indexOf(action.eventAction) !== -1) {
                report.actionDetails[action.eventAction].nbEvent++
                if (report.actionDetails[action.eventAction].uniqueVisitors.indexOf(visit.visitorId) === -1) {
                    report.actionDetails[action.eventAction].uniqueVisitors.push(visit.visitorId)
                }
                report.actionDetails[action.eventAction].found = true
            }
        },
        visit: (visit) => {
            event.map((e) => {
                report.actionDetails[e].found = false
            })
            
        },
        endVisit: (visit) => {
            event.map((e) => {
                if (!report.actionDetails[e].found) {
                    report.actionDetails[e].notFoundInVisits.push(visit.idVisit)
                }
            })
            
        },
        report: () => {
            event.map((e) => {
                console.log('')
                console.log(e)
                console.log(' nbEvent', report.actionDetails[e].nbEvent)
                console.log(' uniqueVisitors', report.actionDetails[e].uniqueVisitors.length)
                console.log(' notFoundInVisits', report.actionDetails[e].notFoundInVisits.length)
                console.log('')
            })
            
        }
    }  
}

module.exports = { reportEventAction }
