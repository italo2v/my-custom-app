const sheetData: {[sheet:string]: (sheet:Sheet)=>ConfigSheet} = require('../DataConfig/sheetData.js')
//const { alertBox }: UI = require('./ITEMS/UI.js')

interface SheetPanel {
  tabs: Tabs;
  dataID: string;
  dataSetYears: DataSetYears;
  selectEntries: EntriesDataSet;
  save: (afterFN?:Function)=>void;
  close: ()=>void;
  showPanel: (dataID: string)=>void;
}
interface DataSetYears {
  [year: string]: TabDataSet;
}
interface ConfigSheet {
  enableRightStats?: boolean;
  enableBottomStats?: boolean;
  footLines?: {title:string, field:string}[]
  rowTitle?: RowTitle[];
  afterPanelLoad?: Function;
  afterSheetLoad?: Function;
}
interface RowTitle extends SheetTitle{
  entry?: boolean; //persist when copying to a empty year
  items?: SelectItem[];
  foreignEntries?: string;
  readonly?: boolean;
  subValues?: RowSubValues;
  month?: number;
}
interface VariableYieldSubValue {
  value: string|number;
  datacom: string;
}
interface OptionSubValue {
  transaction: string;
  option: string;
  status: string;
  optionCode: string;
  dueDateISO: string;
  dateISO: string;
  strike: number;
  premium: number;
  quantity: number|string;
  costs: number;
}
interface OptionCell extends SheetCell {
  result?: number;
  waiting?: number;
}
interface EntriesDataSet {
  [dataset:string]: EntriesData;
}
module.exports = {
  tabs: require('./ITEMS/tabs.js'),
  dataID: '',
  dataSetYears: {},
  selectEntries: [],
  save: (afterFN:Function) => {
    updateYearDataSet()
    send('save-data', {'collection': module.exports.dataID, 'dataSet': module.exports.dataSetYears}, 'dataupdated')
    if(typeof afterFN === 'function')
      afterFN()
  },
  close: ()=>{
    module.exports.dataSetYears = {}
    module.exports.selectEntries = []
    module.exports.tabs.sheet.enableRightStats = true
    module.exports.tabs.sheet.enableBottomStats = true
    $('#sheetPanel').remove()
    module.exports.tabs.sheet.deleteRowRules = []
    module.exports.tabs.sheet.changeFieldRule = function(field: JQuery, callback: (allow: boolean)=>void){ callback(true) }
    module.exports.tabs.deleteTabRules = []
    module.exports.tabs.sheet.afterShow = ()=>{}
  },
  showPanel: (dataID: string) => {
    module.exports.dataID = dataID
    var year: string = new Date().getFullYear().toString()
    var dataIDs:string[] = Object.keys(sheetData)
    var mySheet:ConfigSheet = {}
    if(dataIDs.indexOf(dataID) === -1){
      alertBox(dataLanguage('unregisteredsheet'))
      module.exports.close()
      return
    }

    //creating row and tab rules and entries for foreignKey
    var foreignKeys:string[] = []
    var changeTitle:RowTitle = {title:'',type:'text'}
    dataIDs.forEach( (thiSheetDataID:string)=>{
      var thisSheet: ConfigSheet = {}
      if(typeof sheetData[thiSheetDataID] === 'function'){
        var createSheetConfigFN:Function = sheetData[thiSheetDataID]
        thisSheet = createSheetConfigFN(module.exports.tabs.sheet)
        if(typeof thisSheet === 'object' && Array.isArray(thisSheet.rowTitle))
          thisSheet.rowTitle.forEach( (title:RowTitle)=>{
            if(title.type === 'select' && typeof title.foreignEntries === 'string'){
              var foreignDataIDs:string[] = title.foreignEntries.split('/')
              foreignDataIDs.forEach( (foreignDataID:string)=>{
                if(foreignDataID === dataID){
                  var prefix = false
                  if(foreignDataIDs.length > 1)
                    prefix = true
                  createVerifyForeignKey(thiSheetDataID, foreignDataID, prefix)
                }
              })
              if(thiSheetDataID === dataID){
                foreignKeys = foreignDataIDs
                changeTitle = title
              }
            }
          })
        if(thiSheetDataID === dataID){
          mySheet = thisSheet
          var svUpdated = false
          if(Array.isArray(mySheet.rowTitle))
            mySheet.rowTitle.forEach( title=>{
              title.title = dataLanguage(title.title)
              if(title.type === 'select' && Array.isArray(title.items))
                title.items.forEach(item=>{
                  item.name = dataLanguage(item.name)
                })
              if(typeof title.subValues === 'object' && !svUpdated){
                svUpdated = true
                title.subValues.title = dataLanguage(title.subValues.title)
                if(Array.isArray(title.subValues.fields))
                  title.subValues.fields.forEach(field=>{
                    field.title = dataLanguage(field.title)
                    if(field.type === 'select' && Array.isArray(field.values))
                      field.values.forEach( item=>{
                        if(/^[a-zA-Z]+$/.test(item.name))
                          item.name = dataLanguage(item.name)
                      })
                  })
              }
            })
          if(Array.isArray(mySheet.footLines))
            mySheet.footLines.forEach( footLine=>{
              footLine.title = dataLanguage(footLine.title)
            })
        }
      }
    })
    var getEntries = function(foreignDataIDs:string[], callback:Function){
      if(foreignDataIDs.length > 0)
        get('get-entriesdata', foreignDataIDs[0], (result:EntriesData)=>{
          var dataIDPrefix:string = ''
          module.exports.selectEntries[foreignDataIDs[0]] = result
          foreignDataIDs.splice(0,1)
          getEntries(foreignDataIDs, callback)
        })
      else
        callback()
    }
    getEntries(foreignKeys, ()=>{
      changeTitle.items = createSelectItemsEntries(module.exports.selectEntries, year)
      if(Array.isArray(mySheet.rowTitle) && mySheet.rowTitle.length > 0)
        module.exports.tabs.sheet.rowTitle = mySheet.rowTitle
      else{
        alertBox(dataLanguage('emptysheet'))
        module.exports.close()
        return
      }
      if(mySheet.enableRightStats === false)
        module.exports.tabs.sheet.enableRightStats = false
      if(mySheet.enableBottomStats === false)
        module.exports.tabs.sheet.enableBottomStats = false
      if(Array.isArray(mySheet.footLines))
        module.exports.tabs.sheet.footLines = mySheet.footLines
      else
        module.exports.tabs.sheet.footLines = []
      module.exports.tabs.sheet.afterShow = ()=>{
        if(typeof mySheet.afterSheetLoad === 'function')
          mySheet.afterSheetLoad(module.exports)
      }
      createPanel(mySheet.afterPanelLoad)
    })
  }
}

