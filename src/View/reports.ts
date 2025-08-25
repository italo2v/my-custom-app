// TODO:
// verificar o tipo de moeda

//import {ChartData} from "chart.js";

const { Chart } = require('chart.js/auto')
const html2canvas = require("html2canvas")
const imgToPDF = require('image-to-pdf')
const { createWriteStream } = require('fs')
//const { alertBox }: UI = require('./ITEMS/UI.js')
const mySheet: Sheet = require('./ITEMS/sheet.js')
const reportData: ConfigReport = require('../DataConfig/reportData.js')
//@ts-ignore
const { createField }: SheetField = require('./ITEMS/sheetField.js')
var mousePosX = 0
var mousePosY = 0

interface ConfigReport{
	[reportid: string]: ReportObjects;
}

interface Reports {
	yearTabs: any;
	backgroundColors: string[],
	showReport: (reportID: string)=>void,
	updatePrintImage: ()=>void
}
interface GroupsPeriod {
	bimester: GroupsPeriodItem[];
	quarter: GroupsPeriodItem[];
	semester: GroupsPeriodItem[];
}
type GroupByPeriod = "" | "year" | "bimester" | "quarter" | "semester"
type GroupByData = "" | "firstValue" | "tabs" | "dataSets"
interface GroupsPeriodItem {
	text: string;
	pos: number[];
}
type ChartJSDataSets = Array<ChartJSDataSet>
interface ChartJSDataSet {
	backgroundColor?: string[] | string;
	data: Array<number|null>;
	label?: string;
	hidden?: boolean;
	fill?: string;
	borderColor?: string;
}
interface ChartJS{
	type: string;
	data: ChartJSData;
	options: CharJSOptions;
}
interface CharJSOptions {
	animation?: any;
	plugins?: any;
}
interface ChartJSData{
	labels: string[];
	datasets: ChartJSDataSet[];
}
interface ReportTableRow {
	title?: boolean;
	tab?: string;
	data: ReportTableData[];
}
interface ReportTableData {
	value: string | number;
	type?: FieldType;
	language?: string;
}
type ReportType = "bar" | "line" | "doughnut" | "pie" | "table" | "sheet"
interface ReportObjects {
	title: string;
	showSelectors: string[];
	selectorDataSets: SelectorDB;
	type: ReportType;
	registerTitle?: string;
	dataOperations?: string;
	period?: {startDate:string, endDate:string};
	previewValues?: PreviewValues[];
}

interface PreviewValues {
	opName:string;
	variable: string;
	title: string;
	icon_explanation: string;
}

module.exports = {
	yearsTabs: {},
	backgroundColors: ['#87cefa', '#90ee90', '#fbab60', '#ffd700', '#dcdcdc', '#dda0dd', '#ffff66', '#fa8072', '#d2691e', '#b9f2ff'],
  showReport: (reportID: string)=>{
		var $reportPanel = $('<div>', {'id': 'reportPanel', 'class': 'panel mainPanel'}).appendTo($body)
		let height: number = ( ($(window).height()||500)-100)
		$('.mainPanel').attr('style', 'height:'+height+'px')
		$('<div>', {'id': 'selectors'}).appendTo($reportPanel)
		var $printImage = $('<div/>', {'id': 'printImage'}).appendTo($reportPanel)
		$('<div>', {'id': 'reportTitle', 'class': 'title'}).appendTo($printImage)
  	$('<div>', {'id': 'reportArea'}).appendTo($printImage)

  	var reportsID:string[] = Object.keys(reportData)
  	if(reportsID.indexOf(reportID) === -1){
  		alertBox(dataLanguage('unregisteredreport'))
  		$('#reportPanel').remove()
  	}

  	var reportIDs: string[] = Object.keys(reportData)
  	reportIDs.forEach( (report:string)=>{
  		if(report === reportID){
		  	var thisReport = JSON.parse(JSON.stringify(reportData[reportID]))
		  	thisReport.selectorDataSets.dataSets.forEach( (dataSet:SelectorDataSets)=>{
		  		dataSet.title = dataLanguage(dataSet.title)
		  	})
  			showReportObjects(thisReport)
  		}
  	})
  },
  updatePrintImage: ()=>{
    var $printImage = $('#printImage').removeAttr('style')
		var $tableSheet = $('table#sheet')
		var $graph = $('#graph')
		var $downloadLink = $('#mainMenu a.downloadLink')
    if($tableSheet.length > 0)
		$printImage.css('width', ($tableSheet.width()||0)+25+'px')
    else if($graph.length > 0)
		$printImage.css('width', ($graph.width()||0)+10+'px')
    else if($('table.reportTable').length > 0)
		$printImage.css('width', ($('table.reportTable').width()||0)+25+'px')
    if($downloadLink.length > 0)
    	showDownload($downloadLink.attr('download')?.replace('.pdf', '')||'', $downloadLink.attr('orientation')||'landscape')
  }
}

$(window).on("resize", () => {
  var $mainPanel = $('.mainPanel')
  $('#graph').css({'width': ($mainPanel.width()||500)-40+'px', 'height': ($mainPanel.height()||500)-($('#selectors').height()||0)-($('#reportTitle').height()||0)-50+'px'})
})

$body.on("mousemove", function(e) {
  mousePosX = e.clientX
  mousePosY = e.clientY
})

