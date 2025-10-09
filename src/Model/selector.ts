const calcField: Calc = require('../Common/calc.js')

interface Selector {
  selectData: (collection: DataSet, join_collection: DataSet|null, selector: SelectorData)=>"emptydata"|DataSet;
}
interface SelectorDB {
  startDate: string;
  endDate: string;
  dataSets: SelectorDataSets[];
  groupByPeriod: GroupByPeriod;
  groupData: GroupByData;
	showTotal?:boolean;
}
interface SelectorDataSets {
	title:string;
	dataID: string;
	showTabs?: string[];
}
interface SelectorData {
  startDate: string;
  endDate: string;
  title: string;
  datePos: number[];
  collection: string;
  showTabs: string[];
  join?: string;
  joinDatePos?: number[];
  connection?: SelectorConnection;
  fields: SelectorField[];
  updateFields: UpdateField[];
  filters: SelectorFilter[];
  mergeTabs: boolean;
  unique: string; //used to combine multiple fields and periods as a unique
  showTotal: boolean;
  fieldOperations: FieldOperations[];
  groupByPeriod: string;
}
interface FieldOperations {
	[opName: string]: FieldOperation;
}
interface FieldOperation {
	field: string|number;
	operator: string;
	field2: string|number;
}
interface SelectorField {
  pos: string;
  name: string;
}
interface UpdateField{
	field: string;
	update: string;
}
interface SelectorConnection {
  field: string;
  field2: string;
}
type SelectorCondiction = 'equal' | 'different' | 'greater' | 'greaterOrEqual' | 'smaller' | 'smallerOrEqual';
interface SelectorFilter {
  field: string;
  condiction: SelectorCondiction;
  value: string|number|Array<string|number>;
}
interface MergedDataTabs {
	[rowName: string]: SheetCell[];
}
interface SolvedOperations {
	row: SheetCell[];
	row_connection: SheetCell[]|null;
}
interface VariableNameFieldSelector {
	varName: string|null;
	field: string;
}
type Operator = "+" | "-" | "/" | "*" | "^"
interface CellOperation {
	[operation: string]: any;
}
interface MergedPositions {
	start:number;
	end:number;
	newpos:number|null;
}
interface DateVars {
	year:number;
	startMonth:number;
	startYear:number;
	endMonth:number;
	endYear:number;
	datePos: number[];
}
interface FieldValues {
	value: number|null;
	varName?:string|null;
	pos?:string|null;
	dataSet?:string;
	field_row?: SheetCell[];
}


