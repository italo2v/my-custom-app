//gerenciar ids por ano

//const { confirmBox }: UI = require('./UI.js')
// @ts-ignore
const subValues: SubValues = require('./subValues.js')
const rightClickMenu: RightClickMenu = require('./rightClickMenu.js')

interface Sheet {
  sheetField: SheetField;
  dataSet: SheetDataSet;
  rowTitle: RowTitle[];
  footLines: SheetFootLine[];
  enableRightStats: boolean;
  enableBottomStats: boolean;
  showSheet: ($place: JQuery)=>void;
  afterShow: ()=>void;
  updateFootLines: ()=>void;
  updateDotPosition: ()=>void;
  openSubValues: (cellID: string)=>void;
  updateData: ()=>void;
  deleteRowRules: ((number:number, callback: (allow:boolean)=>void)=>void)[];
  changeFieldRule: (field:JQuery, callback: (allow:boolean)=>void)=>void;
  getCellByCellID: (cellID: string) => SheetCell;
  getRowByCellID: (cellID: string) => SheetCell[];
}
interface SheetDataSet {
  active?: boolean;
  bottomStats?: SheetBottomStats;
  data: Array<SheetCell[]>;
  rightStats?: SheetRightStats;
  tabNumber: number;
}
interface SheetTitle {
  title: string;
  type: FieldType;
  items?: SelectItem[];
  classes?: string[]|string;
  disabled?: boolean;
}
interface RowSubValues {
  title: string;
  showDot?: boolean;
  fields: SubValueField[];
  onShowSubValue?: (subValue: any|null, subValueNumber: number) => void;
  onClose?: ()=>string|void;
}
interface SheetCell {
  value?: string | number;
  comment?: string;
  mask?: string;
  subValues?: any;
  language?: string;
  _id?: string;
  operations?: CellOperation;
  [operationName: string]: any;
}
interface SheetRightStats {
  data?: SheetStatsData[];
  open: boolean;
}
interface SheetBottomStats {
  average?: SheetStatsData;
  total?: SheetStatsData;
  data?: SheetStatsData[];
  open: boolean;
}
interface SheetStatsData {
  total?: number;
  average?: number;
  language?: string;
  type: "money"|"float";
}
interface SheetFootLine {
  title: string;
  field: string;
}

module.exports = {
  sheetField: require('./sheetField.js'),
  dataSet: {},
  rowTitle: [],
  footLines: [],
  enableRightStats: true,
  enableBottomStats: true,
  showSheet: ($place: JQuery) => {
    $($place).html('')
    var columnSort: string, cellID: string = ''
    var $table = $('<table/>', {'id': 'sheet', 'class': 'center'}).appendTo($place)
    if(module.exports.dataSet.data === undefined)
      module.exports.dataSet.data = []
    var data: Array<SheetCell[]> = module.exports.dataSet.data
    //generating row title
    var $row = $('<tr/>').appendTo($table)
    for(var j:number=1;j<=module.exports.rowTitle.length+1;j++){
      var $col = $('<td/>', {'id': `cell-1-${j}`}).html(' ').appendTo($row)
      if(j === 1)
        $col.attr('class', 'null').html('')
      else{
        var col: RowTitle = module.exports.rowTitle[j-2]
        $col.attr('class', 'title')
        var $div = $('<div/>', {'class': 'dropdown title'}).html(col.title).appendTo($col)
        $('<span/>', {'class': 'caret title'}).appendTo($div)
        if(col.type === 'select' && typeof col.items === 'object'){
            if (col.items.length === 0 || col.items[0].value === undefined || col.items[0].value !== '')
              col.items.splice(0, 0, {'name': dataLanguage('select'), 'value': ''})
          }
      }
    }
    //creating sort function
    var $divTitles = $('table#sheet td.title div.title')
    $divTitles.on("click", function(this: HTMLElement){
      if($(this).hasClass('dropup')){
        $(this).attr('class', 'dropdown title')
        sortSheet(cellID, false)
      }else{
        cellID = $(this).parent()?.attr('id')||''
        if(columnSort === cellID){
          $(this).attr('class', 'dropup title')
          sortSheet(cellID, true)
        }else{
          columnSort = cellID
          $divTitles.each(function(this: HTMLElement){
            $(this).attr('class', 'dropdown title')
            $(this).parent().removeClass('titleSorted')
          })
          $(this).parent().addClass('titleSorted')
          sortSheet(cellID, false)
        }
      }
    })
    for(var i:number=0;i<=data.length-1;i++)
      insertRow(data[i])
    if(data.length === 0)
      insertRow()
    var $tr = $('<tr/>').attr('class', 'bottom').appendTo($table)
    $('<td/>').attr('class', 'bottom').appendTo($tr)
    var $td = $('<td/>', {'class': 'bottom'}).appendTo($tr)
    $('<a/>', {'class': 'btn btn-primary', 'href': '#', 'id': 'addRow'}).text('+').on("click", function(){insertRow()}).appendTo($td)
    var colspan = $divTitles.length+2
    var $td = $('<td/>', {'class': 'bottom', 'colspan': colspan}).appendTo($tr)
    createRightStats()
    module.exports.updateFootLines()
    createBottomStats()
    setSheetKeys()
    module.exports.updateDotPosition()
    module.exports.afterShow()
  },
  afterShow: ()=>{},
  updateFootLines: ()=>{
    var $tableSheet = $('table#sheet')
    $tableSheet.children('tr.footLine').remove()
    for(var fl:number=0;fl<=module.exports.footLines.length-1;fl++)
      insertFootLine(module.exports.footLines[fl].title, module.exports.footLines[fl].field)
    var $bottomStats = $tableSheet.children('tr#bottomStats')
    var $rightStats = $('td#rightStats')
    $bottomStats.appendTo($tableSheet)
    $tableSheet.children('tr.bottom').appendTo($tableSheet)
    if($bottomStats.children('td').children('span.arrow').css('border-top')?.split('px')[0] === '0'){
      $rightStats.attr('rowspan', $tableSheet.children('tr').length-2)
    }
    else
      $rightStats.attr('rowspan', $('table#sheet tr td.lines').length+1)
    updateRows()
  },
  updateDotPosition: ()=>{
    $('.commentDot').each( function(this:HTMLElement){
      var $sheetField = $(this).parent().children('div.sheetField')
      $(this).attr('style', 'left:'+(($sheetField.width()||100)-8)+'px;')//top:'+( ($sheetField.height()||30)-7)+'px')
    })
  },
  openSubValues: (cellID:string)=>{
    var rowTitle: RowTitle = module.exports.rowTitle[( parseInt(cellID.split('-')[2]||'0')-2 )]
    subValues.fields = rowTitle.subValues?.fields || []
    var cell: SheetCell = module.exports.getCellByCellID(cellID)
    if(cell.subValues?.length === 0){
      subValues.subValues = []
      delete cell.subValues
    }else
      subValues.subValues = cell.subValues || []
    if(typeof rowTitle.subValues?.onClose === 'function') {
      var closeFN: ()=>string|void = rowTitle.subValues?.onClose
      subValues.onClose = function () {
        cell.subValues = subValues.subValues
        var result:string = closeFN() || ''
        if (result === 'lock')
          subValues.lock = true
        else
          delete subValues.lock
        module.exports.sheetField.updateVal($('td#' + cellID).children('div.sheetField'), cell.value||'')
        module.exports.updateFootLines()
        if(rowTitle.subValues?.showDot)
          if(cell.subValues.length > 0){
            if($('td#'+cellID).children('.transactionDot').length === 0)
              $('<div/>', {'class': 'transactionDot'}).appendTo($('td#' + cellID)).on("click", function () {
                if ($('#ballon.subValues').length === 0)
                  module.exports.openSubValues($(this).parent().attr('id')||'')
              })
          }else
            $('td#' + cellID).children('.transactionDot').remove()
      }
    }else
      subValues.onClose = ()=>{cell.subValues = subValues.subValues}
    if(typeof rowTitle.subValues?.onShowSubValue === 'function')
      subValues.onShowSubValue = rowTitle.subValues.onShowSubValue
    else
      subValues.onShowSubValue = ()=>{}
    subValues.showSubValues(cellID)
  },
  updateData: ()=>{
    updateDataSet()
  },
  deleteRowRules: [],
  changeFieldRule: (field: JQuery, callback: (allow:boolean)=>void)=>{
    callback(true)
  },
  getCellByCellID: (cellID:string)=>{
    var row: SheetCell[] = module.exports.getRowByCellID(cellID)
    if (typeof row === 'object' && row.length > 0) {
      var split: string[] = cellID.split('-')
      var cell: SheetCell = row[parseInt(split[2]) - 2]
      if (typeof cell === 'object')
        return cell
    }
    return {}
  },
  getRowByCellID: (cellID:string)=>{
    var split: string[] = cellID.split('-')
    if(split.length === 3) {
      var row: SheetCell[] = module.exports.dataSet.data[parseInt(split[1]) - 2]
      if (typeof row === 'object')
        return row
    }
    return []
  }
}