function createPanel(afterFN?: Function){
  var $mainPanel = $('<div/>', {'id': 'sheetPanel', 'class': 'panel mainPanel center', 'style': 'height:'+(($(window).height()||500)-100)+'px'}).appendTo($body)
  var $span = $('<span/>').html(dataLanguage('year')+': ').attr('id', 'years').appendTo($mainPanel)
  var $selectYear = $('<select/>', {'id': 'selectYear'}).appendTo($span).off("change.years").on("change.years", function(){changeYear($selectYear)})
  var thisYear = new Date().getFullYear()
  for(var y:number=thisYear;y>=1980;y--)
    $('<option/>').html(y.toString()).val(y).appendTo($selectYear)
  $('<br/>').appendTo($mainPanel)
  $('<br/>').appendTo($mainPanel)
  var $sheetTabs = $('<div/>', {'id': 'sheetTabs'}).appendTo($mainPanel)
  var selectedYear: string = $selectYear.val() as string
  $('<span/>', {'id': 'yearData', 'style': 'visibility:hidden'}).html(selectedYear).appendTo($mainPanel)
  get('get-data', module.exports.dataID, (result: any)=>{
    if(typeof result === 'object' && Object.keys(result).length === 0)
      result = {'dataSet': {}}
    var years: string[] = Object.keys(result.dataSet)
    if(typeof result.dataSet === 'object' && years.length > 0){
      module.exports.dataSetYears = result.dataSet
      years.forEach( (year: string)=>{
        if(year === 'undefined')
          delete module.exports.dataSetYears[year]
        if(module.exports.dataSetYears[year] !== undefined){
          if(Object.keys(module.exports.dataSetYears[year]).length === 0)
            delete module.exports.dataSetYears[year]
        }
      })
      var dataSet: any = module.exports.dataSetYears[selectedYear]
      if(dataSet !== undefined && Object.keys(dataSet).length > 0){
        //if(module.exports.dataSetYears[selectedYear] === undefined)
          //module.exports.dataSetYears[selectedYear] = {}
        module.exports.tabs.dataSet = dataSet
        module.exports.tabs.showTabs($sheetTabs)
      }else{
        showCopyEntries($span, Object.keys(module.exports.dataSetYears))
        module.exports.tabs.dataSet = {}
      }
    }
    if(Object.keys(result.dataSet).length === 0){
      module.exports.tabs.dataSet = {}
      module.exports.dataSetYears[selectedYear] = module.exports.tabs.dataSet
      module.exports.tabs.showTabs($sheetTabs)
      send('save-data', {'collection': module.exports.dataID, 'dataSet': module.exports.dataSetYears, 'empty': true}, '')
    }
    if(typeof afterFN === 'function')
      afterFN()
  })
}