module.exports = {
	selectData: (collection: DataSet, join_collection:null|DataSet, selector:SelectorData):string|DataSet=>{
		if(typeof collection !== 'object' || typeof collection.dataSet !== 'object')
			return 'emptydata'
		var years:string[] = Object.keys(collection.dataSet).sort( (a, b)=>{ return parseInt(a)-parseInt(b) })
		var startMonth:number = 1
		var startYear:number = parseInt(years[0])
		var endMonth:number = 12
		var endYear:number = parseInt(years[years.length-1])
		var split:string[] = []
		if(typeof selector.startDate === 'string'){
			split = selector.startDate.split('-')
			if(split.length > 1){
				startMonth = parseInt(split[0])
				startYear = parseInt(split[1])
			}
		}
		if(typeof selector.endDate === 'string'){
			split = selector.endDate.split('-')
			if(split.length > 1){
				endMonth = parseInt(split[0])
				endYear = parseInt(split[1])
			}
		}
		var mergedDataTabs: MergedDataTabs = {}
		var year:number = 0
		var row_connection:SheetCell[]|null = null
		years.forEach( (yearTab:string)=>{
			year = parseInt(yearTab)
			var dateVars:DateVars = {year: year, startMonth: startMonth, startYear: startYear, endMonth: endMonth, endYear: endYear, datePos: selector.datePos}
			if( year < startYear || year > endYear )
				delete collection.dataSet[yearTab]
			else{
				Object.keys(collection.dataSet[yearTab]).forEach( (tab)=>{
					if(Array.isArray(selector.showTabs) && selector.showTabs.indexOf(tab) === -1 && selector.showTabs.indexOf('{all}') === -1)
						delete collection.dataSet[yearTab][tab]
					else{
						var removeRows:number[] = []
						collection.dataSet[yearTab][tab].data.forEach( (row:SheetCell[], index:number)=>{
							row_connection = null
							if(typeof selector.unique === 'string')
								row = getUniqueField(selector.unique, row, null, dateVars, selector.title, tab, selector.fields)
							if(typeof selector.filters === 'object')
								removeRows = filter(selector.filters, removeRows, row, null, index)
							if(removeRows.indexOf(index) === -1){
								if(typeof selector.connection === 'object' && join_collection !== null){
									row_connection = getRowConnection(selector.connection, row, join_collection, year)
									if(row_connection !== null){
										if(typeof selector.unique === 'string')
											row = getUniqueField(selector.unique, row, row_connection, dateVars, selector.title, tab, selector.fields)
										if(typeof selector.joinDatePos === 'object' && row_connection[row_connection.length-1]['datePos'] === undefined)
											row_connection = sliceData(row_connection, selector.joinDatePos, year, startMonth, startYear, endMonth, endYear)
										if(typeof selector.filters === 'object')
											removeRows = filter(selector.filters, removeRows, row, row_connection, index)
										row = updateFields(selector.updateFields, row, row_connection)
									}
								}
							}
							if(removeRows.indexOf(index) === -1){
								if(typeof selector.datePos === 'object' && row[row.length-1]['datePos'] === undefined)
									row = sliceData(row, selector.datePos, year, startMonth, startYear, endMonth, endYear)
								if(typeof selector.fieldOperations === 'object'){
									var obj:SolvedOperations = resolveOperations(selector.fieldOperations, row, row_connection, dateVars)
									row = obj.row
									row_connection = obj.row_connection
								}
								if(typeof selector.mergeTabs === 'boolean' && selector.mergeTabs === true){
									if(selector.unique === 'tabName')
										row[0]['value'] = tab
									if(selector.unique === 'dataSet')
										row[0]['value'] = selector.title
									mergedDataTabs = mergeData(mergedDataTabs, selector.collection, years, dateVars, tab, row, row_connection)
								}
								else if(typeof selector.groupByPeriod === 'string' && selector.groupByPeriod !== '')
									row = groupDataByPeriod(selector.groupByPeriod, row, dateVars, selector.mergeTabs)
							}
							row.forEach( (cell)=>{
								delete cell.mask
								delete cell.cells
							})
						})
						removeRows.sort( (a:number, b:number)=>{ return b-a })
						removeRows.forEach( (index:number)=>{
							collection.dataSet[yearTab][tab].data.splice(index, 1)
						})
						if(collection.dataSet[yearTab][tab].data.length === 0 || (Object.keys(mergedDataTabs).length > 0))
							delete collection.dataSet[yearTab][tab]
					}
				})
				if(year === endYear && typeof selector.mergeTabs === 'boolean' && selector.mergeTabs === true){
					var myData:Array<SheetCell[]> = []
					var rowTotal: SheetCell[] = [{value: 'total'}]
					Object.keys(mergedDataTabs).forEach( (row:string)=>{
		        if(typeof selector.groupByPeriod === 'string' && selector.groupByPeriod !== '')
		          mergedDataTabs[row] = groupDataByPeriod(selector.groupByPeriod, mergedDataTabs[row], dateVars, selector.mergeTabs)
						if(selector.showTotal)
							mergedDataTabs[row].forEach( (cell:SheetCell, i:number)=>{
								if(typeof rowTotal[i] === 'undefined')
									rowTotal[i] = {}
								var cell_value = getValue(cell)
								var cellTotal:SheetCell = rowTotal[i]
								if(typeof cell_value === 'number')
									if(typeof cellTotal.value === 'number')
										cellTotal.value += cell_value
									else
										cellTotal.value = cell_value
								if(cell.language)
									if(!cellTotal.language)
										cellTotal.language = cell.language
									else if(cell.language !== cellTotal.language)
										cellTotal.language = ''
							})
						myData.push(mergedDataTabs[row])
					})
					if(selector.showTotal && myData.length > 0){
						rowTotal[rowTotal.length-1].total = true
						myData.push(rowTotal)
					}
					collection.dataSet[yearTab]['!mergedData'] = {data: myData, tabNumber: -1}
					//delete mergedDataTabs
				}
				if(Object.keys(collection.dataSet[yearTab]).length === 0)
					delete collection.dataSet[yearTab]
			}
		})
		return collection
	}
}

