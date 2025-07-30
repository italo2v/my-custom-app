interface SubValues {
	fields: SubValueField[];
	subValues: any;
	onClose:()=>void;
	onShowSubValue:(subValues: any|null, subValueNumber:number) => void;
	showSubValues:(cellID:string) => void;
	lock?: boolean;
}
interface SubValue {
	[field: string]: string|number;
}
interface SubValueField {
	name: string;
	type: FieldType;
	title: string;
	default?: string;
	values?: SelectItem[]|string;
	onChange?: (this:HTMLElement)=>void;
}
// @ts-ignore
const sheetField: SheetField = require('./sheetField.js')

module.exports = {
	fields: [],
	subValues: [],
	onClose: ()=>{},
	onShowSubValue: ()=>{},
	showSubValues: (cellID:string)=>{
		var $td = $('td#'+cellID)
	  var left:number = $td.children('div.sheetField').width()||95
	  $('<span/>', {'class': 'ballonArrow subValues', 'style': 'left:'+left+'px;'}).appendTo($td)
	  var $ballon = $('<div/>', {'id': 'ballon', 'class': 'subValues', 'data-value': cellID, 'style': 'left:'+(left+4)+'px;'}).appendTo($td)
	  $('<span>', {'id': 'subValueNumber'}).html('0').hide().appendTo($ballon)
	  var $table = $('<table/>').appendTo($ballon)
		var $tr: JQuery
	  module.exports.fields.forEach( (field: SubValueField)=>{
	  	$tr = $('<tr/>').appendTo($table)
	  	$('<td/>').addClass('title').html(field.title+': ').appendTo($tr)
	  })
		$tr = $('<tr/>').appendTo($table)
	  $('<td/>').addClass('title').appendTo($tr)

	  var $button = $('<button/>', {'id': 'addSubValue', 'class': 'btn btn-primary'}).html('+').appendTo($ballon).on("click", function(){
	  	addSubValue(null)
	  })
	  if(module.exports.subValues.length === 0) {
			$button.trigger("click")
			module.exports.onShowSubValue(null, 1)
		}else
		  for(var sv:number=0;sv<=module.exports.subValues.length-1;sv++){
		  	addSubValue(module.exports.subValues[sv])
		  	module.exports.onShowSubValue(module.exports.subValues[sv], (sv+1))
		  }
	}
}

$body.on("mousedown", function(e: JQuery.MouseDownEvent){
  //close SubValue ballon if click outside
  var varBallon:boolean = false
  $(e.target).parents().each( (index:number, element: HTMLElement)=>{
    if($(element).hasClass('subValues') && $(element).attr('id') === 'ballon')
      varBallon = true
    if($(element).attr('id') === 'ui-datepicker-div')
      varBallon = true
  })
  if(!varBallon && e.target.id !== 'ballon' && $('#ballon.subValues').length > 0 && e.target.id !== 'changeSubValues')
    closeSubValues()
})

function closeSubValues(){
	var $lock = $('#lock')
	if($lock.length === 0)
		$('<div>'). attr('id', 'lock').appendTo($body)
	$lock.hide()
	$('#addSubValue').trigger("focus")
	updateSubValuesCell()
	if(module.exports.lock !== true){
		$('#ballon.subValues').remove()
		$('.ballonArrow').remove()
	}
}

function addSubValue(subValue:SubValue|null){
  if(subValue === null){
		var this_date:Date = new Date()
	  var year:number = parseInt($('#selectYear').val()?.toString() || this_date.getFullYear().toString())
	  var month:number = parseInt($('#ballon.subValues').parent().children('div.sheetField').attr('data-month')||'1')
	  var day:number = 1
	  if(month === this_date.getMonth()+1 && year === this_date.getFullYear())
	  	day = this_date.getDate()
		subValue = {}
  	module.exports.fields.forEach( (field: SubValueField)=>{
			if(subValue === null)
				subValue = {}
  		if(field.type === 'date')
  			subValue[field.name] = year+'-'+month+'-'+day
  		else
  			subValue[field.name] = ''
  	})
  }
	var $subValueCount = $('#subValueNumber')
  var subValueNumber:number = parseInt($subValueCount.html())+1
	$subValueCount.html(subValueNumber.toString())
  if( subValueNumber >= 6 && (subValueNumber-1) % 5 === 0){
		var $tr: JQuery
		var $table = $('#ballon.subValues table')
  	module.exports.fields.forEach( (field: SubValueField)=>{
		  $tr = $('<tr/>').appendTo($table)
		  $('<td/>').addClass('title').html(field.title+': ').appendTo($tr)
		})
		$tr = $('<tr/>').appendTo($table)
	  $('<td/>').addClass('title').appendTo($tr)
  }
	var $trs = $('#ballon.subValues table tr')
  var start:number = (subValueNumber-1)/5 | 0 //integer
  var n_fields:number = module.exports.fields.length+1
  module.exports.fields.forEach( (field: SubValueField, index:number)=>{
  	var pos_tr:number = (start*n_fields)+index
		var $td: JQuery
		if(subValue !== null)
			if(field.type === 'select'){
				$td = $('<td/>', {'class': 'subValue-'+subValueNumber}).appendTo($trs[pos_tr])
				if(subValue[field.name] === '' && typeof field.default === 'string')
					subValue[field.name] = field.default
				var $select_field = sheetField.createField(field.type, field.values, subValue[field.name], '', field.name).appendTo($td)
				if(typeof field.onChange === 'function'){
					$select_field.children('select').off("change.subValue").attr('subValueNumber', subValueNumber).on("change.subValue", field.onChange)
				}else
					$select_field.children('select').off("change.subValue")
			}else if(field.type){
				$td = $('<td/>', {'class': 'subValue-'+subValueNumber}).appendTo($trs[pos_tr])
				var language:string = $('#ballon.subValues').parent().children('div.sheetField').attr('data-language')||''
				sheetField.createField(field.type, language, subValue[field.name], '', field.name).appendTo($td).children('input').on("focusout", function(){
					var width:number = (($(this).parent().children('div.value').html().length-4)*7)+50 ||100
					if(width < 100)
						width = 100
					var this_subValue:string = $(this).parent().parent().attr('class')||''
					$(this).parent().parent().parent().children('td').each( (td_index:number, td:HTMLElement)=>{
						if($(td).attr('class') === this_subValue)
							$trs.each( function(this:HTMLElement){
								var this_width:number = parseInt($($(this).children('td')[td_index]).children('div.sheetField').css('width')?.split('px').join('')) ||width
								if(width >= this_width)
									$($(this).children('td')[td_index]).children('div.sheetField').css('width', width+'px')
							})
					})
				})
			}
	})
  var pos_tr:number = (start*n_fields)+n_fields-1
  var $td = $('<td/>', {'class': 'subValue-'+subValueNumber}).appendTo($trs[pos_tr])
  $('<button/>', {'id': 'removeSubValue', 'class': 'btn btn btn-primary'}).html('-').appendTo($td).on("click", removeSubValue)
	var $tds_subValue = $('td.subValue-'+subValueNumber)
  $tds_subValue.children('div.sheetField').each( function(this:HTMLElement){
		if(!$(this).hasClass('date')) {
			$(this).trigger("click")
			return false
		}
	})
  $tds_subValue.children('select').each( function(this: HTMLSelectElement){
		$(this).trigger("change.subValue")
	})
  updateCollumnColors()
	$('.mainPanel').scrollLeft(2000)
}

