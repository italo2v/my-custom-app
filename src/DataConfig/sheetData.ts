const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

//field types = money, integer, float, select, date, text, alphanumeric, letters
/*example
	{
		rowTitle: [
			{title: 'myText', type: 'text', classes: ['first'], entry: true},
			{title: '1sem', type: "money"},
			{title: '2sem', type: "money"},
			{title: 'myText', type: "text",
				subValues: {
		      fields:[
		        {name: 'fieldname1', type: 'date', title: 'title1'},
		        {name: 'fieldname2', type: 'text', title: 'title2'}
		      ],
	      }
      }
		],
		enableRightStats: false,
		enableBottomsStats: false,
		footLines: [
      {'title': 'myText', 'field': 'value'},
    ],
    afterLoad: function(){
			//console.log('test')
    }
	}
*/

module.exports = {
	revenues: (sheet:Sheet):ConfigSheet=>{
		var rowTitle:RowTitle[] = [
			{title: 'revenues', type: 'text', classes: ['first'], entry: true}
		]
    months.forEach(function(title: string, t: number){
      rowTitle.push({title: title, type: "money"})
    })
    return {rowTitle: rowTitle}
	},
	expenses: (sheet:Sheet):ConfigSheet=>{
		var rowTitle:RowTitle[] = [
			{title: 'expenses', type: 'text', classes: ['first'], entry: true}
		]
    months.forEach(function(title: string, t: number){
      rowTitle.push({title: title, type: "money"})
    })
    return {rowTitle: rowTitle}
	},
	cards: (sheet:Sheet):ConfigSheet=>{
		var rowTitle:RowTitle[] = [
			{title: 'cards', type: 'text', classes: ['first'], entry: true}
		]
    months.forEach(function(title: string, t: number){
      rowTitle.push({title: title, type: "money"})
    })
    return {rowTitle: rowTitle}
	},
	funds: (sheet:Sheet):ConfigSheet=>{
		var rowTitle:RowTitle[] = [
			{title: 'investmentfunds', type: 'text', classes: ['first'], entry: true}
		]
    months.forEach(function(title: string, t: number){
      rowTitle.push({title: title, type: "money"})
    })
    return {rowTitle: rowTitle, enableRightStats: false}
	},
	fixedInvestments: (sheet:Sheet):ConfigSheet=>{
		var rowTitle:RowTitle[] = [
			{title: 'fixedinvestment', type: 'text', classes: ['first'], entry: true}
		]
    months.forEach(function(title: string, t: number){
      rowTitle.push({title: title, type: "money"})
    })
    return {rowTitle: rowTitle, enableRightStats: false}
	},
	fixedYield: (sheet:Sheet):ConfigSheet=>{
		var rowTitle:RowTitle[] = [
			{title: 'fixedinvestment', type: 'select', foreignEntries: 'fixedInvestments', classes: ['first'], entry: true}
		]
    months.forEach(function(title: string, t: number){
      rowTitle.push({title: title, type: "money"})
    })
    return {rowTitle: rowTitle, enableRightStats: false}
	},
	variableYield: (sheet:Sheet):ConfigSheet=>{
		var rowTitle:RowTitle[] = [
			{title: 'corporatename', type: 'select', foreignEntries: 'variableStocks', classes: ['first'], entry: true}
		]
		var subValues:RowSubValues = {
      title: 'changeyields',
      fields:[
        {name: 'datacom', type: 'date', title: 'datacom'},
        {name: 'value', type: 'money', title: 'value'}
      ],
      onClose: ()=>{
        var cellID: string = $('#ballon.subValues').attr('data-value') as string
        var cell: SheetCell = sheet.getCellByCellID(cellID)
        if(typeof cell === 'object'){
	        cell.value = ''
	        if (cell.subValues !== undefined) {
	          let totalSubValue: number = 0
	          cell.subValues.forEach((sv: VariableYieldSubValue) => {
	            if(typeof sv.value === 'string' && Number.isFinite(parseFloat(sv.value))) {
	              totalSubValue += parseFloat(sv.value)
	              cell.value = totalSubValue
	            }else if(typeof sv.value === 'number') {
	              totalSubValue += sv.value
	              cell.value = totalSubValue
	            }
	          })
	        }
	      }
      }
    }
    months.forEach(function(title: string, t: number){
      rowTitle.push({title: title, type: "money", classes: ['optionResult'], readonly: true, subValues: subValues, month: t+1})
    })
    return {rowTitle: rowTitle}
	},
	optionDerivative: (sheet:Sheet):ConfigSheet=>{
		var rowTitle:RowTitle[] = [
			{title: 'ticker', type: 'text', classes: ['first'], entry: true}
		]
		var subValues:RowSubValues = {
      title: 'changeoption',
      fields:[
        {name: 'transaction', type: 'select', title: 'transaction', default: 'B',
          values: [
            {name: 'buy', value: 'B'},
            {name: 'sell', value: 'S'}
          ]
        },
        {name: 'option', type: 'select', title: 'operation', default: 'CALL',
          values: [
            {name: 'call', value: 'CALL'},
            {name: 'put', value: 'PUT'}
          ]
        },
        {name: 'status', type: 'select', title: 'status', default: 'WAIT',
          values: [
            {name: 'waiting', value: 'WAIT'},
            {name: 'notexercised', value: 'NEX'},
            {name: 'exercised', value: 'EX'},
            {name: 'reseted', value: 'RES'}
          ]
        },
        {name: 'optionCode', type: 'alphanumeric', title: 'option'},
        {name: 'dueDateISO', type: 'date', title: 'duedate'},
        {name: 'dateISO', type: 'date', title: 'date'},
        {name: 'strike', type: 'money', title: 'strike'},
        {name: 'premium', type: 'money', title: 'premium'},
        {name: 'quantity', type: 'integer', title: 'quantity'},
        {name: 'costs', type: 'money', title: 'costs'}
      ],
      onClose: ()=>{
        var cellID: string = $('#ballon.subValues').attr('data-value') as string
        var cell: OptionCell = sheet.getCellByCellID(cellID)
        if(typeof cell === 'object' && cell.subValues !== undefined) {
          cell.value = ''
          delete cell.result
          delete cell.waiting
          let totalValue: number = 0
          cell.subValues.forEach( (sv: OptionSubValue) => {
            if(typeof sv.quantity === 'string')
              parseInt(sv.quantity)
            if (Number.isFinite(sv.premium) && Number.isFinite(sv.quantity)) {
              if (sv.transaction === 'S')
                totalValue += sv.premium * (sv.quantity as number)
              else if (sv.transaction === 'B')
                totalValue -= sv.premium * (sv.quantity as number)
              if (Number.isFinite(sv.costs))
                totalValue -= sv.costs
              cell.value = totalValue

              if (cell.result === undefined)
                cell.result = 0
              if (sv.status === 'NEX' || sv.status === 'RES') {
                if (sv.transaction === 'S')
                  cell.result += sv.premium * (sv.quantity as number)
                else if (sv.transaction === 'B')
                  cell.result -= sv.premium * (sv.quantity as number)
                if (Number.isFinite(sv.costs))
                  cell.result -= sv.costs
              }
              if (cell.waiting === undefined)
                cell.waiting = 0
              if (sv.status === 'WAIT') {
                if (sv.transaction === 'S')
                  cell.waiting += sv.premium * (sv.quantity as number)
                else if (sv.transaction === 'B')
                  cell.waiting -= sv.premium * (sv.quantity as number)
                if (Number.isFinite(sv.costs))
                  cell.waiting -= sv.costs
              }
            }
          })
        }
      }
    }
    months.forEach(function(title: string, t: number){
      rowTitle.push({title: title, type: "money", classes: ['optionResult'], readonly: true, subValues: subValues, month: t+1})
    })
    return {
    	rowTitle: rowTitle,
    	footLines: [
        {'title': 'result', 'field': 'result'},
        {'title': 'waiting', 'field': 'waiting'}
      ],
    }
	},
	contributions: (sheet:Sheet):ConfigSheet=>{
		var rowTitle:RowTitle[] = [
			{title: 'corporatename', type: 'select', foreignEntries: 'fixedInvestments/variableStocks/funds', classes: ['first'], entry: true}
		]
    months.forEach(function(title: string, t: number){
      rowTitle.push({title: title, type: "money"})
    })
    return {rowTitle: rowTitle}
	},
	variableStocks: (sheet:Sheet):ConfigSheet=>{
		var rowTitle:RowTitle[] = [
      {title: 'corporatename', type: 'text', classes: ['first'], entry: true},
      {title: 'ticker', type: 'alphanumeric', classes: ['markets'], entry: true},
      {title: 'market', type: 'select', items: [
      	{name: 'bovespa', value: 'BOVESPA'},
      	{name: 'nyse', value: 'NYSE'},
    	], classes: ['markets'], entry: true}
		]
		var subValues:RowSubValues = {
      title: 'changetransactions',
      showDot: true,
      fields:[
		    {name: 'transaction', type: 'select', title: 'transaction', default: 'B',
		      values: [
		        {name: 'buy', value: 'B'},
		        {name: 'sell', value: 'S'},
	        	{name: 'bonusshare', value: 'BS'},
            {name: 'split', value: 'SP'},
            {name: 'inplit', value: 'IN'}
		      ],
		      onChange: function(this: HTMLElement){
						var thisSV:string = 'subValue-'+$(this).attr('subValueNumber')?.toString()
						var select_value:string = $(this).val()?.toString()||''
						$('td.'+thisSV+' #dateISO').removeAttr('disabled').removeClass('disabled')
		        if(select_value === 'BS' || select_value === 'IN' || select_value === 'SP'){
		        	if(select_value === 'IN' || select_value === 'SP')
		          	sheet.sheetField.updateVal($('td.'+thisSV+' #price').attr('disabled', 'disabled').addClass('disabled'), '')
		          else
		          	$('td.'+thisSV+' #price').removeAttr('disabled').removeClass('disabled')
		          sheet.sheetField.updateVal($('td.'+thisSV+' #costs').attr('disabled', 'true').addClass('disabled'), '')
							$('td.'+thisSV+' #quantity').removeAttr('disabled').removeClass('disabled')
		        }else{
		          $('td.'+thisSV+' #price').removeAttr('disabled').removeClass('disabled')
		          $('td.'+thisSV+' #costs').removeAttr('disabled').removeClass('disabled')
		        }
		      }
		    },
		    {name: 'dateISO', type: 'date', title: 'date'},
		    {name: 'quantity', type: 'integer', title: 'quantity'},
		    {name: 'price', type: 'money', title: 'price'},
		    {name: 'costs', type: 'money', title: 'costs'}
		  ],
      onShowSubValue: (subValue: StockTransactions|null, subValueNumber: number)=>{
				if(subValue !== null) {
					var thisSV: string = 'subValue-' + subValueNumber.toString()
					if (subValue.transaction === 'BS' || subValue.transaction === 'SP' || subValue.transaction === 'IN') {
						if (subValue.transaction === 'SP' || subValue.transaction === 'IN') {
							$('td.' + thisSV + ' #price').attr('disabled', 'disabled').addClass('disabled')
						}
						$('td.' + thisSV + ' #costs').attr('disabled', 'disabled').addClass('disabled')
						$('td.' + thisSV + ' #quantity').removeAttr('disabled').removeClass('disabled')
					}
				}
      },
      onClose: ()=>{
				var cellID: string = $('#ballon.subValues').attr('data-value') as string
				var cell: SheetCell = sheet.getCellByCellID(cellID)
				if (cell.subValues !== undefined && cell.subValues.length > 0) {
					cell.subValues.forEach( (subValue: StockTransactions) => {
						if (subValue.transaction === 'BS') {
							//delete subValue.price
							delete subValue.costs
						}
						if (subValue.transaction === 'IN' || subValue.transaction === 'SP') {
							delete subValue.price
							delete subValue.costs
						}
						if(subValue.option === '')
							delete subValue.option
					})
				}
      }
    }

    months.forEach( (month: string, m:number)=>{
      rowTitle.push({title: month, type: 'money', classes: ['varStock'], subValues: subValues, month: m+1})
    })
    return {
    	rowTitle: rowTitle
    }
	}
}