function getRowConnection(connection:SelectorConnection, row:SheetCell[], join_collection:DataSet, year:number):SheetCell[]|null{
	var row_connection:SheetCell[]|null = null
	if(connection.field !== undefined && connection.field2 !== undefined){
		var value1:null|string = null
		var value2:null|string = null
		var field:string[] = connection.field.split('.')
		if(field.length > 1){
			if(field[0] === 'collection'){
				if(Number.isFinite(parseInt(field[1])))
					value1 = row[parseInt(field[1])].value?.toString()||''
				else if(field[1] === '_id')
					value1 = row[row.length-1]._id?.toString()||''
			}
			var field2:string[] = connection.field2.split('.')
			if(field2.length > 1){
				if(field2[0] === 'collection'){
					if(Number.isFinite(parseInt(field2[1])))
						value2 = row[parseInt(field2[1])].value?.toString()||''
					else if(field2[1] === '_id')
						value2 = row[row.length-1]._id?.toString()||''
				}
				if(field[0] === 'join' || field2[0] === 'join'){
					if(typeof join_collection === 'object' && typeof join_collection.dataSet === 'object' && join_collection.dataSet[year] !== undefined){
						Object.keys(join_collection.dataSet[year]).forEach( (tab_join)=>{
							join_collection.dataSet[year][tab_join].data.forEach( (row_join)=>{
								if(field[0] === 'join'){
									if(Number.isFinite(parseInt(field[1])))
										value1 = row_join[parseInt(field[1])]?.value?.toString()||''
									else if(field[1] === '_id')
										value1 = row_join[row_join.length-1]._id?.toString()||''
									else if(typeof field[1] === 'string')
										value1 = row_join[row_join.length-1][field[1]]?.toString()||''
								}
								if(field2[0] === 'join'){
									var pos = field2[1]
									if(Number.isFinite(parseInt(pos)))
										value2 = row_join[parseInt(pos)]?.value?.toString()||''
									else if(pos === '_id')
										value2 = row_join[row_join.length-1]._id?.toString()||''
									else if(typeof pos === 'string')
										value2 = row_join[row_join.length-1][pos]?.toString()||''
									//console.log(row_join[row_join.length-1])
								}
								if(value1 !== null && value1 !== '' && value2 !== null && value2 !== '' && value1 === value2)
									row_connection = row_join
							})
						})
					}
				}
			}
		}
	}
	return row_connection
}

function applyFilter(field:string|number, condiction:string, value:string|number):boolean{
	if(Number.isFinite(parseFloat(value.toString())))
		value = parseFloat(value.toString())
	if(Number.isFinite(parseFloat(field.toString())))
		field = parseFloat(field.toString())
	if(condiction === 'equal')
		if(field === value)
			return true
	if(condiction === 'different')
		if(field !== value)
			return true
	if(typeof field === 'number' && typeof value === 'number'){
		if(condiction === 'greater')
			if(field > value)
				return true
		if(condiction === 'greaterOrEqual')
			if(field >= value)
				return true
		if(condiction === 'smaller')
			if(field < value)
				return true
		if(condiction === 'smallerOrEqual')
			if(field <= value)
				return true
	}else if(condiction === 'greater' || condiction === 'greaterOrEqual' || condiction === 'smaller' || condiction === 'smallerOrEqual')
		return true
	return false
}

function filter(filters: SelectorFilter[], removeRows: number[], row: SheetCell[], row_connection:SheetCell[]|null, index:number){
	filters.forEach( (filter: SelectorFilter)=>{
		if(filter.field !== undefined){
			var array:string[] = filter.field.split('.')
			if(array.length > 1){
				var field:string = array[1]
				var thisRow:SheetCell[] = []
				if(array[0] === 'collection')
					thisRow = row
				else if(array[0] === 'join' && row_connection !== null)
					thisRow = row_connection
				else
					return
				var value:string = ''
				if(Number.isFinite(parseInt(field)))
					value = thisRow[parseInt(field)]?.value?.toString()||''
				else if(typeof field === 'string')
					value = thisRow[thisRow.length-1][field]?.toString()||''

				if(filter.condiction !== undefined && filter.value !== undefined){
					if(typeof filter.value === 'string' || typeof filter.value === 'number'){
						if(!applyFilter(value, filter.condiction, filter.value))
							removeRows.push(index)
					}else if(typeof filter.value === 'object' && filter.condiction === 'equal' || filter.condiction === 'different'){
						var accept:boolean = false
						if(filter.condiction === 'different')
							accept = true
						filter.value.forEach( (val:string|number)=>{
							if(applyFilter(value, filter.condiction, val)){
								if(filter.condiction !== 'different')
									accept = true
							}else if(filter.condiction === 'different')
								accept = false
						})
						if(!accept)
							removeRows.push(index)
					}
				}else if(typeof filter.value === 'number')
					if(!applyFilter(value, filter.condiction, filter.value))
						removeRows.push(index)
			}
		}
	})
	return removeRows
}