function showReportObjects(report:ReportObjects){
	get('get-reportyearstabs', report.selectorDataSets.dataSets, (data:any)=>{
		if(Object.keys(data).length === 0){
			alertBox(dataLanguage('emptydata'))
			return
		}
		if(typeof data === 'object')
			module.exports.yearsTabs = data
		var selectedData: DataSet = {dataSet:{}}
		createSelectors(report, undefined, (stack?:{value: boolean})=>{
			if(report.showSelectors.indexOf('year') !== -1)
				report.title = dataLanguage(report.title)+' ('+($('#selectYear').val()?.toString()||'')+')'
			else
				report.title = dataLanguage(report.title)
			$('#reportTitle.title').html(report.title)
			var $startMonth = $('#startMonth')
			var $endMonth = $("#endMonth")
			var $selectYear = $('#selectYear')
			var actualyear = new Date().getFullYear()
			var actualmonth = new Date().getMonth()+1
			var startMonth:number=1, startYear: number=actualyear, endMonth: number=12, endYear: number=actualyear, startDate:string='', endDate:string=''

			if(report.period){
				updatePeriod(report.period, report.selectorDataSets)
				startMonth = parseInt(report.selectorDataSets.startDate.split('-')[0])
				startYear = parseInt(report.selectorDataSets.startDate.split('-')[1])
				endMonth = parseInt(report.selectorDataSets.endDate.split('-')[0])
				endYear = parseInt(report.selectorDataSets.endDate.split('-')[1])
			}else{
				if($selectYear.length > 0){
					var year:number = parseInt($selectYear.val()?.toString() as string)||actualyear
					if(year === actualyear)
						endMonth = actualmonth
					startYear = year
					endYear = year
				}else if($startMonth.length > 0 && $endMonth.length > 0){
					if(typeof $startMonth.val() === 'string') {
						startMonth = parseInt( ($startMonth.val() as string).split('-')[0])
						startYear = parseInt( ($startMonth.val() as string).split('-')[1])
					}else{
						startMonth = 1
						startYear = actualyear
					}
					$startMonth.val(startMonth+'-'+startYear)
					if(typeof $endMonth.val() === 'string') {
						endMonth = parseInt( ($endMonth.val() as string).split('-')[0])
						endYear = parseInt( ($endMonth.val() as string).split('-')[1])
					}else{
						endMonth = new Date().getMonth()+1
						endYear = actualyear
					}
					$endMonth.val(endMonth+'-'+endYear)
				}else
					endMonth = actualmonth
			}
			report.selectorDataSets.startDate = startMonth+'-'+startYear
			report.selectorDataSets.endDate = endMonth+'-'+endYear
			report.selectorDataSets.groupByPeriod = $('#selectGroupPeriod').val()?.toString() as GroupByPeriod ||''
			report.selectorDataSets.groupData = $('#selectGroupData').val()?.toString() as GroupByData||report.selectorDataSets.groupData
			report.selectorDataSets.dataSets.forEach( (dataSet:SelectorDataSets)=>{
				var $dataSet = $('#tabSelectors input[data-type="dataset"][value="'+dataSet.title+'"]')
				if($dataSet.length > 0)
					dataSet.showTabs = []
				if($dataSet.prop('checked')){
					$('#tabSelectors span.label[title="'+dataSet.title+'"] input[data-type="tab"]').each( (i, input:HTMLElement)=>{
						if($(input).prop('checked')){
							let $inputVal:string = $(input).val()?.toString() || ''
							if(dataSet.showTabs)
								dataSet.showTabs.push($inputVal)
						}
					})
				}
			})
			var $inputTotal = $('span.label.total input[data-type="total"]')
			if($inputTotal.length > 0){
				report.selectorDataSets.showTotal = false
				if($inputTotal.prop('checked'))
					report.selectorDataSets.showTotal = true
			}
			var updateReport = function(data: DataSet){
				selectedData = data
				if(data.dataSet && Object.keys(data.dataSet).length > 0){
					var yearDS:string = Object.keys(data.dataSet).at(-1)||new Date().getFullYear().toString()
					var tabDS:string = Object.keys(data.dataSet[yearDS]).at(-1)||'!merged'
					if(Object.keys(data.dataSet[yearDS]).length > 0 && data.dataSet[yearDS][tabDS] && Array.isArray(data.dataSet[yearDS][tabDS].data) && data.dataSet[yearDS][tabDS].data.length > 0){
						var sheetData = data.dataSet[yearDS][tabDS].data

						if(typeof report.dataOperations === 'string'){
							var dataOperations:any = (window as any)[report.dataOperations]
							if(typeof (window as any)[report.dataOperations] === 'function')
								sheetData = (window as any)[report.dataOperations](sheetData)
						}

						var labels:string[] = []
						if(report.type !== 'doughnut' && report.type !== 'pie'){
							var months: string[] = [ dataLanguage('jan'), dataLanguage('feb'), dataLanguage('mar'), dataLanguage('apr'), dataLanguage('may'), dataLanguage('jun'),
						  												dataLanguage('jul'), dataLanguage('aug'), dataLanguage('sep'), dataLanguage('oct'), dataLanguage('nov'), dataLanguage('dec') ]
						  var groupsPeriod: GroupsPeriod = {
								bimester: [ {text: 'bimester1', pos: [1, 2]}, {text: 'bimester2', pos: [3, 4]}, {text: 'bimester3', pos: [5, 6]},
									{text: 'bimester4', pos: [7, 8]}, {text: 'bimester5', pos: [9, 10]}, {text: 'bimester6', pos: [11, 12]} ],
								quarter: [{text: 'quarter1', pos: [1, 3]}, {text: 'quarter2', pos: [4, 6]}, {text: 'quarter3', pos: [7, 9]}, {text: 'quarter4', pos: [10, 12]}],
								semester: [{text: 'semester1', pos: [1, 6]}, {text: 'semester2', pos: [7, 12]}]
							}
							if($selectYear.length > 0)
								labels = months
							else if($startMonth.length > 0 && $endMonth.length > 0)
								for(var year: number=startYear;year<=endYear;year++){
									var first_month: number = 0
									var last_month: number = 11
									if(year === startYear)
										first_month = startMonth-1
									if(year === endYear)
										last_month = endMonth-1
									for(var month: number = first_month;month<=last_month;month++)
										labels.push(months[month]+'/'+year)
								}
							if(report.selectorDataSets.groupByPeriod !== ''){
								labels = []
							  if(report.selectorDataSets.groupByPeriod === 'year')
								for(var y:number=startYear;y<=endYear;y++)
								  labels.push(y.toString())
							  else if(report.selectorDataSets.groupByPeriod === 'bimester' || report.selectorDataSets.groupByPeriod === 'quarter' || report.selectorDataSets.groupByPeriod === 'semester')
									for(y=startYear;y<=endYear;y++){
										groupsPeriod[report.selectorDataSets.groupByPeriod].forEach( (title: GroupsPeriodItem)=>{
											if(startYear === endYear){
												if(startMonth <= title.pos[1] && endMonth >= title.pos[0])
													labels.push(dataLanguage(title.text)+'/'+y)
											}
											else if(y === startYear && startMonth <= title.pos[1])
												labels.push(dataLanguage(title.text)+'/'+y)
											else if(y === endYear && endMonth >= title.pos[0])
												labels.push(dataLanguage(title.text)+'/'+y)
											else if(y !== startYear && y !== endYear)
												labels.push(dataLanguage(title.text)+'/'+y)
										})
									}
							}
						}

						if(report.type === 'sheet')
							showSheet(report.selectorDataSets, sheetData, labels, report.registerTitle||'name', report.previewValues)
						else if(report.type === 'doughnut' || report.type === 'pie' || report.type === 'bar' || report.type === 'line' || report.type === 'table'){
							if(report.type === 'table')
								getTableData(report.selectorDataSets, sheetData, labels)
							else
								getChartJSDataSets(report.selectorDataSets, sheetData, labels, report.type)
						}
					}else{
						alertBox(dataLanguage('emptydata'))
						$('#reportArea').html('')
					}
				}else{
					alertBox(dataLanguage('emptydata'))
					$('#reportArea').html('')
				}
			}
			if(typeof stack === 'object')
				updateReport(selectedData)
			else
				get('get-reportdata', report.selectorDataSets, updateReport)
		})
	})
}

