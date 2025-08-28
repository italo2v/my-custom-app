const clickMenu: RightClickMenu = require('./rightClickMenu.js')
//const { confirmBox, alertBox }: UI = require('./UI.js')

interface Tabs {
  dataSet: TabDataSet;
  sheet: Sheet;
  showTabs: ($place:JQuery)=>void;
  deleteTabRules: ((tabNumber: number, callback: (allow: boolean)=>void)=>void)[];
}
interface TabDataSet {
  [tab: string]: SheetDataSet;
}

module.exports = {
  dataSet: {},
  sheet: require('./sheet.js'),
  showTabs: ($place: JQuery) => {
    $place.html('')
    listTabs($place)
    if($('a.sheetTab').length === 0){
      var selectedYear:number = parseInt($('#yearData').html())
      var actualYear:number = new Date().getFullYear()
      if(selectedYear === actualYear)
        $('#addTab').trigger("click")
    }else{
      module.exports.sheet.dataSet = module.exports.dataSet[$('a.sheetTab.active').html()]
      module.exports.sheet.showSheet($('#spreadSheet'))
    }
  },
  deleteTabRules: []
}

$body.on("mousedown", function(e: JQuery.MouseDownEvent){
  //close menu if click outside
  if(!$(e.target).hasClass('sheetTab') || e.button !== 2)
    clickMenu.close('tabsMenu')

  //close editNameTab if click outside the sheet tab button
  var $fieldName = $('a.sheetTab input.fieldNameTab')
  if($fieldName.length > 0 && !$(e.target).hasClass('fieldNameTab') && $(e.target).children('input.fieldNameTab').length === 0 && e.target.id !== 'renameTab'){
    var $a = $fieldName.parent()
    Object.keys(module.exports.dataSet).forEach( (tabName:string)=>{
      if(module.exports.dataSet[tabName].tabNumber === parseInt($a.attr('data-tabNumber')||''))
        $a.html(tabName)
    })
  }
})

function listTabs($place: JQuery){
  $place.html('')
  $('<br/>').appendTo($place)
  $('<div>', {'id': 'spreadSheet'}).appendTo($place)
  var tabs: string[] = Object.keys(module.exports.dataSet)
  var activeTab: string = tabs[0]
  tabs.sort( (a:string, b:string)=>{
    return module.exports.dataSet[a].tabNumber - module.exports.dataSet[b].tabNumber
  })
  $('<table>', {'class': 'sheetTabs'}).appendTo($place)
  $('<tr/>').appendTo('table.sheetTabs')
  $('<td/>').appendTo('table.sheetTabs tr')
  tabs.forEach( (tabName:string, t:number)=>{
    var dataSet: SheetDataSet = module.exports.dataSet[tabName]
    if(dataSet.active || tabs.length === 1)
      activeTab = tabName
    dataSet.tabNumber = t
    var $a = $('<a/>', {'data-tabNumber': dataSet.tabNumber, 'class': 'btn btn-primary sheetTab', 'href': '#'}).text(tabName).appendTo('table.sheetTabs tr td')
    $a.on("click", function(e: JQuery.ClickEvent) {
        var that: HTMLElement = this
        setTimeout(function() {
            var dblclick:number = parseInt($(that).data('double'), 10)
            if (dblclick > 0) {
                $(that).data('double', dblclick-1)
            } else {// @ts-ignore
              changeTab.call(that, e)
            }
        }, 300)
    }).on("dblclick", function() {
        $(this).data('double', 2)
        if($('input.fieldNameTab').length === 0)
          showInputNameTab(parseInt($(this).attr('data-tabNumber')||''))
    })
  })
  $('<a/>', {'id': 'addTab', 'class': 'btn btn-primary addSheetTab', 'href': '#'}).text('+').appendTo('table.sheetTabs tr td').on("click", function(){createEmptyTab($place)})
  $('a.sheetTab').each( function(this: HTMLElement){
    if($(this).html() === activeTab)
      $(this).addClass('active')
  }).off('mousedown').on("mousedown", function(e: JQuery.MouseDownEvent){
    if($(e.target).children('input').length === 0 && e.button === 2){
      var tabNumber:number = parseInt($(e.target).attr('data-tabNumber')||'0')
      clickMenu.menuItems = [
          {'id': 'newTab', 'function': function(){createEmptyTab($place)}, 'text': dataLanguage('newtab')},
          {'id': 'renameTab', 'function': function(){showInputNameTab(tabNumber)}, 'text': dataLanguage('rename')},
          {'id': 'deleteTab', 'function': function(){deleteTab(tabNumber)}, 'text': dataLanguage('delete')}
        ]
      if(tabNumber > 0)
        clickMenu.menuItems.push({'id': 'moveLeftTab', 'function': function(){moveTab('left', tabNumber)}, 'text': dataLanguage('moveleft')})
      if(tabNumber < Object.keys(module.exports.dataSet).length-1)
        clickMenu.menuItems.push({'id': 'moveRightTab', 'function': function(){moveTab('right', tabNumber)}, 'text': dataLanguage('moveright')})
      clickMenu.showMenu('tabsMenu', $(e.target).html())
    }
  })
}