function getSelectorFields(fields:SelectorField[], row: SheetCell[], row_connection:SheetCell[]|null){
	fields.forEach( (connection_field:SelectorField)=>{
		var pos:string = connection_field.pos||''
		var name:string = connection_field.name||''
		var split:string[] = pos.split('.')
		if(split.length === 2 && name !== ''){
			if(split[0] === 'join' && row_connection !== null && (row_connection[row_connection.length-1][name] === undefined || row_connection[row_connection.length-1][name] === '')){
				var join_pos:number = parseInt(split[1])
				if(Number.isFinite(join_pos)){
					var value:string = ''
					if(row_connection[join_pos] !== undefined && row_connection[join_pos].value !== undefined)
						value = row_connection[join_pos].value?.toString()||''
					row_connection[row_connection.length-1][name] = value
				}
			}else if(split[0] === 'collection' && (row[row.length-1][name] === undefined || row[row.length-1][name] === '')){
				var collection_pos:number = parseInt(split[1])
				if(Number.isFinite(collection_pos)){
					var value:string = ''
					if(row[collection_pos] !== undefined && row[collection_pos].value !== undefined)
						value = row[collection_pos].value?.toString()||''
					row[row.length-1][name] = value
				}
			}
			//console.log(connection_field)
			//console.log(value)
		}
	})
}

function getUniqueField(unique:string, row:SheetCell[], row_connection:SheetCell[]|null, dateVars:DateVars, title:string, tab:string, fields:SelectorField[]){
	if(Array.isArray(fields))
		getSelectorFields(fields, row, row_connection)
	if(unique === '')
		unique = 'year:tabName:collection._id'
	var split_fields:string[] = unique.split(':')
	var uniqueFields:string[] = []
	split_fields.forEach( (field:string, f:number)=>{
		var split:string[] = field.split('.')
		if(split.length > 1){
			if(split[0] === 'collection'){
				var pos_collection:string = split[1]
				if(Number.isFinite(parseInt(pos_collection)) && row[parseInt(pos_collection)] !== undefined && row[parseInt(pos_collection)].value !== undefined)
						uniqueFields.push(row[parseInt(pos_collection)].value?.toString()||'')
				else if(typeof pos_collection === 'string' && typeof row[row.length-1][pos_collection] === 'string')
						uniqueFields.push(row[row.length-1][pos_collection])
				else if(split[1] === '_id')
					uniqueFields.push(row[row.length-1]._id||'')
			}else if(split[0] === 'join' && row_connection !== null){
				var pos_join:string = split[1]
				if(Number.isFinite(parseInt(pos_join)) && row_connection[parseInt(pos_join)] !== undefined && row_connection[parseInt(pos_join)].value !== undefined)
						uniqueFields.push(row_connection[parseInt(pos_join)].value?.toString()||'')
				else if(typeof pos_join === 'string' && typeof row_connection[row_connection.length-1][pos_join] === 'string')
						uniqueFields.push(row_connection[row_connection.length-1][pos_join])
				else if(split[1] === '_id')
					uniqueFields.push(row_connection[row_connection.length-1]._id||'')
			}
		}
		if(field === 'tabName'){
			uniqueFields.push(tab)
			if(row_connection !== null)
				if(row_connection[row_connection.length-1]['!tabs'] === undefined)
					row_connection[row_connection.length-1]['!tabs'] = [tab]
				else
					row_connection[row_connection.length-1]['!tabs'].push(tab)
		}
		else if(field === 'year')
			uniqueFields.push(dateVars.year.toString())
		else if(field === 'dataSet')
			uniqueFields.push(title)
	})
	var uniqueField:string = ''
	uniqueFields.forEach( (field)=>{
		if(uniqueField === '')
			uniqueField = field
		else
			uniqueField += ':'+field
	})
	row[row.length-1].uniqueField = uniqueField
	return row
}