function updatePeriod(period: {startDate:string,endDate:string}, selector: SelectorDB){
	var $selectYear = $('#selectors #selectYear')
	var this_period = structuredClone(period)
	var year:string = $selectYear.val()?.toString() || new Date().getFullYear().toString()
	var month:number = new Date().getMonth()+1
	var changes:{str:string, value:string}[] = [
		{str: '{year}', value: year},
		{str: '{year++}', value: (+year+1).toString()},
		{str: '{year--}', value: (+year-1).toString()},
		{str: '{month}', value: month.toString()},
		{str: '{month++}', value: (month+1).toString()},
		{str: '{month--}', value: (month-1).toString()},
	]
	changes.forEach( (change:{str:string,value:string})=>{
		this_period.startDate = this_period.startDate.replace(change.str, change.value)
		this_period.endDate = this_period.endDate.replace(change.str, change.value)
	})
	selector.startDate = this_period.startDate
	selector.endDate = this_period.endDate
}

function createSelectors(report: ReportObjects, changedItem?: HTMLElement, callback?:Function): void{
	if(!Array.isArray(report.showSelectors) || report.showSelectors.length === 0){
		if(typeof callback === 'function')
			callback()
		return
	}
	var $selectors = $('#selectors')
	var $selectYear = $('#selectors #selectYear')
	var $selectGroupData = $('#selectors #selectGroupData')
	var $period = $('#selectors #period')
	var $startMonth = $('#selectors #startMonth')
	var $endMonth = $('#selectors #endMonth')
	var $tabSelectors = $('#selectors #tabSelectors')
	var years:string[] = []
	var tabs:string[] = []
	Object.keys(module.exports.yearsTabs).forEach( (dataSet:string)=>{
		Object.keys(module.exports.yearsTabs[dataSet]).sort( (a:string, b:string)=>{ return parseInt(b)-parseInt(a)}).forEach( (year:string)=>{
			if(years.indexOf(year) === -1)
				years.push(year)
		})
	})

	if(typeof report === 'object' && Array.isArray(report.showSelectors)){
		report.showSelectors.forEach( (selector: string)=>{
			if(selector === 'year' && $selectYear.length === 0){
				var $span = $('<span/>').appendTo($selectors)
				$span.html(dataLanguage('year')+': ')
			  $selectYear = $('<select/>', {'id': 'selectYear'}).appendTo($span).off("change.year").on("change.year", function(){createSelectors(report, this, callback)})
				if(years.length > 0)
			  	if($selectYear.val() === null)
			  		years.forEach( (year: string)=>{
			    		$('<option/>').html(year).val(year).appendTo($selectYear)
			  		})
			}
			else if(selector === 'period' && $period.length === 0){
				$period = $('<div>', {'id': 'period'}).appendTo($selectors)
				$('<span>').html(dataLanguage('period')+' - ').appendTo($period)
				$('<span>').html(dataLanguage('startmonth')+': ').appendTo($period)
				$startMonth = $('<input>', {'id': 'startMonth', 'class': 'medium'}).appendTo($period)
				$('<span>').html(' '+dataLanguage('endmonth')+': ').appendTo($period)
				$endMonth = $('<input>', {'id': 'endMonth', 'class': 'medium'}).appendTo($period)
				var actual_month: number = new Date().getMonth()+1
				var actual_year: number = new Date().getFullYear()
				if(years.length > 0){
					$startMonth.val( '1-'+years[0] )
					$endMonth.val( actual_month+'-'+years[0] )
				}else{
					$startMonth.val( '1-'+actual_year )
					$endMonth.val( actual_month+'-'+actual_year )
				}
				var month_list: string[] = [dataLanguage('jan'), dataLanguage('feb'), dataLanguage('mar'), dataLanguage('apr'), dataLanguage('may'), dataLanguage('jun'), dataLanguage('jul'), dataLanguage('aug'), dataLanguage('sep'), dataLanguage('oct'), dataLanguage('nov'), dataLanguage('dec')]
				$period.children('input').each( (index: number, input: HTMLInputElement)=> {
					let $thisInput = $(input)
					$thisInput.datepicker({
						dateFormat: 'MM yy',
						monthNamesShort: month_list,
						changeMonth: true,
						changeYear: true,
						onClose: function () {
							var month: string = $("#ui-datepicker-div .ui-datepicker-month :selected").val() as string
							var year: string = $("#ui-datepicker-div .ui-datepicker-year :selected").val() as string
							$(this).val(parseInt(month) + 1 + '-' + year).trigger("change")
						}
					}).on("focus", function () {
						let $datepickerMonth = $('.ui-datepicker-month')
						let $datepickerYear = $('.ui-datepicker-year')
						$(".ui-datepicker-calendar").hide()
						$(".ui-datepicker-prev").hide()
						$(".ui-datepicker-next").hide()
						let $datepickerDiv = $("#ui-datepicker-div")
						$datepickerDiv.position({
							my: "center top",
							at: "center bottom",
							of: $thisInput
						})
						$('#ui-datepicker-div select').off('change')
						var month: number = parseInt(($thisInput.val() as string).split('-')[0] || (new Date().getMonth() + 1 + '').toString())
						var year: number = parseInt(($thisInput.val() as string).split('-')[1] || (new Date().getFullYear()).toString())
						$datepickerMonth.val(month - 1)
						$('.ui-datepicker-year option').remove()
						years.forEach((this_year: string) => {
							$('<option>', {'value': this_year}).html(this_year).appendTo($datepickerYear)
						})
						$datepickerYear.val(year).off("change.yearDT").on("change.yearDT", function () {
							var this_month: number = parseInt($datepickerMonth.val() as string)
							$('.ui-datepicker-month option').remove()
							for (var list_index: number = 0; list_index <= month_list.length - 1; list_index++) {
								var list_month: string = month_list[list_index]
								if (list_index <= actual_month - 1 || parseInt($(this).val() as string) < actual_year)
									$('<option>', {'value': list_index}).html(list_month).appendTo($datepickerMonth)
								else if (this_month > actual_month - 1) {
									this_month = list_index - 1
									break
								}
							}
							$datepickerMonth.val(this_month)
						}).trigger("change")
					})
					$thisInput.off("change.datepicker").on("change.datepicker", function (this: HTMLElement) {
						createSelectors(report, this, callback)
					})
				})
			}
			else if( (selector === 'datasets/tabs' || selector === 'tabs')
			&& ($selectYear.length > 0 || $startMonth.length > 0
				|| (typeof changedItem !== 'undefined' && ($(changedItem).attr('id') === 'selectYear' || $(changedItem).attr('id') === 'selectGroupData' || $(changedItem).attr('id') === 'startMonth' || $(changedItem).attr('id') === 'endMonth')) )){
			  if(Array.isArray(report.selectorDataSets.dataSets)
			  /*&& ($selectGroupData.length === 0 || $selectGroupData.val() === 'tabs' || $selectGroupData.val() === 'datasets')*/){
			  	if($tabSelectors.length === 0)
						$tabSelectors = $('<div/>', {'id': 'tabSelectors'}).appendTo($selectors)
			  	report.selectorDataSets.dataSets.forEach( (ds:SelectorDataSets)=>{
			  		var dataSet:string = ds.title
						years.forEach( (year:string)=>{
							if( ($selectYear.length > 0 && parseInt(year) === parseInt($selectYear.val() as string ))
							|| ( $period.length > 0 && parseInt(year) >= parseInt( ($startMonth.val() as string).split('-')[1]) && parseInt(year) <= parseInt( ($endMonth.val() as string).split('-')[1]) )){
								$span = $(`#tabSelectors span[title="${dataSet}"]`)
								if($span.length === 0){
									$span = $('<span/>', {'title': dataSet, 'class': 'label'}).appendTo($tabSelectors)
									$span.append('<span class="title">'+dataSet+'</span>&nbsp;')
									if(selector === 'tabs')
										$span.append(':&nbsp;&nbsp;&nbsp;')
									if($selectGroupData.val() === 'datasets' && selector === 'tabs')
										$('<input>', {'type': 'checkbox', 'value': dataSet, 'data-type': 'dataset', 'checked': true}).appendTo($span).off("click").on("click", function(){createSelectors(report, this, callback)})
									else if(selector === 'datasets/tabs'){
										$('<input>', {'type': 'checkbox', 'value': dataSet, 'data-type': 'dataset'}).appendTo($span).on("click", function(){createSelectors(report, this, callback)})
										$span.append(':&nbsp;&nbsp;&nbsp;')
									}
									else if( ($startMonth.length > 0 || $selectYear.length > 0) && selector === 'tabs')
										$('<input>', {'type': 'checkbox', 'value': dataSet, 'data-type': 'dataset', 'checked': true}).hide().appendTo($span).off("click").on("click", function(){createSelectors(report, this, callback)})
								}
								if(typeof module.exports.yearsTabs[dataSet] === 'object' && Array.isArray(module.exports.yearsTabs[dataSet][year])){
									module.exports.yearsTabs[dataSet][year].forEach( (tab:string)=>{
										tabs.push(tab)
										var $spanTab = $(`#tabSelectors span[title="${dataSet}"] input[value="${tab}"][data-type="tab"]`)
										var dataSetChecked: boolean = $span.children('input[value="'+dataSet+'"][data-type="dataset"]').prop('checked')
										if(typeof changedItem !== 'undefined' && $(changedItem).val() === dataSet)
											$span.children('span[data-type="tab"][data-value="'+tab+'"]').children('input[data-type="tab"][value="'+tab+'"]').prop('checked', dataSetChecked)
										else if(typeof changedItem !== 'undefined' && $(changedItem).val() === tab && $(changedItem).attr('data-type') === 'tab' && !dataSetChecked)
											$span.children('input[value="'+dataSet+'"][data-type="dataset"]').prop('checked', true)
										if($spanTab.length === 0){
											$span.children('span[data-type="empty"]').remove()
											$spanTab = $('<span/>', {'data-value': tab, 'data-type': 'tab'}).appendTo($span)
											$('<input>', {'type': 'checkbox', 'value': tab, 'data-type': 'tab'}).prop('checked', dataSetChecked).appendTo($spanTab).off("click").on("click", function(){createSelectors(report, this, callback)})
											if(selector === 'tabs')
												$spanTab.children('input[data-type="tab"][value="'+tab+'"]').prop('checked', true)
											$spanTab.append('&nbsp;'+tab+'&nbsp;')
										}
									})
								}
								if( (typeof module.exports.yearsTabs[dataSet] === 'undefined' || !Array.isArray(module.exports.yearsTabs[dataSet][year]) || module.exports.yearsTabs[dataSet][year].length === 0)
								&& $span.children('span[data-type="empty"]').length === 0)
									$span.append('<span data-type="empty">&nbsp;'+dataLanguage('empty')+'&nbsp;</span>')
							}
						})
						$(`#tabSelectors span[title="${dataSet}"] span[data-type="tab"]`).each( (i:number, spanTab:HTMLElement)=>{
							var this_tab:string = $(spanTab).attr('data-value')||''
							if(tabs.indexOf(this_tab) === -1)
								$(spanTab).remove()
						})
			  	})
			  	$('#tabSelectors #groupByData').appendTo($tabSelectors)
			  	$('#tabSelectors #stack').appendTo($tabSelectors)
			  }
			}
			else if(selector === 'groupbyperiod' && $('#selectors #groupByPeriod').length === 0){
				$span = $('<span>', {'id': 'groupByPeriod', 'class': 'selectors'}).html(dataLanguage('groupby')+': ').appendTo($period)
				let $select = $('<select>', {'id': 'selectGroupPeriod'}).appendTo($span).off("change").on("change", function(){createSelectors(report, this, callback)})
				$('<option>', {'value': ''}).html(dataLanguage('select')).appendTo($select)
				$('<option>', {'value': 'bimester'}).html(dataLanguage('bimester')).appendTo($select)
				$('<option>', {'value': 'quarter'}).html(dataLanguage('quarter')).appendTo($select)
				$('<option>', {'value': 'semester'}).html(dataLanguage('semester')).appendTo($select)
				$('<option>', {'value': 'year'}).html(dataLanguage('year')).appendTo($select)
			}
			else if( (selector === 'groupbydata' || selector.split(':')[0] === 'groupbydata') && $selectGroupData.length === 0){
				$span = $('<span>', {'id': 'groupByData', 'class': 'selectors groupBy'}).html(dataLanguage('groupby')+': ').appendTo($selectors)
				let $select = $('<select>', {'id': 'selectGroupData'}).appendTo($span).off("change.group").on("change.group", function(){createSelectors(report, this, callback)})
				var split:string[] = selector.split(':')
				if(split.length === 1 || (split.length === 2 && split[1].split('/').indexOf('firstvalue') !== -1))
					$('<option>', {'value': 'firstValue'}).html(dataLanguage(report.registerTitle||'name')).appendTo($select)
				if(split.length === 1 || (split.length === 2 && split[1].split('/').indexOf('tabs') !== -1))
					$('<option>', {'value': 'tabs'}).html(dataLanguage('tabs')).appendTo($select)
				if(split.length === 1 || (split.length === 2 && split[1].split('/').indexOf('datasets') !== -1)){
					var optionDataSets:string = ''
					if(Array.isArray(report.selectorDataSets.dataSets))
						report.selectorDataSets.dataSets.forEach( (dataSet:SelectorDataSets)=>{
							if(optionDataSets !== '')
								optionDataSets += '/'
							optionDataSets += dataSet.title
						})
					$('<option/>').html(optionDataSets).val('dataSets').appendTo($select)
				}
			}else if(selector === 'stack?' && $tabSelectors.children('#stack').length === 0){
				$span = $('<span>', {class: 'label', id: 'stack'}).appendTo($tabSelectors)
				$('<span>', {class: 'title'}).html(dataLanguage('stack?')+': ').appendTo($span)
				$('<input/>', {type:'checkbox'}).appendTo($span).off("click").on("click", function(){ createSelectors(report, this, ()=>{
					if(typeof callback === 'function')
						callback({value: $(this).prop('checked')})
				}) })
			}else if(selector === 'total'){
				var $totalCheckBox = $('#tabSelectors input[data-type="total"]')
				if($totalCheckBox.length === 0){
					$span = $('<span>').appendTo($tabSelectors).attr('class', 'label total')
					$totalCheckBox = $('<input>', {'type': 'checkbox', 'value': 'total', 'checked': true, 'data-type': 'total'}).appendTo($span).off("click").on("click", function(){createSelectors(report, this, callback)})
					$span.append(' <span class="title">'+dataLanguage('total')+'</span>')
				}
				$('#tabSelectors span.label').each( (s, span)=>{
					if($(span).children('input[data-type="total"]').length === 0)
						$(span).appendTo($tabSelectors)
				})
			}
		})
	}
	if(typeof callback === 'function')
		callback()
}