function createEmptyTab($place: JQuery){
  var tabs: string[] = Object.keys(module.exports.dataSet)
  var tabNumber:number = tabs.length
  var this_dataSet: SheetDataSet = {'data': [], 'active': true, 'tabNumber': tabNumber}
  var n:number=1
  var newtab:string = dataLanguage('newtab')
  if(module.exports.dataSet[newtab] === undefined)
    module.exports.dataSet[newtab] = this_dataSet
  else{
    while(module.exports.dataSet[newtab+n] !== undefined)
      n++
    module.exports.dataSet[newtab+n] = this_dataSet
  }
  var $activeTab = $('a.sheetTab.active')
  if($activeTab.length > 0 && module.exports.sheet.dataSet.data.length > 0){
    module.exports.sheet.updateData()
    module.exports.dataSet[$activeTab.html()] = module.exports.sheet.dataSet
    delete module.exports.dataSet[$activeTab.html()].active
  }
  module.exports.sheet.dataSet = this_dataSet
  listTabs($place)
  module.exports.sheet.showSheet($('#spreadSheet'))
}

function changeTab(this:HTMLElement){
  if($(this).children('input.fieldNameTab').length > 0)
    return
  module.exports.sheet.updateData()
  $('a.sheetTab').removeClass('active')
  $(this).addClass('active')
  Object.keys(module.exports.dataSet).forEach( (tabName:string)=>{
    if(module.exports.dataSet[tabName].active !== undefined)
      delete module.exports.dataSet[tabName].active
    if($(this).html() === tabName){
      module.exports.dataSet[tabName].active = true
      module.exports.sheet.dataSet = module.exports.dataSet[tabName]
    }
  })
  module.exports.sheet.showSheet($('#spreadSheet'))
}

function showInputNameTab(tabNumber:number){
  if($('a.sheetTab input.fieldNameTab').length > 0)
    return
  $('a.sheetTab').each(function(index:number, tab:HTMLElement){
    if(parseInt($(tab).attr('data-tabNumber')||'') === tabNumber){
      $(tab).attr('data-value', $(tab).html())
      $(tab).html('')

      var $input = $('<input/>', {'type': 'text', 'maxlength': 50, 'class': 'large fieldNameTab lettersAndNumbers'}).appendTo(tab).on("keyup", function(e: JQuery.KeyUpEvent){
        if(e.key === 'Enter'){ //enter
          var nameexists:boolean = false
          var name_value:string = $(this).val()?.toString()||''
          var old_value:string = $(this).parent().attr('data-value')||''
          Object.keys(module.exports.dataSet).forEach( (this_tabName:string)=>{
            if(module.exports.dataSet[this_tabName].tabNumber !== parseInt($(tab).attr('data-tabNumber')||'') && this_tabName === name_value){
              alertBox(dataLanguage('tabnameexists'))
              nameexists = true
            }
          })
          if(!nameexists && name_value !== ''){
            if(name_value !== old_value){
              module.exports.dataSet[name_value] = module.exports.dataSet[old_value]
              delete module.exports.dataSet[old_value]
            }
            $(this).parent().html(name_value)
          }
        }
      }).on('input', function() {
          $(this).val( $(this).val()?.toString().replace(/[^a-z0-9áàâãéèêíïóôõöúçñ -]+$/i,'')||'' )
      })
      setTimeout(function(){
        $input.val($(tab).attr('data-value')||'').trigger("select")
      }, 10)
    }
  })
}