function showCopyEntries($place: JQuery, years: string[]){
  if(typeof years === 'object' && years.length === 0)
    return
  years.sort( (a:string,b:string)=>{ return parseInt(b)-parseInt(a)})
  $('#copyEntries').remove()
  var $copyEntries = $('<div>', {'id': 'copyEntries'}).appendTo($place)
  $('<span>').html(dataLanguage('copyentriesfrom')+': ').appendTo($copyEntries)
  var $select = $('<select>', {'id': 'copyYear'}).appendTo($copyEntries)
  years.forEach( (year:string)=>{
    $('<option>').html(year).val(year).appendTo($select)
  })
  $('<br>').appendTo($copyEntries)
  $('<button>', {'class': 'btn btn-primary'}).html(dataLanguage('copy')).appendTo($copyEntries).on("click", copyEntries)
}

function copyEntries(){
  var year: string = $('#copyYear').val() as string
  var $selectYear = $('#selectYear')
  var selectedYear: string = $selectYear.val() as string
  if(module.exports.dataSetYears[year] !== undefined){
    module.exports.dataSetYears[selectedYear] = JSON.parse(JSON.stringify(module.exports.dataSetYears[year]))
    Object.keys(module.exports.dataSetYears[selectedYear]).forEach( (tab: string)=>{
      if(module.exports.dataSetYears[selectedYear][tab].data.length > 0)
        module.exports.dataSetYears[selectedYear][tab].data.forEach( (dataRow: SheetCell[], r:number)=>{
          if(dataRow.length > 0)
            dataRow.forEach( (cel: SheetCell, c:number)=>{
              var title: RowTitle = module.exports.tabs.sheet.rowTitle[c]
              if(title !== undefined && title.entry !== undefined && title.entry){
                if(cel.value !== undefined && cel.value !== '')
                  module.exports.dataSetYears[selectedYear][tab].data[r][c] = {'value': cel.value}
              }else if(cel._id !== undefined && cel.language !== undefined)
                module.exports.dataSetYears[selectedYear][tab].data[r][c] = {'_id': cel._id, 'language': cel.language}
              else
                module.exports.dataSetYears[selectedYear][tab].data[r][c] = {}
            })
        })
      delete module.exports.dataSetYears[selectedYear][tab].bottomStats
      delete module.exports.dataSetYears[selectedYear][tab].rightStats
    })
    $('#copyEntries').remove()
    $selectYear.val(selectedYear).trigger("change")
    alertBox(dataLanguage('yearentriescopied'))
  }else
    alertBox(dataLanguage('yearnotfound'))
}