function showSheet(selector:SelectorDB, data:Array<SheetCell[]>, labels:string[], registerTitle: string, previewValues?:PreviewValues[]){
	$('table#sheet').remove()
  if(selector.groupData === 'firstValue') labels.unshift(dataLanguage(registerTitle))
  else if(selector.groupData === 'tabs') labels.unshift(dataLanguage('tabs'))
  else if(selector.groupData === 'dataSets') labels.unshift(dataLanguage('dataset'))
  else labels.unshift(dataLanguage('value'))

  var rowTitle: SheetTitle[] = []
  labels.forEach((title: string, t: number)=>{
    if(t === 0)
      rowTitle.push({'title': title, 'type': 'text', 'classes': ['first'], 'disabled': true})
    else if(Number.isFinite(title))
      rowTitle.push({'title': title, 'type': 'money', 'disabled': true})
    else
      rowTitle.push({'title': title, 'type': 'money', 'disabled': true})
  })
  mySheet.rowTitle = rowTitle
	mySheet.footLines = []

	data.sort( (a: SheetCell[], b: SheetCell[])=>{
		if(typeof a[0].value !== 'undefined' && typeof b[0].value !== 'undefined' &&  a[0].value > b[0].value)
			return 1
		else
			return -1
		//return 0
	})
	mySheet.dataSet.data = data
	mySheet.dataSet.bottomStats = {open: true}
	mySheet.dataSet.rightStats = {open: true}
	var operationsYears: any[] = []
	mySheet.dataSet.data.forEach( (row: SheetCell[])=>{
		if(row[row.length-1].operations !== undefined){
			operationsYears.push(JSON.parse(JSON.stringify(row[row.length-1].operations)))
			operationsYears[operationsYears.length-1]['row'] = row[0]
			operationsYears[operationsYears.length-1]['row']['_id'] = row[row.length-1]._id
		}
	})
	mySheet.showSheet($('#reportArea'))
	var $tableSheet = $('table#sheet')
	$('tr.bottom').remove()
	$('td.lines').off('mousedown')
	$('table#sheet div.sheetField').off('mouseenter.preview').off('mouseleave.preview').on('mouseenter.preview', function(){showReportPreview(this, previewValues)})//.on('mouseleave.preview', closePreview)
	$('#printImage').width($tableSheet.width()||500)
	var $reportTitle = $('#reportPanel.mainPanel #reportTitle')
	showDownload($reportTitle.html(), 'landscape')
	$('table#sheet div.dropup.title, table#sheet div.dropdown.title').on("click", function(){
		showDownload($reportTitle.html(), 'landscape')
	})
}