function updateFields(updateFields:UpdateField[], row:SheetCell[], row_connection:SheetCell[]|null):SheetCell[]{
	if(Array.isArray(updateFields)){
		updateFields.forEach( (field:UpdateField)=>{
			if(typeof field.field === 'string' && typeof field.update === 'string'){
				var split:string[] = field.field.split('.')
				var col:number = -1
				if(split.length === 2 && split[0] === 'collection' && Number.isFinite(parseInt(split[1]))){
					var pos:number = parseInt(split[1])
					if(typeof row[pos] === 'object'){
						var split2:string[] = field.update.split('.')
						if(split2.length === 2 && split2[0] === 'join'){
							var name:string = split2[1]
							if(row_connection !== null && row_connection[row_connection.length-1][name] !== undefined)
								row[pos].value = row_connection[row_connection.length-1][name]
						}
					}
				}
			}
		})
	}
	return row
}

function sliceData(this_row:SheetCell[], datePos:number[], year:number, startMonth:number, startYear:number, endMonth:number, endYear:number):SheetCell[]{
	var first_cell:SheetCell = this_row[0]
	var row_config:SheetCell = structuredClone(this_row[this_row.length-1])
	row_config['datePos'] = true
	this_row.splice(datePos[1])
	this_row.splice(0, datePos[0])
	if(year === endYear)
		this_row.splice(endMonth)
	if(year === startYear)
		this_row.splice(0, startMonth-1)
	this_row.unshift(first_cell)
	this_row.push(row_config)
	return this_row
}

function getValue(cell:SheetCell, varName?:string|null, year?:number):null|number{
	var value:any = null
	if(cell === undefined)
		return value
	if(varName !== null && varName !== undefined){
		var svsplit = varName.split('.')
		if(year !== undefined){
			if(svsplit[0] === 'operations')
				if(cell['operations'] !== undefined && cell['operations']['!year-'+year] !== undefined)
					svsplit.splice(1, 0, '!year-'+year)
		}
		svsplit.forEach( (subCellName)=>{
			if(value !== null && value !== undefined){
				if(value[subCellName] !== undefined)
					value = value[subCellName]
			}else if(cell[subCellName] !== undefined){
				value = cell[subCellName]
			}
		})
		if(typeof value === 'string' && value.length > 0 && value[0] === '='){
			value = parseFloat(calcField.calc(value))
			if(!Number.isFinite(value))
				value = null
		}
		else if(Number.isFinite(parseFloat(cell.value?.toString()||'')))
			value = parseFloat(value)
		else if(typeof value === 'object')
			value = null
	}else if(cell !== undefined && cell.value !== undefined){
		if(Number.isFinite(cell.value))
			value = cell.value
		else if(typeof cell.value === 'string' && cell.value.length > 0 && cell.value[0] === '='){
			value = parseFloat(calcField.calc(cell.value))
			if(!Number.isFinite(value))
				value = null
		}
	}
	return value
}

function getVariableName(field:string):VariableNameFieldSelector{
	var name = null
	if(typeof field === 'string'){
		var split = field.split('[')
		if(split.length > 1)
			name = split[1].split(']')[0]
		if(name !== null)
			field = field.replace('['+name+']', '')
	}
	return {'varName': name, 'field': field}
}

function getFirstOrLastField(field_row: SheetCell[], pos:string, varName:string|null, dateVars:DateVars, not_null?:boolean):number|null{
	var start:number = dateVars.datePos[0]
	var end:number = dateVars.datePos[1]
	var value:number|null = null
	if(not_null){
		if(pos === 'first'){
			if(dateVars.year === dateVars.startYear)
				end = end-dateVars.startMonth+1
			if(dateVars.year === dateVars.endYear)
				end = dateVars.endMonth
			for(var i:number=start;i<=end;i++){
				value = getValue(field_row[i], varName)
				if(value !== null)
					break
			}
		}else if(pos === 'last'){
			start = dateVars.datePos[1]
			end = dateVars.datePos[0]
			if(dateVars.year === dateVars.startYear)
				start = start-dateVars.startMonth+1
			if(dateVars.year === dateVars.endYear)
				start = dateVars.endMonth
			for(var i=start;i>=end;i--){
				value = getValue(field_row[i], varName)
				if(value !== null)
					break
			}
		}
	}else{
		var index:number = -1
		if(pos === 'first'){
			index = start
		}else if(pos === 'last'){
			index = end
			if(dateVars.year === dateVars.endYear)
				index = dateVars.endMonth
		}
		value = getValue(field_row[index], varName)
	}
	return value
}

