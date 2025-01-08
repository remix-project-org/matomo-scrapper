const reportUniqueVisitors = (report, event) => {
    report.uniqueVisitors = []
    report.visits = {}
    
    return {
        actionDetailsWalker: (visit, action) => {
            
        },
        visit: (visit) => {
            if (report.uniqueVisitors.indexOf(visit.visitorId) === -1) report.uniqueVisitors.push(visit.visitorId)
            if (!report.visits[visit.visitorId]) report.visits[visit.visitorId] = []
            report.visits[visit.visitorId].push(visit.actionDetails)
            
        },
        endVisit: (visit) => {},
        report: () => {
            console.log('')
            console.log(report.uniqueVisitors.length, 'Unique visitors')
            console.log('')  
        }
    }  
}

module.exports = { reportUniqueVisitors }