function getChartJSDataSets(selector:SelectorDB, data:Array<SheetCell[]>, labels:string[], type:ReportType){
	var total_color:string = module.exports.backgroundColors[0]
	var dataSets: ChartJSDataSets = []
	var dataSetTotal: ChartJSDataSet = {data: [], backgroundColor:total_color}
	var subDataSet: ChartJSDataSet = {data: [], backgroundColor:[]}
	var last_total:number = -1
	var dsColors: {[tabName:string]: string} = {}
	var dsNumber:number = 1
	Object.keys(module.exports.yearsTabs).forEach( (dataSet:string)=>{
		if(selector.groupData === 'dataSets'){
			if(typeof dsColors[dataSet] === 'undefined'){
				if(module.exports.backgroundColors[dsNumber])
					dsColors[dataSet] = module.exports.backgroundColors[dsNumber]
				else
					dsColors[dataSet] = randomLightColor(dsNumber)
				dsNumber++
			}
		}else if(selector.groupData === 'tabs')
			Object.keys(module.exports.yearsTabs[dataSet]).forEach( (year:string)=>{
				module.exports.yearsTabs[dataSet][year].forEach( (tabName:string)=>{
					if(typeof dsColors[tabName] === 'undefined'){
						if(module.exports.backgroundColors[dsNumber])
							dsColors[tabName] = module.exports.backgroundColors[dsNumber]
						else
							dsColors[tabName] = randomLightColor(dsNumber)
						dsNumber++
					}
				})
			})
	})
	if(Array.isArray(data) && data.length > 0){
		var total:number = 0
		if(type === 'doughnut' || type === 'pie'){
			data.forEach( (row:SheetCell[], ri:number)=>{
				if(row[1] && typeof row[1].value === 'number'){
					if(row.length > 0 && row[row.length-1].total){
						if(type === 'doughnut'){
							total = row[1].value
							labels.push(dataLanguage('total'))
							dataSetTotal.data.push(total)
							dataSets.push(dataSetTotal)
							subDataSet.data.push(null)
						}
					}else{
						var label:string = row[0].value?.toString()||'undefined'
						if(Array.isArray(subDataSet.backgroundColor)){
							if(typeof dsColors[label] === 'string')
								subDataSet.backgroundColor.push(dsColors[label])
							else
								subDataSet.backgroundColor.push(randomLightColor(ri))
						}
						if(total > 0)
							label += ' ('+((row[1].value/total)*100).toFixed(2)+'%)'
						labels.push(label)
						subDataSet.data.push(row[1].value)
					}
				}
			})
			dataSets.push(subDataSet)
		}else{
			data.forEach( (row:SheetCell[], ri:number)=>{
				subDataSet.label = row[0].value?.toString()||'undefined'
				subDataSet.data = []
				if(typeof dsColors[subDataSet.label] === 'string')
					subDataSet.backgroundColor = dsColors[subDataSet.label]
				else
					subDataSet.backgroundColor = randomLightColor(ri)
				if(row.length > 0 && row[row.length-1].total){
					subDataSet.label = dataLanguage('total')
					subDataSet.backgroundColor = total_color
				}
				row.forEach( (cell:SheetCell, ci:number)=>{
					if(ci > 0){
						if(typeof cell.value === 'number')
							subDataSet.data.push(cell.value)
						else
							subDataSet.data.push(0)
					}
				})
				dataSets.push(structuredClone(subDataSet))
			})
		}
	}
	if(dataSets.length === 0){
		alertBox(dataLanguage('emptydata'))
		$('#close').trigger("click")
		return false
	}
	else
		showChartJS(labels, dataSets, type)
}