function getFieldValues(opField:string|number, row:SheetCell[], row_connection:SheetCell[]|null, dateVars:DateVars):FieldValues{
	if(typeof opField === 'number' || Number.isFinite(parseFloat(opField)))
		return {value: parseFloat(opField.toString())}
	var value:null|number = null
	var pos:null|string = null
	var varName:string|null = null
	var field:string = ''
	var field_row:SheetCell[] = []
	var split:string[] = []
	if(typeof opField === 'string'){
		split = opField.split('[')
		if(split.length > 1)
			varName = split[1].split(']')[0]
		if(varName !== null)
			field = opField.replace('['+varName+']', '')
		else
			field = opField
		split = field.split('.')
		if(split.length > 1){
			field = split[0]
			pos = split[1]
			if(field === 'collection')
			 	field_row = row
			else if(field === 'join' && row_connection !== null)
				field_row = row_connection
			if(field_row.length > 0){
				if(varName !== null && (field === 'collection' || field === 'join') )
					value = getValue(row[row.length-1], varName)
				else {
					if(Number.isFinite(parseInt(pos)))
						value = getValue(field_row[parseInt(pos)], varName)
					else if(pos === 'first' || pos === 'last'){
						var not_null:boolean = false
						if(split.length > 2 && split[2] === 'notnull')
							not_null = true
						value = getFirstOrLastField(field_row, pos, varName, dateVars, not_null)
					}
				}
			}
		}
	}
	return {value: value, varName: varName, pos: pos, dataSet: field, field_row: field_row}
}

function applyOperator(value1:number|null, operator:Operator, value2:number|null, opName:string, cell:SheetCell, year?:number):SheetCell{
	var result:number|null = null
	if(typeof operator === 'string' && value1 !== null && value2 !== null){
		if(Number.isFinite(value1) && Number.isFinite(value2)){
			//console.log('value '+value1+operator+' value2 '+value2)
			if(operator === '+')
				result = value1+value2
			else if(operator === '-')
				result = value1-value2
			else if(operator === '*')
				result = value1*value2
			else if(operator === '/' && value2 !== 0)
				result = value1/value2
			else if(operator === '^'){
				result = value1
				for(var e=1;e<=value2-1;e++)
					result *= value1
			}
		}
	}
	if(result !== null && cell !== undefined){
		if(cell.operations === undefined)
			cell.operations = {}
		if(year !== undefined){
			if(cell.operations['!year-'+year] === undefined)
				cell.operations['!year-'+year] = {}
			cell.operations['!year-'+year][opName] = result
		}else
			cell.operations[opName] = result
	}
	return cell
}

function resolveOperations(fieldOperations:FieldOperations[], row:SheetCell[], row_connection:SheetCell[]|null, dateVars:DateVars):SolvedOperations{
	fieldOperations.forEach( (op:FieldOperations)=>{
		var opName:string = Object.keys(op)[0]
		var operation:FieldOperation = op[opName]
		if(typeof operation.operator === 'string' && (operation.operator === '*' || operation.operator === '/' || operation.operator === '+' || operation.operator === '-' || operation.operator === '^')){
			var field1:FieldValues = getFieldValues(operation.field, row, row_connection, dateVars)
			var field2:FieldValues = getFieldValues(operation.field2, row, row_connection, dateVars)
			var row_result:SheetCell[] = row
			if(field1.dataSet === 'join' && field2.dataSet === 'join' && row_connection !== null)
				row_result = row_connection
			if(field1.value !== null && field2.value !== null)
				applyOperator(field1.value, operation.operator, field2.value, opName, row_result[row_result.length-1])
			else{
				if( field1.pos === '*' && (field1.dataSet === 'collection' || field1.dataSet === 'join') ){
					if(Array.isArray(field1.field_row))
					for(var i:number=0;i<=field1.field_row.length-1;i++){
						field1.value = getValue(field1.field_row[i], field1.varName)
						if(field2.pos === '*' && Array.isArray(field2.field_row))
							field2.value = getValue(field2.field_row[i], field2.varName)
						if(field1.value !== null && field2.value !== null)
							applyOperator(field1.value, operation.operator, field2.value, opName, row_result[i])
					}
				}else if(field1.value !== null && field2.pos === '*' && (field2.dataSet === 'collection' || field2.dataSet === 'join') && Array.isArray(field2.field_row)){
					for(var i:number=0;i<=field2.field_row.length-1;i++){
						field2.value = getValue(field2.field_row[i], field2.varName)
						if(field1.value !== null && field2.value !== null)
							applyOperator(field1.value, operation.operator, field2.value, opName, row_result[i])
					}
				}
			}
		}
	})
	return {'row': row, 'row_connection': row_connection}
}

