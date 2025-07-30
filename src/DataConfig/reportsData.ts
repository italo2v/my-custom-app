//report types = var, line, table, sheet, doughnut or pie
module.exports = {
	yieldReturn: {
		title: 'yield', showSelectors: ['period', 'groupbyperiod', 'datasets/tabs', 'groupbydata'], type: 'sheet', registerTitle: 'corporatename', selectorDataSets: {
			dataSets: [
				{title: 'variableincome', dataID: 'variableYield'},
				{title: 'fixedincome', dataID: 'fixedYield'}
			]
		}, previewValues: [
			{opName: 'yield', variable: 'operations', title: 'yield'},
		]
	},
	incomeEvolution: {
		title: 'passiveincome', showSelectors: ['period', 'groupbyperiod', 'tabs', 'stack?', 'total'], type: 'line', selectorDataSets: {
			groupData: 'tabs',
			dataSets: [
				{title: 'variableincome', dataID: 'variableYield'}
			]
		}
	},
	annualResult: {
		title: 'annualresult', showSelectors: ['year', 'groupbydata:tabs/datasets', 'tabs', 'stack?', 'total'], type: 'bar', selectorDataSets: {
			dataSets: [
				{title: 'variableincome', dataID: 'variableStocks'},
				{title: 'fixedincome', dataID: 'fixedInvestments'},
				{title: 'investmentfunds', dataID: 'funds'}
			]
		}
	},
	personalFinance: {
		title: 'personalfinance', showSelectors: ['year', 'tabs'], type: 'table', dataOperations: 'getRemainderDataSet', selectorDataSets: {
			groupData: 'tabs',
			dataSets: [
				{title: 'revenues', dataID: 'revenues'},
				{title: 'expenses', dataID: 'expenses'}
			]
		}
	},
	actualAssets: {
		title: 'actualassets', showSelectors: [], type: 'doughnut', dataOperations: 'getLastMonth', selectorDataSets: {
			groupData: 'tabs',
			showTotal: true,
			dataSets: [
				{title: 'variableincome', dataID: 'variableStocks', showTabs: ['{all}']},
				{title: 'fixedincome', dataID: 'fixedInvestments', showTabs: ['{all}']},
				{title: 'investmentfunds', dataID: 'funds', showTabs: ['{all}']}
			]
		}
	},
	annualPosition: {
		title: 'annualposition', showSelectors: ['year'], type: 'table', dataOperations: 'getLastYearQty', selectorDataSets: {
			showTotal: true,
			groupData: 'firstValue',
			dataSets: [
				{title: 'variableincome', dataID: 'variableStocks', showTabs: ['{all}']},
				{title: 'fixedincome', dataID: 'fixedInvestments', showTabs: ['{all}']},
				{title: 'investmentfunds', dataID: 'funds', showTabs: ['{all}']}
			]
		}, period: {startDate: '12-{year--}', endDate: '1-{year}'}
	},
}