function getTableData(selector:SelectorDB, data:Array<SheetCell[]>, labels:string[]){
	var titles:string[] = []
	var table:ReportTableRow[] = []
	if(Array.isArray(data) && data.length > 0){
		data.forEach( (row:SheetCell[])=>{
			var title:string = row[row.length-1].dataSet
			if(row[row.length-1].total)
				title = dataLanguage('total')
			if(titles.indexOf(title) === -1){
				titles.push(title)
				table.push({data: new Array(row.length).fill({value: ''})})
				var tableTitle:ReportTableRow = {title:true, data: [{value: title}]}
				labels.forEach( (label:string, i:number)=>{
					if(i < row.length-2)
						tableTitle.data.push({value: label})
				})
				table.push(tableTitle)
			}
			var tableRow: ReportTableRow = {tab: title, data: []}
			var language:string = row[row.length-1].language||''
			row.forEach( (cell:SheetCell)=>{
				if(typeof cell.value === 'string')
					tableRow.data.push({value: cell.value})
				else if(typeof cell.value === 'number'){
					if(language !== '')
						tableRow.data.push({value: cell.value, type: 'money', language: language})
					else
						tableRow.data.push({value: cell.value?.toFixed(2), type: 'float'})
				}
				else
					tableRow.data.push({value: ''})
			})
			table.push(tableRow)
		})
	}
	showTable(table)
}