function deleteTab(tabNumber:number){
  confirmBox(dataLanguage('askdeletetab'), () => {
    var verifyRule = function(rules:Function[], pos:number){
      if(typeof rules[pos] === 'function'){
        rules[pos](tabNumber, (allow:boolean)=>{
          if(allow){
            pos++
            verifyRule(rules, pos)
          }
        })
      }else{
        var number:number = 0
        var newTab:number = -1
        var $sheetTabs = $('a.sheetTab')
        $sheetTabs.each(function(index:number, tab:HTMLElement){
          if( parseInt($(tab).attr('data-tabNumber')||'') === tabNumber){
            if($(tab).hasClass('active')){
              if(tabNumber === 0)
                newTab = 0
              else
                newTab = tabNumber-1
               $('table.sheetTabs a.sheetTab[data-tabNumber="'+newTab+'"]').addClass('active')
            }
            var deletedTabName:string = $(tab).html()
            delete module.exports.dataSet[deletedTabName]
            $(tab).remove()
          }else{
            module.exports.dataSet[$(tab).html()].tabNumber = number
            $(tab).attr('data-tabNumber', number)
            number++
          }
        })
        var $spreadSheet = $('#spreadSheet')
        var $activeTab = $('table.sheetTabs a.sheetTab.active')
        if($activeTab.length > 0){
          module.exports.dataSet[$activeTab.html()].active = true
          module.exports.sheet.dataSet = module.exports.dataSet[$activeTab.html()]
          module.exports.sheet.showSheet($spreadSheet)
        }else{
          module.exports.sheet.dataSet = {}
          $spreadSheet.html('')
        }
      }
    }
    verifyRule(module.exports.deleteTabRules, 0)
  })
}

function moveTab(direction:string, tabNumber:number){
  var new_pos:number
  var $sheetTabs = $('a.sheetTab')
  if(direction === 'left')
    new_pos = tabNumber-1
  else if(direction === 'right')
    new_pos = tabNumber+1
  else
    return
  if(new_pos < 0)
    new_pos = 0
  else if(new_pos > $sheetTabs.length-1)
    new_pos = $sheetTabs.length-1
  $sheetTabs.each( function(this: HTMLElement){
    var sheetTabDataSet:SheetDataSet = module.exports.dataSet[$(this).html()]
    if(sheetTabDataSet.tabNumber === tabNumber){
      sheetTabDataSet.tabNumber = new_pos
      $(this).attr('data-tabNumber', new_pos)
    }
    else if(sheetTabDataSet.tabNumber === new_pos){
      if(direction === 'left')
        sheetTabDataSet.tabNumber += 1
      else if(direction === 'right')
        sheetTabDataSet.tabNumber -= 1
      $(this).attr('data-tabNumber', sheetTabDataSet.tabNumber)
    }
  })
  $('table.sheetTabs a.sheetTab').toArray().sort( (a:HTMLElement, b:HTMLElement)=>{
    return parseInt($(a).attr('data-tabNumber')||'') - parseInt($(b).attr('data-tabNumber')||'')
  }).forEach( (sheetTab: HTMLElement)=>{
    $(sheetTab).appendTo('table.sheetTabs')
  })
  $('#addTab').appendTo('table.sheetTabs')
}
