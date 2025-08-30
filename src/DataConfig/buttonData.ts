module.exports = {
  buttons: [
    {type: 'menu', id: 'btnPersonalFinance', title: 'CTRL+P', text: 'personalfinance', items: [
      {id: 'expenses', title: 'CTRL+E', text: 'expenses', menuTitle: 'expenses', panel: 'sheetData'},
      {id: 'revenues', title: 'CTRL+R', text: 'revenues', menuTitle: 'revenues', panel: 'sheetData'},
      {id: 'cards', title: 'CTRL+D', text: 'cards', menuTitle: 'cards', panel: 'sheetData'}
    ]},
    {type: 'menu', id: 'btnInvestments', title: 'CTRL+I', text: 'investments', items: [
      {id: 'funds', title: 'CTRL+ALT+F', text: 'investmentfunds', menuTitle: 'investmentfunds', panel: 'sheetData'},
      {'submenu': true, text: 'fixedincome', items: [
        {id: 'fixedInvestments', title: 'CTRL+ALT+X', text: 'investments', menuTitle: 'fixedinvestmenttitle', panel: 'sheetData'},
        {id: 'fixedYield', title: 'CTRL+ALT+Y', text: 'yield', menuTitle: 'fixedyieldtitle', panel: 'sheetData'}
      ]},
      {'submenu': true, text: 'variableincome', items: [
        {id: 'variableStocks', title: 'CTRL+ALT+V', text: 'investments', menuTitle: 'variablestocktitle', panel: 'sheetData'},
        {id: 'variableYield', title: 'CTRL+ALT+H', text: 'yield', menuTitle: 'variableyieldtitle', panel: 'sheetData'},
        {id: 'optionDerivative', title: 'CTRL+ALT+O', text: 'optionTitle', menuTitle: 'optionTitle', panel: 'sheetData'}
      ]},
      {id: 'contributions', title: 'CTRL+ALT+N', text: 'contributions', menuTitle: 'contributions', panel: 'sheetData'}
    ]},
    {type: 'menu', id: 'btnGraphs', title: 'CTRL+G', text: 'graphsandreports', items: [
      {id: 'actualAssets', title: 'CTRL+T', text: 'actualassets', menuTitle: 'actualassets', panel: 'reports'},
      {id: 'annualResult', title: 'CTRL+N', text: 'annualresult', menuTitle: 'annualresult', panel: 'reports'},
      {id: 'personalFinance', title: 'CTRL+F', text: 'personalfinance', menuTitle: 'personalfinance', panel: 'reports'},
      {id: 'annualPosition', title: 'CTRL+O', text: 'annualposition', menuTitle: 'annualposition', panel: 'reports'},
      {id: 'yieldReturn', title: 'CTRL+Y', text: 'yield', menuTitle: 'yield', panel: 'reports'},
      {id: 'incomeEvolution', title: 'CTRL+M', text: 'incomeevolution', menuTitle: 'incomeevolution', panel: 'reports'},
    ]}
  ]
}