function mergeValues(this_cell:SheetCell, this_mergeCell:SheetCell):SheetCell{
	var value = getValue(this_cell)
	if(typeof value === 'number')
		this_cell.value = value
	Object.keys(this_cell).forEach( (field:string)=>{
		var split:string[] = field.split('-')
		var stat:boolean = false
		if(split.length > 1){
			if(split[1] === 'calc' || split[1] === 'count' || split[1] === 'average')
				var stat = true
		}
		if(field !== '_id' && stat === false)
			if(Number.isFinite(parseFloat(this_cell[field]))){
				this_cell[field] = parseFloat(this_cell[field])
				if(this_mergeCell[field] === undefined){
					this_mergeCell[field] = this_cell[field]
					//this_mergeCell[field+'-calc'] = this_cell[field]
				}else{
					this_mergeCell[field] += this_cell[field]
					//this_mergeCell[field+'-calc'] += '+'+this_cell[field]
				}
				if(this_mergeCell[field+'-count'] === undefined){
					if(typeof this_cell[field+'-count'] === 'number')
						this_mergeCell[field+'-count'] = this_cell[field+'-count']
					else
						this_mergeCell[field+'-count'] = 1
				}
				else{
					if(typeof this_cell[field+'-count'] === 'number')
						this_mergeCell[field+'-count'] += this_cell[field+'-count']
					else
						this_mergeCell[field+'-count']++
				}
				this_mergeCell[field+'-average'] = this_mergeCell[field]/this_mergeCell[field+'-count']
			}else if(typeof this_cell[field] === 'object' && this_cell[field] !== null){
				if(this_mergeCell[field] === undefined)
					this_mergeCell[field] = {}
				Object.keys(this_cell[field]).forEach( (subField:string)=>{
					var split:string[] = subField.split('-')
					var stat:boolean = false
					if(split.length > 1){
						if(split[1] === 'calc' || split[1] === 'count' || split[1] === 'average')
						stat = true
					}
					if(stat === false){
						this_cell[field][subField] = parseFloat(this_cell[field][subField])
						if(Number.isFinite(this_cell[field][subField])){
							if(this_mergeCell[field][subField] === undefined){
								this_mergeCell[field][subField] = this_cell[field][subField]
								//this_mergeCell[field][subField+'-calc'] = this_cell[field][subField]
							}else{
								this_mergeCell[field][subField] += this_cell[field][subField]
								//this_mergeCell[field][subField+'-calc'] += '+'+this_cell[field][subField]
							}
							if(this_mergeCell[field][subField+'-count'] === undefined){
								if(typeof this_cell[field][subField+'-count'] === 'number')
									this_mergeCell[field][subField+'-count'] = this_cell[field][subField+'-count']
								else
									this_mergeCell[field][subField+'-count'] = 1
							}
							else{
								if(typeof this_cell[field][subField+'-count'] === 'number')
									this_mergeCell[field][subField+'-count'] += this_cell[field][subField+'-count']
								else
									this_mergeCell[field][subField+'-count']++
							}
							this_mergeCell[field][subField+'-average'] = this_mergeCell[field][subField]/this_mergeCell[field][subField+'-count']
						}
					}
				})
			}
	})
	return this_mergeCell
}

function mergeData(mergedDataTabs:MergedDataTabs, collection:string, years:string[], dateVars:DateVars, tab:string, row:SheetCell[], row_connection:SheetCell[]|null):MergedDataTabs{
	var uniqueField:string = row[row.length-1].uniqueField || ''
	if(uniqueField !== ''){
		if(mergedDataTabs[uniqueField] === undefined){
			mergedDataTabs[uniqueField] = []
			var cells:number = (13-dateVars.startMonth)+(12*(dateVars.endYear-dateVars.startYear))-(12-dateVars.endMonth)
			mergedDataTabs[uniqueField][0] = row[0]
			for(var c:number=1;c<=cells;c++)
				mergedDataTabs[uniqueField][c] = {}//{cells: {join:[], periodJoin: []}}
			mergedDataTabs[uniqueField].push(row[row.length-1])
		}
		mergedDataTabs[uniqueField][0].value = row[0].value
		mergedDataTabs[uniqueField][mergedDataTabs[uniqueField].length-1] = row[row.length-1]
		if(dateVars.year !== dateVars.endYear)
			row.splice(row.length-1, 1)

		row.forEach( (cell:SheetCell, this_index:number)=>{
			if(this_index < row.length-1){
				var mergeCell:number = this_index
				if(dateVars.year > dateVars.startYear)
					mergeCell += (13-dateVars.startMonth)+(12*(dateVars.year-dateVars.startYear-1))
				if(mergedDataTabs[uniqueField][mergeCell] === undefined)
					mergedDataTabs[uniqueField][mergeCell] = cell
				else
					mergedDataTabs[uniqueField][mergeCell] = mergeValues(cell, mergedDataTabs[uniqueField][mergeCell])
			}
		})
	}
	return mergedDataTabs
}