function removeSubValue(this: HTMLButtonElement){
	var this_number:number = parseInt($(this).parent().attr('class')?.split('-')[1]||'0')
	$('.subValue-'+this_number).remove()
	var $subValueCount = $('#subValueNumber')
	var subValueNumber:number = parseInt($subValueCount.html())
	var start:number = (this_number-1)/5 | 0 //integer
	var $trs = $('#ballon.subValues table tr')
	for(var t: number=this_number+1;t<=subValueNumber;t++){
		$('.subValue-'+t).each( (index:number, td:HTMLElement)=>{
			var pos_tr:number = start*(module.exports.fields.length+1)+index
			$(td).attr('class', 'subValue-'+(t-1)).appendTo($trs[pos_tr])
		})
		if( (t-1) >= 5 && (t-1) % 5 === 0)
			start++
	}
	$subValueCount.html( (subValueNumber-1).toString() )

	if($trs.first().children('td').length === 1)
	  $('#addSubValue').trigger("click")
	$trs.each( function(this:HTMLElement){
		if($(this).children('td').length === 1)
			$(this).remove()
	})
	updateCollumnColors()
}

function updateCollumnColors(){
	$('#ballon.subValues table tr').each( function(this:HTMLElement){
		$(this).children('td').each( (td_index:number, td:HTMLElement)=>{
			if(td_index >= 2 && td_index % 2 === 0)
				$(td).addClass('odd_line')
			else
				$(td).removeClass('odd_line')
		})
	})
}

function updateSubValuesCell(){
	module.exports.subValues = []
	var subValueNumber:number = parseInt($('#subValueNumber').html())
	var sortDateField:null|string = null
	if(subValueNumber > 0){
		for(var t:number=1;t<=subValueNumber;t++){
			var insert:boolean = false
			var this_subValue:any = {}
			$('.subValue-'+t).each( (index:number, td:HTMLElement)=>{
				if(module.exports.fields[index] !== undefined){
					if(module.exports.fields[index].type === 'date' && sortDateField === null)
						sortDateField = module.exports.fields[index].name
					var field_value:string = sheetField.getVal($(td).children('div.sheetField'))
					var number_value:number
					if(module.exports.fields[index].type === 'float' || module.exports.fields[index].type === 'money'){
						number_value = parseFloat(parseFloat(field_value).toFixed(2))
						if(!Number.isFinite(number_value))
							this_subValue[module.exports.fields[index].name] = 0
						else{
							this_subValue[module.exports.fields[index].name] = number_value
							insert = true
						}
					}
					else if(module.exports.fields[index].type === 'integer'){
						number_value = parseInt(field_value)
						if(!Number.isFinite(number_value))
							this_subValue[module.exports.fields[index].name] = 0
						else{
							this_subValue[module.exports.fields[index].name] = number_value
							insert = true
						}
					}
					else if(module.exports.fields[index].type === 'date' || module.exports.fields[index].type === 'select')
						this_subValue[module.exports.fields[index].name] = field_value
					else{
						this_subValue[module.exports.fields[index].name] = field_value
						if(field_value !== '')
							insert = true
					}
				}
			})
			if(insert)
				module.exports.subValues.push(this_subValue)
		}
		if(sortDateField !== null)
			module.exports.subValues.sort( (a:SubValue, b:SubValue) => {
				if(typeof sortDateField === 'string' && typeof a[sortDateField] === 'string' && typeof b[sortDateField] === 'string')
					return (a[sortDateField] < b[sortDateField]) ? -1 : ((a[sortDateField] > b[sortDateField]) ? 1 : 0)
				return 0
			})
		module.exports.onClose()
	}
}