function changeYear($selectYear: JQuery){
  updateYearDataSet()
  var $yearData = $('#yearData')
  var dataSet: any = module.exports.dataSetYears[$yearData.html()]
  if(dataSet !== undefined && Object.keys(dataSet).length === 0)
    delete module.exports.dataSetYears[$yearData.html()]
  var selectedYear: string = $selectYear.val() as string
  $yearData.html(selectedYear)
  updateRowTitle(selectedYear)
  var $sheetTabs = $('#sheetTabs')
  if(module.exports.dataSetYears[selectedYear] !== undefined && Object.keys(module.exports.dataSetYears[selectedYear]).length > 0){
    module.exports.tabs.dataSet = module.exports.dataSetYears[selectedYear]
    $('#copyEntries').remove()
    module.exports.tabs.showTabs($sheetTabs)
    $('#addTab').on("click", ()=>{
      $('#copyEntries').remove()
      module.exports.dataSetYears[$('#yearData').html()] = module.exports.tabs.dataSet
    })
  }else{
    $sheetTabs.html('')
    showCopyEntries($('#years'), Object.keys(module.exports.dataSetYears))
    module.exports.tabs.dataSet = {}
    module.exports.dataSetYears[selectedYear] = {}
  }
}

function updateYearDataSet(){
  var year: string = $('#yearData').html()
  var activeTab: string = $('a.sheetTab.active').html() || ''
  if(activeTab !== ''){
    module.exports.tabs.sheet.updateData()
    module.exports.dataSetYears[year] = module.exports.tabs.dataSet
  }
}

function updateRowTitle(year: string){
  module.exports.tabs.sheet.rowTitle.forEach( (title: RowTitle)=>{
    if(title.type === 'select' && typeof title.foreignEntries === 'string'){
      title.items = createSelectItemsEntries(module.exports.selectEntries, year)
    }
  })
}

function createSelectItemsEntries(selectEntries: EntriesDataSet, year: string): SelectItem[]{
  var itemsSelect: SelectItem[] = []
  Object.keys(selectEntries).forEach( (dataset:string)=>{
    if(selectEntries[dataset][year] !== undefined)
      Object.keys(selectEntries[dataset][year]).forEach( (tab: string)=>{
        itemsSelect.push({'name': '|- '+tab+' -|', 'disabled': true})
        var items: EntryData[] = selectEntries[dataset][year][tab]
        items.forEach( (item: EntryData)=>{
          var id = item._id
          if(Object.keys(selectEntries).length > 1)
            id = dataset+':'+item._id
          itemsSelect.push({'name': item.value, 'value': id})
        })
      })
  })
  return itemsSelect
}

function createVerifyForeignKey(sheetDataID:string, foreignDataID:string, prefix:boolean){
  var verifyForeignKeyRow = (number: number, callback: (allow:boolean)=>void)=>{
    $('#sheet td.lines').each( (index:number, row:HTMLElement)=>{
      if(parseInt($(row).html()) === number){
        var id:string = $(row).attr('data-id')?.toString() || ''
        if(prefix)
          id = foreignDataID+':'+id
        var year:string = $('#selectYear').val()?.toString() || new Date().getFullYear().toString()
        get('verify-foreignkey', {ids: [id], collection: sheetDataID, year: year}, (allow:boolean)=>{
          if(!allow){
            var dsName = ''
            if(typeof dataSetNames[sheetDataID] === 'string')
             dsName = ' DataSet: '+dataSetNames[sheetDataID]
            alertBox(dataLanguage('entryused')+dsName)
          }
          else
            callback(allow)
        })
      }
    })
  }
  module.exports.tabs.sheet.deleteRowRules.push(verifyForeignKeyRow)
  var verifyForeignKeysTab = (tabNumber: number, callback: (allow:boolean)=>void)=>{
    var year:string = $('#selectYear').val()?.toString() || new Date().getFullYear().toString()
    var ids:string[] = []
    $('#sheet td.lines').each( (index:number, row:HTMLElement)=>{
        var id:string = $(row).attr('data-id')?.toString() || ''
        if(prefix)
          ids.push(foreignDataID+':'+id)
        else
          ids.push(id)
    })
    var year:string = $('#selectYear').val()?.toString() || new Date().getFullYear().toString()
    get('verify-foreignkey', {ids: ids, collection: sheetDataID, year: year}, (allow:boolean)=>{
      if(!allow){
        var dsName = ''
        if(typeof dataSetNames[sheetDataID] === 'string')
         dsName = ' DataSet: '+dataSetNames[sheetDataID]
        alertBox(dataLanguage('entrysused')+dsName)
      }
      else
         callback(allow)
    })
  }
  module.exports.tabs.deleteTabRules.push(verifyForeignKeysTab)
}