function getMergedPositions(dateVars:DateVars, thisPos:number):MergedPositions{
	var n_months_first_year:number = 13-dateVars.startMonth
	var n_months_last_year:number = dateVars.endMonth
	var newpos:number|null = null
	var start:number = 1
	var end:number = 12
	if(dateVars.startYear === dateVars.endYear){
		start = 1
		end = dateVars.endMonth-dateVars.startMonth+1
		newpos = thisPos
	}else if(dateVars.year === dateVars.startYear){
		start = 1
		//if(thisPos >= startMonth)
			newpos = thisPos-(12-n_months_first_year)
		end = n_months_first_year
	}else{
		start = n_months_first_year
		if(dateVars.year > dateVars.startYear)
			start += ((dateVars.year-dateVars.startYear-1)*12)
		if(dateVars.year === dateVars.endYear){
			end = start+n_months_last_year
			if(thisPos <= n_months_last_year)
				newpos = start+thisPos
		}else{
			newpos = start+thisPos
			end = start+12
		}
		start++
	}
	//console.log('newpos: '+newpos+', thisPos: '+thisPos+', startMonth: '+startMonth)
	if(newpos !== null && (newpos > end || newpos < start))
		newpos = null

	return {'start': start, 'end': end, 'newpos': newpos}
}

function groupDataByPeriod(groupByPeriod: string, row:SheetCell[], dateVars:DateVars, mergeTabs:boolean):SheetCell[]{
	var positions:Array<number[]> = []
	if(groupByPeriod === 'bimester')
		positions = [ [1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12] ]
	else if(groupByPeriod === 'quarter')
		positions = [ [1, 3], [4, 6], [7, 9], [10, 12] ]
	else if(groupByPeriod === 'semester')
		positions = [ [1, 6], [7, 12] ]
	else if(groupByPeriod === 'year')
		positions = [ [1, 12] ]
	var rowData:SheetCell[] = []
	if(mergeTabs !== undefined && mergeTabs){
		for(var this_year:number=dateVars.startYear;this_year<=dateVars.endYear;this_year++){
			dateVars.year = this_year
			positions.forEach( (datePos:number[])=>{
				var posData:SheetCell|null = null
				for(var this_index:number=datePos[0];this_index<=datePos[1];this_index++){
					var obj:MergedPositions = getMergedPositions(dateVars, this_index)
					if(obj.newpos !== null){
						if(posData === null)
							posData = row[obj.newpos]
						else
							posData = mergeValues(row[obj.newpos], posData)
					}
				}
				if(posData !== null)
					rowData.push(posData)
			})
		}
	}else
		positions.forEach( (datePos:number[])=>{
			var posData:SheetCell|null = null
			for(var this_index=datePos[0];this_index<=datePos[1];this_index++){
				var accept = true
				var new_index = this_index
				if(dateVars.year === dateVars.startYear && this_index < dateVars.startMonth)
					accept = false
				else if(dateVars.year === dateVars.startYear && this_index >= dateVars.startMonth)
					new_index = (this_index-dateVars.startMonth)+1
				else if(dateVars.year === dateVars.endYear && this_index > dateVars.endMonth)
					accept = false
				if(row[new_index] !== undefined && accept === true){
					if(posData === null)
						posData = {}
					posData = mergeValues(row[new_index], posData)
				}
			}
			if(posData !== null)
				rowData.push(posData)
		})
	var row_config = row[row.length-1]
	row.splice(1, row.length-1)
	rowData.forEach( (posData)=>{
		row.push(posData)
	})
	row.push(row_config)
	return row
}