function showChartJS(labels:string[], dataSets:ChartJSDataSets, type:ReportType){
	$('#graph').remove()
	var $graph = $('<canvas>', {'id': 'graph'}).appendTo('#reportArea')
	var $reportPanel = $('#reportPanel.mainPanel')
	var $reportTitle = $('#reportPanel.mainPanel #reportTitle')
	var options:any = {}
	if(type === 'doughnut'){
		options.plugins = {legend: {display: false}}
	}
	var $stack = $('#tabSelectors #stack input[type="checkbox"]')
	var $stacked = {}
	if($stack.prop('checked')) {
		dataSets.forEach( (dataSet:ChartJSDataSet, i:number)=>{
			if(dataSet.label === dataLanguage('total'))
				dataSets.splice(i, 1)
		})
		options.scales = {y: {stacked: true},x: {stacked: true} }
	}
	if(type === 'line'){
		var total:boolean = $('input[type="checkbox"][value="total"][data-type="total"]').prop('checked')
	 	dataSets.forEach( (dataSet: ChartJSDataSet)=>{
			dataSet.fill = 'origin'
			if(!$stack.prop('checked'))
				if(dataSet.label === dataLanguage('total'))
					dataSet.borderColor = 'blue'
				else if(total)
					dataSet.hidden = true
	 	})
	}
	options.animation = { onComplete: function (this: ChartJS) {
		this.options.animation.onComplete = null;
		$('#printImage').width($graph.width()||500)
  	showDownload($reportTitle.html(), 'landscape')
	}, }
	new Chart($graph,
    {
      type: type,
      data: {
        labels: labels,
        datasets: dataSets
      },
	    options: options
		}
	)
	var $reportPanel = $('#reportPanel.mainPanel')
	$graph.css({'width': ($reportPanel.width()||500)-40+'px', 'height': ($reportPanel.height()||500)-($('#selectors').height()||0)-($reportTitle.height()||50)-50+'px'})
	if($reportPanel.children('span.description').length === 0)
		$('<span>', {'class': 'description'}).html('Copyright (c) 2014-2022 Chart.js Contributors').appendTo($reportPanel)
}

function showReportPreview(field: HTMLElement, previewValues?:PreviewValues[]){
	var $ballonPreview = $('#ballon.preview')
	$ballonPreview.remove()
	var $field = $(field).parent()
	if($field.hasClass('bottomStats') || $field.hasClass('rightStats'))
		return
	var cellID: string = $field.attr('id') || ''
	var cell: SheetCell = mySheet.getCellByCellID(cellID)
	var n=0
	var value: number = 0
	if(Array.isArray(previewValues))
		previewValues.forEach( (op)=>{
			var opName:string = op['opName']
			var variable = op['variable']
			var icon = ''
			if($('#ballon.preview table tr#operation-'+opName).length === 0 &&
			((variable === 'cell-var' && cell[opName] !== undefined) || (variable === 'operations' && cell.operations !== undefined && (cell.operations[opName] || cell.operations[opName+'-average']))) ){
				$ballonPreview = $('#ballon.preview')
				if($ballonPreview.length === 0){
					$ballonPreview = $('<div>', {'id': 'ballon', 'class': 'preview static'}).appendTo($('#reportArea')).css('left', (mousePosX+3)+'px').css('top', (mousePosY+3)+'px')
					$('<table>').appendTo($ballonPreview)
				}
				if(variable === 'cell-var' && cell[opName+'-average'])
					value = parseFloat(cell[opName+'-average'])
				else if(variable === 'cell-var')
					value = parseFloat(cell[opName])
				else if(variable === 'operations' && cell.operations && cell.operations[opName+'-average'])
					value = cell.operations[opName+'-average']
				else if(variable === 'operations' && cell.operations)
					value = cell.operations[opName]

				var $tr = $('<tr>', {id: 'operation-'+opName}).appendTo($('#ballon.preview table'))
				if(n % 2 === 1)
					$tr.addClass('odd')
				if(typeof op['icon_explanation'] === 'string'){
					var icon_explanation = dataLanguage(op['icon_explanation'])
					icon = '<img src="pictures/Information_icon-16x16.png" title="'+icon_explanation+'" alt="'+icon_explanation+'">'
				}
				var avg = ''
				if( (variable === 'operations' && cell.operations && cell.operations[opName+'-count'] && cell.operations[opName+'-count'] !== 1)
				|| (variable === 'cell-var' && cell[opName+'-count'] && cell[opName+'-count'] !== 1) )
					avg = '('+dataLanguage('average')+')'
				$('<td>').html(dataLanguage(op['title'])+avg+icon+': ').appendTo($tr)
				$('<td>').html(value.toFixed(2)+'%').appendTo($tr)
				n++
			}
		})
	$('#reportPanel.mainPanel').scrollLeft(500)
	$ballonPreview.on('mouseleave', function(){
		$('#ballon.preview').remove()
	})
}