$(window).on("resize", () => {
  module.exports.updateDotPosition()
})

$body.on("mousedown", function(e: JQuery.MouseDownEvent){
  //close comment if click outside the ballon
  if($('#ballon.comment').length > 0 && $(e.target).parent().attr('id') !== 'ballon' && e.target.id !== 'showComment')
    closeCommentBallon()
  //close menu if click outside
  var $sheetMenu = $('#rightClickMenu_sheetMenu')
  if($sheetMenu.length > 0 && $(e.target).parent().parent().attr('id') !== $sheetMenu.attr('data-value') && $(e.target).attr('id') !== $sheetMenu.attr('data-value') || e.button !== 2)
    rightClickMenu.close('sheetMenu')
})

function updateFieldValue(this: HTMLElement){
  module.exports.changeFieldRule($(this), (allow:boolean)=>{
    if(allow){
      var $this_field = $(this).parent()
      var cellID: string = $this_field.parent().attr('id') || ''
      var cell: SheetCell = module.exports.getCellByCellID(cellID)
      if(cell !== undefined){
        var value: string = module.exports.sheetField.getVal($this_field)
        if(value !== '')
          cell.value = value
        else
          delete cell.value
        var mask = $this_field.attr('data-mask') || ''
        if(mask !== '')
          cell.mask = $this_field.attr('data-mask')
        else
          delete cell.mask
      }
      if($(this).val() === '#!calcerror')
        $(this).val(dataLanguage('calcerror'))
      if($this_field.hasClass('Float') || $this_field.hasClass('Integer') || $this_field.hasClass('moneyMask')){
        if(module.exports.enableBottomStats === true || module.exports.enableRightStats === true)
          updateStats(this)
        module.exports.updateFootLines()
      }
    }
  })
}

function convertMaskLanguage(line:string, this_language:string){
  $('table#sheet td.lines').each( function(this: HTMLElement){
    if($(this).html() === line){
      if($(this).attr('data-language') === this_language)
        return
      $(this).parent().children('td').children('div.sheetField').each( (tindex:number, field:HTMLElement)=>{
        if($(field).hasClass('moneyMask')){
          $(field).attr('data-language', this_language)
          var value:string = module.exports.sheetField.getVal($(field))
          module.exports.sheetField.updateVal($(field), value)
        }
      })
      $(this).attr('data-language', this_language)
      var row: SheetCell[] = module.exports.getRowByCellID($(this).attr('id'))
      if(row[row.length-1].language !== undefined)
        row[row.length-1].language = this_language
    }
  })
}

function makeid():string{
  var text:string = ""
  var possible:string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (var i:number = 0; i < 24; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  var match:boolean = false
  $('table#sheet td.lines').each( function(this:HTMLElement){
    if($(this).data('id') === text)
      match = true
  })
  if(match)
    return makeid()
  else
    return text
}

function verifyRowData(rowData: SheetCell[]){
  var row_config:SheetCell
  if(rowData.length === 0)
    row_config = {'language': dataLanguage('langLocale'), '_id': makeid()}
  else
    row_config =  rowData[rowData.length-1]
  rowData.splice(rowData.length-1)
  for(var rd:number=0;rd<=module.exports.rowTitle.length;rd++){
    if(rowData[rd] === undefined)
      rowData[rd] = {}
  }
  rowData.splice(module.exports.rowTitle.length)
  var language:string
  if(row_config.language !== undefined)
    language = row_config.language
  else
    language = dataLanguage('langLocale')
  var id:string
  if(row_config._id !== undefined)
    id = row_config._id
  else
    id = makeid()
  rowData.push({'language': language, '_id': id})
  return rowData
}

function showCommentBallon(cellId:string){
  var $td = $('td#'+cellId)
  var left:number = $td.children('div.sheetField').width() || 100
  $('<span/>', {'class': 'ballonArrow', 'style': 'left:'+left+'px;'}).appendTo($td)
  $('<div/>', {'id': 'ballon', 'class': 'comment', 'data-value': cellId, 'maxlength': 1000, 'style': 'left:'+(left+4)+'px;'}).appendTo($td)
  var $textarea = $('<textarea/>').appendTo($('#ballon')).on('input', function(this:HTMLTextAreaElement){
    if($(this).val()?.length||0 > 1000 )
      $(this).val($(this).val()?.substring(0,1000)||'')
  })
  var cell:SheetCell = module.exports.getCellByCellID(cellId)
  if(cell !== undefined && cell.comment !== undefined)
    $textarea.val(cell.comment)
  setTimeout(function(){
    var val: string = $textarea.val()?.toString()||''
    $textarea.trigger("focus").val('').val(val)
  }, 10)
}

function closeCommentBallon(){
  var $ballon = $('#ballon')
  var cellId:string = $ballon.data('value')
  var cell:SheetCell = module.exports.getCellByCellID(cellId)
  var $textarea = $ballon.children('textarea')
  var $td = $('td#'+cellId)
  if($textarea.length > 0 && $textarea.val() !== ''){
    $td.children('div.sheetField').attr('data-comment', $textarea.val()?.toString()||'')
    cell.comment = $textarea.val()?.toString()||''
    if($td.children('.commentDot').length === 0){
      $('<div/>', {'class': 'commentDot'}).appendTo($td).on("click", function(this: HTMLDivElement){
        showCommentBallon($(this).parent()?.attr('id')||cellId)
      })
      module.exports.updateDotPosition()
    }
  }
  else{
    $td.children('.commentDot').remove()
    $td.children('div.sheetField').attr('data-comment', '')
    delete cell.comment
  }
  $ballon.remove()
  $('.ballonArrow').remove()
}

function insertRow(rowData?: SheetCell[]):void{
  var newRow:boolean = false
  if(rowData === undefined) {
    newRow = true
    rowData = []
  }
  verifyRowData(rowData)
  var last_row:number = parseInt($('table#sheet td.lines').last().html()) || 0
  var $row = $('<tr/>').appendTo('#sheet')
  if((last_row+1) >= 2 && (last_row+1) % 2 === 0)
    $row.attr('class', 'odd_line')
  var rowID:string = rowData[rowData.length-1]._id||''
  var rowLanguage:string = rowData[rowData.length-1].language || ''
  for(var j:number=1;j<=module.exports.rowTitle.length+1;j++){
    var cellID:string = `cell-${last_row+2}-${j}`
    var col = $('<td/>', {'id': cellID}).html(' ').appendTo($row)
    if(j === 1)
      col.html( (last_row+1).toString() ).attr('class', 'lines').attr({'data-id': rowID, 'data-language': rowLanguage})
    else{
      var cell:SheetCell = rowData[j-2]
      var rowTitle: RowTitle = module.exports.rowTitle[j-2]
      var $field:JQuery
      if(rowTitle.type === 'float' || rowTitle.type === 'money' || rowTitle.type === 'integer')
        $field = module.exports.sheetField.createField(rowTitle.type, rowLanguage, cell.value, cell.comment, '', 'expand').appendTo(col)
      else if(rowTitle.type === 'select'){
        $field = module.exports.sheetField.createField(rowTitle.type, rowTitle.items, cell.value).appendTo(col)
      }else
        $field = module.exports.sheetField.createField(rowTitle.type, rowLanguage, cell.value, cell.comment).appendTo(col)
      var $textbox = $field.children('input.hasDatepicker')
      if($textbox.length === 0)
        $textbox = $field.children('input')
      if($textbox.length === 0)
        $textbox = $field.children('textarea')
      if($textbox.length === 0)
        $textbox = $field.children('select')
      $textbox.on("change", updateFieldValue).on("focus", function(){
        $(this).parent().parent().parent().addClass('highlight')
      }).on("focusout", function(){
        $(this).parent().parent().parent().removeClass('highlight')
        module.exports.updateDotPosition()
      })
      $field.children('div.value').off('click').on("click", function(){
        var tr = $(this).parent().parent().parent()
        if(!tr.hasClass('highlight')){
          $('div.sheetField div.value').each(function(){
            $(this).parent().parent().parent().removeClass('highlight')
          })
          tr.addClass('highlight')
        }
        else
          tr.removeClass('highlight')
      })
      $field.on("click", function(){
        module.exports.updateDotPosition()
      })
      if(typeof rowTitle.classes === 'object' && rowTitle.classes.length > 0)
        rowTitle.classes.forEach( (classe:string)=>{
          $field.addClass(classe)
        })
      else if(typeof rowTitle.classes === 'string')
        $field.addClass(rowTitle.classes)
      if(rowTitle.disabled)
        $field.attr('disabled', 'true')
      if(rowTitle.readonly)
        $field.attr('readonly', 'true')
      if(typeof rowTitle.subValues === 'object' && rowTitle.subValues.title !== undefined){
        $field.attr('data-subValues', rowTitle.subValues.title)
        if(rowTitle.subValues.showDot && Array.isArray(cell.subValues) && cell.subValues.length > 0)
          $('<div/>', {'class': 'transactionDot'}).appendTo($field.parent()).on("click", function () {
            if ($('#ballon.subValues').length === 0)
              module.exports.openSubValues($(this).parent().attr('id')||'')
          })
      }
      if(rowTitle.month !== undefined)
        $field.attr('data-month', rowTitle.month)
      if(!newRow){
        if(cell.comment !== undefined){
          $('<div/>', {'class': 'commentDot'}).appendTo(col).on("click", function(this:HTMLDivElement){
            showCommentBallon($(this).parent()?.attr('id')||'')
          })
        }
      }
    }
  }
  setSheetKeys()
  if(newRow)
    module.exports.dataSet.data.push(rowData)
  var $rightStats = $('#rightStats')
  var $sheet = $('table#sheet')
  if($rightStats.length > 0){
    var $td_avg:JQuery, $td_total:JQuery
    if($sheet.children('tr.bottomStats.total').children('td').last().attr('class') === 'null not'){
      $td_avg = $('<td/>', {'class': 'rightStats null'}).appendTo($row).hide()
      $td_total = $('<td/>', {'class': 'rightStats null'}).appendTo($row).hide()
    }else{
      $td_avg = $('<td/>', {'class': 'rightStats average'}).appendTo($row).hide()
      $td_total = $('<td/>', {'class': 'rightStats total'}).appendTo($row).hide()
      var language:string = rowData[rowData.length-1].language||''
      module.exports.sheetField.createField('float', language, '').appendTo($td_avg).attr('readonly', 'true')
      module.exports.sheetField.createField('float', language, '').appendTo($td_total).attr('readonly', 'true')
    }
    $rightStats.attr('rowspan', parseInt($rightStats.attr('rowspan')||'0')+1)
    if($rightStats.children('.arrow').css('border-left').split('px')[0] === '0'){
      $td_avg.show()
      $td_total.show()
    }
  }
  updateRows()
}

function insertRowBelowAbove(id:string, line:number){
  insertRow()
  var $sheet = $('table#sheet')
  $('#tempLine').remove()
  var $tempLine = $('<div/>', {'id': 'tempLine'}).appendTo('body')
  $sheet.children('tr').children('td.lines').each(function (this:HTMLElement){
    var this_line:number = parseInt($(this).html())
    if( (this_line > line && id === 'insertRowBelow') || (this_line >= line && id === 'insertRowAbove'))
      $(this).parent().appendTo($tempLine)
  })
  $tempLine.children('tr').last().appendTo($sheet)
  $tempLine.children('tr').appendTo($sheet)
  $tempLine.remove()
  $sheet.children('tr').children('td.lines').each( (t:number, td:HTMLElement)=>{
    $(td).html( (t+1).toString() )
    $(td).parent().children('td').each(function(this:HTMLTableCellElement){
      $(this).attr('id', 'cell-'+(t+2)+'-'+this.id.split('-')[2])
    })
  })
  $sheet.children('tr.footLine').appendTo($sheet)
  if($sheet.children('tr#bottomStats').length > 0){
    $sheet.children('tr.bottomStats').appendTo($sheet)
    $sheet.children('tr#bottomStats').appendTo($sheet)
  }
  $sheet.children('tr.bottom').appendTo($sheet)
  var order: string[] = []
  $sheet.children('tr').children('td.lines').each( function(this:HTMLElement){
    order.push($(this).attr('data-id')||'')
  })
  updateDataSet(order)
  updateRows()
}

function deleteRow(number:number){
  confirmBox(dataLanguage('askdeleterow'), () => {
    var verifyRule = function(rules:Function[], pos:number){
      if(typeof rules[pos] === 'function'){
        rules[pos](number, (allow:boolean)=>{
          if(allow){
            pos++
            verifyRule(rules, pos)
          }
        })
      }else{
        var $sheet = $('table#sheet')
        $sheet.children('tr').each(function (this:HTMLElement){
          var this_line:number = parseInt($(this).children('td.lines').html())
          if(this_line === number){
            $(this).remove()
          }
          if(this_line > number){
            $(this).children('td.lines').html( (this_line-1).toString() )
            $(this).children('td').each(function(t:number, td:HTMLTableCellElement){
              $(td).attr('id', 'cell-'+this_line+'-'+td.id.split('-')[2])
            })
          }
        })
        var order: string[] = []
        $('table#sheet td.lines').each( function(this:HTMLElement){
          order.push($(this).attr('data-id')||'')
        })
        var $rightStats = $('#rightStats')
        $rightStats.attr('rowspan', parseInt($rightStats.attr('rowspan')||'2')-1)
        updateDataSet(order)
        if(module.exports.dataSet.data.length === 0)
          insertRow()
        module.exports.updateFootLines()
        createBottomStats()
        updateRows()
      }
    }
    verifyRule(module.exports.deleteRowRules, 0)
  })
}

function updateDataSet(order?: string[]){
  var data: Array<SheetCell[]> = []
  if(typeof order === 'object') {
    order.forEach((id: string) => {
      module.exports.dataSet.data.forEach((row: SheetCell[]) => {
        if (row[row.length - 1]._id === id)
          data.push(row)
      })
    })
    module.exports.dataSet.data = data
  }

  var $field:JQuery, total:string, average:string, value:string, stats: SheetStatsData
  var line:number=0
  $('table#sheet tr').each(function(this:HTMLElement){
    if($(this).children('td').children('div.sheetField').length > 0 && !$(this).hasClass('bottomStats') && !$(this).hasClass('footLine')){
      var dataSetLine: SheetCell[] = module.exports.dataSet.data[line]
      var cel:number=-1
      $(this).children('td').each(function(this:HTMLElement){
        if(!$(this).hasClass('rightStats')){
          $field = $(this).children('div.sheetField')
          if($field.length > 0){
            cel++
            if(typeof dataSetLine[cel] === 'object') {
              value = module.exports.sheetField.getVal($field)
              var type:string = ''
              if(module.exports.rowTitle[cel] && module.exports.rowTitle[cel].type)
                type = module.exports.rowTitle[cel].type
              if (value === '')
                delete dataSetLine[cel].value
              else if (Number.isFinite(parseFloat(value)) && (type === 'float' || type === 'integer' || type === 'money'))
                dataSetLine[cel].value = parseFloat(value)
              else if ($field.hasClass('select'))
                dataSetLine[cel].value = value
              else
                dataSetLine[cel].value = value.toUpperCase()

              if ($field.attr('data-mask') !== undefined && $field.attr('data-mask') !== '')
                dataSetLine[cel].mask = $field.attr('data-mask')
              if ($field.attr('data-comment') !== undefined && $field.attr('data-comment') !== '')
                dataSetLine[cel].comment = $field.attr('data-comment')
              if ($field.hasClass('text'))
                delete dataSetLine[cel].mask
            }
          }
        }
      })
      if(dataSetLine[cel+1]._id !== $(this).children('td.lines').data('id') )
        console.log('error->'+$(this).children('td.lines').attr('data-id'))
      else
        dataSetLine[cel+1].language = $(this).children('td.lines').attr('data-language')
      line++
    }
  })
  if($('#rightStats').length === 0)
    delete module.exports.dataSet.rightStats
  else{
    module.exports.dataSet.rightStats.data = []
    $('table#sheet td.lines').each( function(this:HTMLElement){
      $field = $(this).parent().children('td.rightStats.average').children('div.sheetField')
      average = module.exports.sheetField.getVal($field)
      $field = $(this).parent().children('td.rightStats.total').children('div.sheetField')
      total = module.exports.sheetField.getVal($field)
      if(average !== '' || total !== ''){
        stats = {type: 'float'}
        if(average !== '' && Number.isFinite(parseFloat(average)))
          stats.average = parseFloat(average)
        if(total !== '' && Number.isFinite(parseFloat(total)))
          stats.total = parseFloat(total)
        if($field.hasClass('moneyMask')){
          stats.type = 'money'
          stats.language = $field.attr('data-language')||''
        }
        module.exports.dataSet.rightStats.data.push(stats)
      }else
        module.exports.dataSet.rightStats.data.push({})
    })
  }
  if($('#bottomStats').length === 0)
    delete module.exports.dataSet.bottomStats
  else{
    module.exports.dataSet.bottomStats.data = []
    $('table#sheet tr.bottomStats.average').children('td').each( (index:number, td:HTMLElement)=>{
      $field = $(td).children('div.sheetField')
      if($field.length > 0 && !$(td).hasClass('rightStats')){
        average = module.exports.sheetField.getVal($field)
        $field = $($('table#sheet tr.bottomStats.total').children('td')[index]).children('div.sheetField')
        total = module.exports.sheetField.getVal($field)
        if(average !== '' || total !== ''){
          stats = {type: 'float'}
          if(average !== '' && Number.isFinite(parseFloat(average)))
            stats.average = parseFloat(average)
          if(total !== '' && Number.isFinite(parseFloat(total)))
            stats.total = parseFloat(total)
          if($field.hasClass('moneyMask')){
            stats.type = 'money'
            stats.language = $field.attr('data-language')
          }
          module.exports.dataSet.bottomStats.data.push(stats)
        }else
          module.exports.dataSet.bottomStats.data.push({})
      }
    })
  }
}

function updateRows(){
  var $sheet = $('table#sheet')
  $sheet.children('tr.bottomStats').appendTo($sheet)
  $sheet.children('tr.footLine').appendTo($sheet)
  $sheet.children('tr#bottomStats').appendTo($sheet)
  $sheet.children('tr.bottom').appendTo($sheet)
  $sheet.children('tr').each(function(t:number, tr:HTMLElement){
    if(!$(tr).hasClass('bottom')){
      if(t>=1 && t % 2 === 0){
        $(tr).addClass('odd_line')
      }
      else
        $(tr).removeClass('odd_line')
    }
  })
  var table_height = 0
  $('table#sheet tr').each( (t:number, tr:HTMLElement)=>{
    if(!$(tr).hasClass('bottom') && $(tr).css('display') !== 'none')
      table_height += $(tr).height()||30
  })
  var height = ($('table#sheet').parent().height()||300)-table_height-5
  if(height < 80)
    height = 80
  $('table#sheet').children('tr.bottom').css('height', height+'px')
}

function sortSheet(cellID: string, invert: boolean){
  var $field:JQuery, val:string, tdA:JQuery, tdB:JQuery, fieldA:string, fieldB:string
  var $sheet = $('table#sheet')
  //sorting rows
  if(cellID !== '') {
    $('table#sheet div.title').each(function (d:number, div:HTMLElement) {
      if ($(div).parent().attr('id') === cellID) {
        $sheet.children('tr').toArray().sort( (trA: HTMLElement, trB:HTMLElement) => {
          if($($(trA).children('td')[0]).hasClass('lines') && $($(trB).children('td')[0]).hasClass('lines')) {
            tdA = $($(trA).children('td')[d + 1])
            tdB = $($(trB).children('td')[d + 1])
            if ($(tdA).hasClass('bottomStats') || $(tdB).hasClass('bottomStats')
              || $(tdA).hasClass('footLine') || $(tdB).hasClass('footLine')
              || $(tdA).hasClass('title') || $(tdB).hasClass('title'))
              return 0
            if (tdA.children('div.sheetField.date').length > 0){
              var dateA = tdA.children('div.sheetField.date').children('input[type="hidden"]').val()||''
              var dateB = tdB.children('div.sheetField.date').children('input[type="hidden"]').val()||''
              var order:number = (dateA < dateB) ? -1 : ((dateA > dateB) ? 1 : 0)
              if(invert && order !== 0)
                order *= -1
              return order
            }
            else if (tdA.children('div.sheetField').length > 0) {
              fieldA = module.exports.sheetField.getVal(tdA.children('div.sheetField'))
              fieldB = module.exports.sheetField.getVal(tdB.children('div.sheetField'))
            } else if (tdA.children('select').length > 0) {
              fieldA = tdA.children('select').find(":selected").text()
              fieldB = tdB.children('select').find(":selected").text()
            } else
              return 0
            fieldA = fieldA.replace(/\s+/g, " ").trim()
            fieldB = fieldB.replace(/\s+/g, " ").trim()
            if (fieldB === '' && fieldA === '')
              return 0
            else if (fieldA !== '' && fieldB !== '') {
              if (Number.isFinite(parseFloat(fieldA)) && Number.isFinite(parseFloat(fieldB))) {
                if (invert)
                  return parseFloat(fieldB) - parseFloat(fieldA)
                else
                  return parseFloat(fieldA) - parseFloat(fieldB)
              } else {
                fieldA = fieldA.toUpperCase()
                fieldB = fieldB.toUpperCase()
                if (fieldA < fieldB) {
                  if (invert)
                    return 1
                  else
                    return -1
                }
                if (fieldA > fieldB) {
                  if (invert)
                    return -1
                  else
                    return 1
                }
                return 0
              }
            } else if (fieldB !== '')
              return 1
            else if (fieldA !== '')
              return -1
          }
          return 0
        }).forEach( (tr:HTMLElement)=>{
          $(tr).appendTo($sheet)
        })
      }
    })
    $sheet.children('tr').children('td.lines').each(function (t:number, td:HTMLElement) {
      $(td).html( (t+1).toString() )
      $(td).parent().children('td').each(function (this:HTMLElement) {
        $(this).attr('id', 'cell-'+(t+2)+'-'+this.id.split('-')[2])
      })
    })
    var order: string[] = []
    $sheet.children('tr').children('td.lines').each( function(this:HTMLElement) {
      order.push($(this).attr('data-id')||'')
    })
    updateDataSet(order)
    updateRows()
  }
}

function setSheetKeys(){
  $('table#sheet div.sheetField').each( (index:number, field:HTMLElement)=>{
    if($(field).attr('readonly') !== 'readonly' && $(field).attr('disabled') !== 'disabled'
    && !$(field).parent().hasClass('rightStats') && !$(field).parent().hasClass('bottomStats')){
      var $textbox:JQuery = $(field).children('input')
      if($textbox.length === 0)
        $textbox = $(field).children('textarea')
      $textbox.off('keydown').on("keydown", function(event: JQuery.KeyDownEvent){
        var key:string = event.key
        if(key === 'Enter' || key === 'Tab' || (event.ctrlKey && (key === 'ArrowDown' || key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowRight'))) {
          var cellID: string = $(this).parent().parent().attr('id') || ''
          var split = cellID.split('-')
          var row: number = parseInt(split[1])
          var col: number = parseInt(split[2])
          if (key === 'Enter' || (event.ctrlKey && key === 'ArrowDown')) //enter or down
            row++
          else if (event.ctrlKey && key === 'ArrowUp') //up
            row--
          else if (event.ctrlKey && key === 'ArrowLeft') //left
            col--
          else if (key === 'Tab' || (event.ctrlKey && key === 'ArrowRight')) { //tab or right
            event.preventDefault()
            col++
          }
          var $cell = $('#cell-' + row + '-' + col)
          if ($cell.children('div.sheetField').length > 0) {
            $cell.children('div.sheetField').trigger("click")
          } else if ($cell.children('select').length > 0)
            $cell.children('select').trigger("focus")
        }
      })
    }else
      $(field).off('click')
    if( $(field).attr('disabled') !== 'disabled' && !$(field).parent().hasClass('rightStats') && !$(field).parent().hasClass('bottomStats'))
      $(field).off('mousedown').on("mousedown", function(e: JQuery.MouseDownEvent){
        if(e.button === 2 && e.target.tagName === 'DIV' && ($(e.target).hasClass('value') || $(e.target).hasClass('sheetField') ) ){
          var cellID:string = $(this).parent().attr('id')||''
          var text:string
          if($(this).attr('data-comment') !== undefined && $(this).attr('data-comment') !== '')
            text = 'editcomment'
          else
            text = 'insertcomment'
          rightClickMenu.menuItems = [ {'id': 'showComment', 'function': function(){showCommentBallon(cellID)}, 'text': dataLanguage(text)} ]
          var rowTitle: RowTitle = module.exports.rowTitle[parseInt(cellID.split('-')[2])-2]
          if($(this).attr('data-subValues') !== undefined && rowTitle.subValues?.fields !== undefined && rowTitle.subValues.fields.length > 0){
            var changeSubValues:string = $(this).attr('data-subValues')||''
            rightClickMenu.menuItems.push({'id': 'changeSubValues', 'function': function(){module.exports.openSubValues(cellID)}, 'text': changeSubValues})
          }
          rightClickMenu.showMenu('sheetMenu', cellID)
        }
      })
  })
  $('td.lines').off('mousedown').on("mousedown", function(e:JQuery.MouseDownEvent){
    if(e.button === 2){
      var moneyMasks: ClickMenuItem[] = []
      var field_masks: FieldMasks = module.exports.sheetField.getMasks()
      Object.keys(field_masks).forEach( (moneyMask:string)=>{
        var this_mask: Mask = field_masks[moneyMask]
        moneyMasks.push({
          'id': 'changeMoneyMask-'+moneyMask,
          'text': this_mask.mask.replace('{', '').replace('}', '')+' ('+this_mask.abbreviation+')',
          'function': function(){convertMaskLanguage($(e.target).html(), moneyMask)}
        })
      })
      rightClickMenu.menuItems = [
        {'id': 'insertRow', 'text': dataLanguage('insertrow'), subMenu: true, 'items': [
          {id: 'insertRowAbove', text: dataLanguage('above'), function: function(){insertRowBelowAbove('insertRowAbove', parseInt($(e.target).html()))}},
          {id: 'insertRowBelow', text: dataLanguage('below'), function: function(){insertRowBelowAbove('insertRowBelow', parseInt($(e.target).html()))}}
        ]},
        {'id': 'deleteRow', 'function': function(){deleteRow(parseInt($(e.target).html()))}, 'text': dataLanguage('deleterow')},
        {'id': 'changeCurrency', 'text': dataLanguage('changecurrency'), subMenu: true, 'items': moneyMasks}
      ]
      rightClickMenu.showMenu('sheetMenu', $(e.target).attr('id')||'')
    }
  })
}

function updateStats(textbox:HTMLElement){
  var cellID: string = $(textbox).parent().parent().attr('id')||''
  var split:string[] = cellID.split('-')
  if(split.length !== 3)
    return
  var col: number = parseInt(split[2])
  var $tr = $(textbox).parent().parent().parent()
  var stats: SheetStatsData
  if($('#rightStats').length > 0){
    stats = statsLine($tr)
    changeStatsValue(stats.type, $tr.children('td.rightStats.average'), stats.average)
    changeStatsValue(stats.type, $tr.children('td.rightStats.total'), stats.total)
  }
  if($('#bottomStats').length > 0){
    var $bottom_avg = $('tr.bottomStats.average')
    var $bottom_total = $('tr.bottomStats.total')
    if(col >= 1){
      stats = statsCol(col)
      changeStatsValue(stats.type, $($bottom_avg.children('td')[col-1]), stats.average, stats.language)
      changeStatsValue(stats.type, $($bottom_total.children('td')[col-1]), stats.total, stats.language)
    }
    stats = statsLine($bottom_avg)
    changeStatsValue(stats.type, $bottom_avg.children('td.bottomStats.rightStats.not'), stats.average, stats.language)
    delete stats.total
    module.exports.dataSet.bottomStats.average = stats
    stats = statsLine($bottom_total)
    changeStatsValue(stats.type, $bottom_total.children('td.bottomStats.rightStats.not'), stats.total, stats.language)
    delete stats.average
    module.exports.dataSet.bottomStats.total = stats
  }
}

function changeStatsValue(type:FieldType, $td:JQuery, value?:number, last_language?: string){
  var $field = $td.children('div.sheetField')
  if($field.length > 0){
    if(last_language !== undefined && last_language !== '')
      $field.attr('data-language', last_language)
    module.exports.sheetField.updateType($field, type)
    if(typeof value === 'number' || typeof value === 'string')
      module.exports.sheetField.updateVal($field, value)
  }
}

function createRightStats(){
  if(module.exports.enableRightStats === false)
    return
  $('table#sheet #rightStats').remove()
  $('table#sheet td.rightStats').remove()
  if(module.exports.dataSet.rightStats === undefined)
    module.exports.dataSet.rightStats = {}
  module.exports.dataSet.rightStats.data = []
  var $trs = $('table#sheet tr')
  $trs.each( (t:number, tr:HTMLElement)=>{
    if(!$(tr).hasClass('bottom')){
      var $td_avg = $('<td/>').appendTo(tr).hide()
      var $td_total = $('<td/>').appendTo(tr).hide()
      if(t === 0){
        $td_avg.addClass('rightStats title statsTitle').html(dataLanguage('average'))
        $td_total.addClass('rightStats title statsTitle').html(dataLanguage('total'))
      }
      else{
        var stats: SheetStatsData = statsLine($(tr))
        if(stats.average || stats.total){
          module.exports.dataSet.rightStats.data.push(stats)
        }else
          module.exports.dataSet.rightStats.data.push({})
        $td_avg.addClass('rightStats average')
        $td_total.addClass('rightStats total')
        module.exports.sheetField.createField(stats.type || 'float', stats.language || '', stats.average || '').appendTo($td_avg).attr('readonly', 'true')
        module.exports.sheetField.createField(stats.type || 'float', stats.language || '', stats.total || '').appendTo($td_total).attr('readonly', 'true')
      }
    }
  })
  var rowspan: number
  if($('tr#bottomStats').length === 0 || $('tr.bottomStats').css('style') === 'none')
    rowspan = $trs.length-1
  else
    rowspan = $trs.length-2
  $('<td/>', {'id': 'rightStats', 'rowspan': rowspan}).appendTo( $('table#sheet td.null').parent() ).on("click", function(){
    if($(this).children('.arrow').css('border-left').split('px')[0] !== '0'){
      $('table#sheet td.rightStats').show()
      $('table#sheet .not').show()
      $(this).children('.arrow').css('border-right', $(this).children('.arrow').css('border-left'))
      $(this).children('.arrow').css('border-left', '0px')
      module.exports.dataSet.rightStats.open = true
    }else{
      $('table#sheet td.rightStats').hide()
      $('table#sheet .not').hide()
      $(this).children('.arrow').css('border-left', $(this).children('.arrow').css('border-right'))
      $(this).children('.arrow').css('border-right', '0px')
      module.exports.dataSet.rightStats.open = false
    }
  })
  $('<span/>', {'class': 'arrow'}).appendTo('#sheet #rightStats')
  if(module.exports.dataSet.rightStats !== undefined && module.exports.dataSet.rightStats.open)
    $('#rightStats').trigger("click")
}

function createBottomStats(){
  var stats: SheetStatsData
  var $sheet = $('table#sheet')
  var $rightStats = $('#rightStats')
  if(!module.exports.dataSet.bottomStats)
    module.exports.dataSet.bottomStats = {}
  if(module.exports.enableBottomStats !== false){
    $('table#sheet #bottomStats').remove()
    $('table#sheet tr.bottomStats').remove()
    var $tr_avg = $('<tr/>', {'class': 'bottomStats average'}).appendTo($sheet).hide()
    $('<td/>', {'class': 'null'}).appendTo($tr_avg)
    var $tr_total = $('<tr/>', {'class': 'bottomStats total'}).appendTo($sheet).hide()
    $('<td/>', {'class': 'null'}).appendTo($tr_total)
    if(module.exports.dataSet.bottomStats === undefined)
      module.exports.dataSet.bottomStats = {}
    module.exports.dataSet.bottomStats.data = []
    for(var t:number=0;t<=module.exports.rowTitle.length-1;t++){
      var $td_avg = $('<td/>', {'class': 'bottomStats'}).appendTo($tr_avg)
      var $td_total = $('<td/>', {'class': 'bottomStats'}).appendTo($tr_total)
      if(t === 0){
        $td_avg.addClass('title statsTitle').html(dataLanguage('average'))
        $td_total.addClass('title statsTitle').html(dataLanguage('total'))
      }else if(module.exports.rowTitle[t].type !== 'date'){
        stats = statsCol(t+2)
        if(Number.isFinite(stats.average) || Number.isFinite(stats.total)){
          module.exports.dataSet.bottomStats.data.push(stats)
        }else
          module.exports.dataSet.bottomStats.data.push({})
        module.exports.sheetField.createField(stats.type || 'float', stats.language || '', stats.average || '').appendTo($td_avg).attr('readonly', 'true')
        module.exports.sheetField.createField(stats.type || 'float', stats.language || '', stats.total || '').appendTo($td_total).attr('readonly', 'true')
      }
    }
    if($rightStats.length > 0){
      var $td = $('<td/>', {'class': 'bottomStats rightStats not'}).appendTo($tr_avg)
      stats = statsLine($('tr.bottomStats.average'))
      if(Number.isFinite(stats.average)){
        delete stats.total
        module.exports.dataSet.bottomStats.average = stats
      }
      module.exports.sheetField.createField(stats.type || 'float', stats.language || '', stats.average || '').appendTo($td).attr('readonly', 'true')

      $('<td/>', {'class': 'null not'}).appendTo($tr_avg)
      $('<td/>', {'class': 'null not'}).appendTo($tr_total)

      $td = $('<td/>', {'class': 'bottomStats rightStats not'}).appendTo($tr_total)
      stats = statsLine($('tr.bottomStats.total'))
      if(Number.isFinite(stats.total)){
        delete stats.average
        module.exports.dataSet.bottomStats.total = stats
      }
      module.exports.sheetField.createField(stats.type || 'float', stats.language || '', stats.total || '').appendTo($td).attr('readonly', 'true')
    }
  }
  if($('table#sheet tr#bottomStats').length === 0 && (module.exports.enableBottomStats !== false || $('table#sheet tr.footLine').length > 0)){
    $('table#sheet tr.footLine').appendTo($sheet)
    $('<tr/>', {'id': 'bottomStats'}).appendTo( $sheet )
    $('<td/>', {'colspan': $($('table#sheet tr')[0]).children('td').length}).appendTo('#bottomStats').on("click", function(){
      if($(this).children('.arrow').css('border-top').split('px')[0] !== '0'){
        $('table#sheet tr.bottomStats').show()
        $('table#sheet tr.footLine').show()
        if($rightStats.length > 0){
          if($rightStats.children('.arrow').css('border-left').split('px')[0] !== '0')
            $('table#sheet .not').hide()
          else
            $('table#sheet .not').show()
          $rightStats.attr('rowspan', $('table#sheet tr').length-2)
        }
        $(this).children('.arrow').css('border-bottom', $(this).children('.arrow').css('border-top'))
        $(this).children('.arrow').css('border-top', '0px')
        module.exports.dataSet.bottomStats.open = true
      }else{
        $('table#sheet tr.bottomStats').hide()
        $('table#sheet tr.footLine').hide()
        if($rightStats.length > 0)
          $rightStats.attr('rowspan', $('table#sheet td.lines').length+1)
        $(this).children('.arrow').css('border-top', $(this).children('.arrow').css('border-bottom'))
        $(this).children('.arrow').css('border-bottom', '0px')
        module.exports.dataSet.bottomStats.open = false
      }
    })
    $('<span/>', {'class': 'arrow'}).appendTo('#sheet #bottomStats td')
    $('table#sheet tr.bottom').appendTo($sheet)
    if(module.exports.dataSet.bottomStats !== undefined && module.exports.dataSet.bottomStats.open)
      $('#bottomStats td').trigger("click")
    updateRows()
  }
}

function statsLine(tr:JQuery):SheetStatsData{
  var total:number = 0
  var n:number = 0
  var stats: SheetStatsData = {type:'money'}
  $(tr).children('td').children('div.sheetField').each( (index:number, field:HTMLElement)=>{
    if(!$(field).parent().hasClass('rightStats') && !$(field).hasClass('date') && !$(field).hasClass('select')
    && ($(field).hasClass('moneyMask') || $(field).hasClass('Float') || $(field).hasClass('Integer') )){
      if(typeof stats.language === 'undefined')
        stats.language = $(field).attr('data-language')
      var value:string = $(field).attr('data-number') || module.exports.sheetField.getVal($(field))
      if(Number.isFinite(parseFloat(value))){
        n++
        total += parseFloat(value)
        if(!$(field).hasClass('moneyMask'))
          stats.type = 'float'
        if(stats.language !== $(field).attr('data-language'))
          stats.type = 'float'
      }
    }
  })
  if(n > 0){
    stats.average = parseFloat((total/n).toFixed(2))
    stats.total = parseFloat(total.toFixed(2))
  }
  if(stats.type === 'float')
    delete stats.language
  return stats
}

function statsCol(col:number):SheetStatsData{
  var total:number = 0
  var n:number = 0
  var stats:SheetStatsData = {type:'money'}
  $('table#sheet td.lines').each( function(this:HTMLElement){
    var $tr = $(this).parent()
    $($tr).children('td').each( (index2:number, td2:HTMLElement)=>{
      if(index2 === col-1)
        if(!$(td2).hasClass('bottomStats') && !$(td2).hasClass('rightStats'))
          if($(td2).children('div.sheetField').length > 0){
            var $field = $(td2).children('div.sheetField')
            if($($field).hasClass('moneyMask') || $($field).hasClass('Float') || $($field).hasClass('Integer')){
              if(typeof stats.language === 'undefined')
                stats.language = $($field).attr('data-language')
              var value:string = $($field).attr('data-number') || module.exports.sheetField.getVal($($field))
              if(Number.isFinite(parseFloat(value))){
                n++
                total += parseFloat(value)
                if(!$($field).hasClass('moneyMask'))
                  stats.type = 'float'
                if(stats.language !== $($field).attr('data-language'))
                  stats.type = 'float'
              }
            }
          }
    })
  })
  if(n > 0){
    stats.average = parseFloat((total/n).toFixed(2))
    stats.total = parseFloat(total.toFixed(2))
  }
  return stats
}

function insertFootLine(title:string, field:string){
  var split:string[] = field.split('.')
  var subField:string|null = null
  var stats:SheetStatsData
  if(split.length > 1){
    field = split[0]
    subField = split[1]
  }
  var $tr_footLine = $('<tr/>', {'class': 'footLine '+title}).appendTo('#sheet')
  if($('table#sheet tr#bottomStats').children('td').children('.arrow').css('border-top')?.split('px')[0] !== '0')
    $tr_footLine.hide()
  $('<td/>', {'class': 'null'}).appendTo($tr_footLine)
  for(var t:number=0;t<=module.exports.rowTitle.length-1;t++){
    var $td_footLine = $('<td/>', {'class': 'footLine'}).appendTo($tr_footLine)
    if(t === 0)
      $td_footLine.addClass('title statsTitle').html(title)
    else if(module.exports.rowTitle[t].type !== 'date'){
      var total_footLine:number = 0
      var n:number = 0
      stats = {type:'money'}
      $('table#sheet td.lines').each( (index:number, td:HTMLElement)=>{
        $(td).parent().children('td').each( (index2:number, td2:HTMLElement)=>{
          if(index2-1 === t)
            if(!$(td2).hasClass('bottomStats') && !$(td2).hasClass('rightStats')){
              if($(td2).children('div.sheetField').length > 0){
                var $this_sheetField = $(td2).children('div.sheetField')
                if(!$this_sheetField.hasClass('date')){
                  if(typeof stats.language === 'undefined')
                    stats.language = $this_sheetField.attr('data-language')

                  if(module.exports.dataSet.data[index] && module.exports.dataSet.data[index][index2-1]){
                    var cell_footLine: SheetCell = module.exports.dataSet.data[index][index2-1]
                    if( (typeof cell_footLine[field] === 'string' && Number.isFinite(parseFloat(cell_footLine[field]))) ||
                      typeof cell_footLine[field] === 'number' || typeof cell_footLine[field] === 'object' ){
                      if(subField === null && typeof cell_footLine[field] === 'number'){
                        total_footLine += cell_footLine[field]
                        n++
                      }else if(subField === null && typeof cell_footLine[field] === 'string' && Number.isFinite(parseFloat(cell_footLine[field]))){
                        total_footLine += parseFloat(cell_footLine[field])
                        n++
                      }else if(typeof subField === 'string' && typeof cell_footLine[field][subField] === 'number'){
                        total_footLine += cell_footLine[field][subField]
                        n++
                      }
                      if(!$this_sheetField.hasClass('moneyMask'))
                        stats.type = 'float'
                      if(stats.language !== $this_sheetField.attr('data-language'))
                        stats.type = 'float'
                    }
                  }
                }
              }
            }
        })
      })
      if(n > 0)
        module.exports.sheetField.createField(stats.type, stats.language, total_footLine).appendTo($td_footLine).attr('readonly', 'true')
    }
  }

  if($('#rightStats').length > 0){
    var $td_avg = $('<td/>', {'class': 'footLine rightStats not'}).appendTo($tr_footLine)
    stats = statsLine($('tr.footLine.'+title))
    module.exports.sheetField.createField(stats.type, stats.language, stats.average || '').appendTo($td_avg).attr('readonly', 'true')
    var $td_total = $('<td/>', {'class': 'footLine rightStats not'}).appendTo($tr_footLine)
    module.exports.sheetField.createField(stats.type, stats.language, stats.total || '').appendTo($td_total).attr('readonly', 'true')
    if($('table#sheet #rightStats').children('.arrow').css('border-right').split('px')[0] === '0'){
      $td_avg.hide()
      $td_total.hide()
    }
  }
}