/*function closePreview(){
	$('#ballon.preview').remove()
}*/

function randomLightColor(n_color: number): string{
	var numbers: string = '0123456789ABCDEF' //hexdecimal
	var min_number: string[] = ['99', '99', '99']
	var max_number: string[] = ['F', 'F', 'F']

	if(n_color % 3 === 0)
		max_number[2] = 'A'
	else if(n_color % 2 === 0 && (n_color/2) % 2 === 0)
		max_number[0] = 'A'
	else
		max_number[1] = 'A'

	var number: string = ''
	for (var i: number = 0; i < 3; i++){
		var this_number: string = min_number[i]
    var char: string =  numbers.charAt(Math.floor(Math.random() * (numbers.length-numbers.indexOf(this_number[0])) ) + numbers.indexOf(this_number[0]))
    if(numbers.indexOf(char) > numbers.indexOf(max_number[i]))
    	char = max_number[i]
    number += char
    number += numbers.charAt(Math.floor(Math.random() * (numbers.length-numbers.indexOf(this_number[1])) ) + numbers.indexOf(this_number[1]))
	}
	return '#'+number
}

function showTable(table: ReportTableRow[]){
	let $printImage = $('#printImage').width('auto')
	let $reportArea = $('#reportArea').html('')
	$('<br/>').appendTo($reportArea)
	var $table_html = $('<table/>', {'class': 'reportTable'}).appendTo($reportArea)
	table.forEach( (line:ReportTableRow)=>{
		if(typeof line.data === 'object'){
			var $tr = $('<tr/>').appendTo($table_html)
			line.data.forEach( (cell: ReportTableData)=>{
				var $td = $('<td/>').appendTo($tr)
				if(line.title === true)
					$td.addClass('reportTitle').html('<b>'+cell.value+'</b>')
				else if(cell.value !== undefined)
					$td.text(cell.value)
				if(typeof cell === 'object' && cell.type !== undefined){
					$td.html('')
					createField(cell.type, cell.language, cell.value).attr('disabled', 'true').appendTo($td)
				}
			})
		}
	})
	$printImage.width( ($($table_html).width()||500) +25)
}
//@ts-ignore
window.getLastMonth = function(data:Array<SheetCell[]>){
	if(Array.isArray(data) && data.length > 0){
		var last_total:number = 1
		data.forEach( (row:SheetCell[], ri:number)=>{
			var	row_config:SheetCell = structuredClone(row[row.length-1])
			if(row.length > 0 && row_config.total){
				row.forEach( (cell_total:SheetCell, ci:number)=>{
					if(typeof cell_total.value === 'number')
						last_total = ci
				})
			}
			var cellLastMonth:SheetCell = structuredClone(row[last_total])
			row.splice(1, row.length-1)
			row.push(cellLastMonth)
			row.push(row_config)
		})
	}
	return data
}
//@ts-ignore
window.getRemainderDataSet = function(data:Array<SheetCell[]>){
	if(Array.isArray(data) && data.length > 0){
		var rowTotalRemainder:SheetCell[] = [{value: dataLanguage('remainder')}]
		data.forEach( (row: SheetCell[])=>{
			var rowTemp:SheetCell[] = []
			row.forEach( (cell:SheetCell, i:number)=>{
				if(i > 0){
					if(rowTotalRemainder[i] === undefined)
						rowTotalRemainder[i] = {}
					var cellTemp:SheetCell = rowTotalRemainder[i]
					if(typeof cell.value === 'number'){
						if(typeof cellTemp.value === 'undefined' || cellTemp.value === ''){
							if(row[row.length-1].dataSet === dataLanguage('incomes'))
								cellTemp.value = cell.value
							else if(row[row.length-1].dataSet === dataLanguage('expenses'))
								cellTemp.value = 0-cell.value
						}else if(typeof cellTemp.value === 'number'){
							if(row[row.length-1].dataSet === dataLanguage('incomes'))
								cellTemp.value += cell.value
							else if(row[row.length-1].dataSet === dataLanguage('expenses'))
								cellTemp.value -= cell.value
						}
					}
					if(i === row.length-1 && cell.language){
						if(!cellTemp.dataSet)
							cellTemp.dataSet = dataLanguage('remainder')
						if(!cellTemp.language)
							cellTemp.language = cell.language
						else if(cellTemp && cellTemp.language !== cell.language)
							cellTemp.language = ''
					}
				}
			})
		})
		data.push(rowTotalRemainder)
	}
	return data
}

async function showDownload(filename: string, orientation: string){
	let $printImage = $('#printImage')
	const canvas:any = html2canvas(document.getElementById('printImage'), {
		  onrendered: function (canvas:any) {
		    document.body.appendChild(canvas)
		  },
		  allowTaint: true,
		  useCORS: true,
		  height: ($printImage.height()||500)+3,
		  width: ($printImage.width()||500)+3
	})
	let size: number[] = [595.28, 841.89]
	if(orientation === 'landscape')
		size = [841.89, 595.28]
	imgToPDF(["data:image/png;base64,"+(await canvas).toDataURL('image/png')], size).pipe(createWriteStream('/tmp/reports-'+filename+'-file.pdf'))
	$('#mainMenu a.downloadLink').remove()
	if($('#close').css('display') !== 'none')
		$('<a/>', {'class': 'btn btn-primary pull-left downloadLink', 'href': '/tmp/reports-'+filename+'-file.pdf', 'download': filename+'.pdf', 'orientation': orientation}).html('<img src="pictures/download_icon.png" alt="Download"> '+dataLanguage('downloadreport')).appendTo('#mainMenu')
}
