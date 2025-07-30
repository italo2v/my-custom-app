var $body = $('body')
//const { ipcRenderer, remote, shell } = require( "electron" )
//const { box, alertBox, confirmBox, boxProfile, boxAdminPassword, listLanguages } = require('./ITEMS/UI.js')
const { ipcRenderer } = require( "electron" )
const { box, alertBox, confirmBox, listLanguages, shortKeys, setShortKeys }: UI = require('./ITEMS/UI.js')
const mainMenu: MainMenu = require('./ITEMS/mainMenu.js')
const mainMenuData = require('../DataConfig/buttonsData.js')
const sheetPanel: SheetPanel = require('./sheetPanel.js')
const reports: Reports = require('./reports.js')
var dataSetNames:DataSetNames = {}
var datalanguage: DataLanguage = []
var myUser: MyUser
var systemConfig: ViewSystemConfig
var version: string = '1.0.0'

interface LanguageItem {
  key: string;
  value: string;
}
type DataLanguage = Array<LanguageItem>
interface IpcRendererEvent {
  preventDefault: () => void;
  sender: any;
  returnValue: any;
  ctrlKey ? : boolean;
  metaKey ? : boolean;
  shiftKey ? : boolean;
  altKey ? : boolean;
}
interface ViewSystemConfig {
  language: string;
  mongo_db: MongoDBConfig;
  textSize: string;
  theme: string;
}
interface MyUser {
  login: string;
  password: string;
  email: string;
}
interface DataSetNames {
  [name: string]: string
}

function dataLanguage(key: string): string{
  var result = ''
  datalanguage.forEach( (item: LanguageItem)=>{
    if(item.key === key){
      result = item.value
      return false
    }
  })
  return result
}

window.onload = () => {
  
  $('<div>', {'id': 'lock'}).hide().appendTo($body)

  /*ipcRenderer.on('check-savedata', (event: IpcRendererEvent)=>{
    if($('#sheetPanel').html())
      sheetPanel.save()
    ipcRenderer.send('quitapp')
  })*/

  ipcRenderer.on('change-language', (event: IpcRendererEvent, lang: object | undefined) => {
    if(typeof lang !== 'undefined'){
      Object.entries(lang).forEach( (entry: string[])=>{
        var langItem: LanguageItem = {key: entry[0], value: entry[1]}
        datalanguage.push(langItem)
      })
      alertBox(dataLanguage('slogan'))
    }

    $('#pageTitle').html(dataLanguage('title'))
    mainMenu.menuItems = [
      {'type': 'button', 'id': 'update', 'title': 'CTRL+U', 'text': 'update', 'pos': 'left'},
      {'type': 'button', 'id': 'cancel', 'title': 'ESC', 'text': 'cancel', 'pos': 'left'},
      {'type': 'button', 'id': 'close', 'title': 'ESC', 'text': 'close', 'pos': 'left'},
      {'type': 'button', 'id': 'about', 'title': 'CTRL+A', 'text': 'about', 'pos': 'right'},
      {'type': 'menu', 'id': 'systemConfig', 'title': 'CTRL+ALT+C', 'text': 'configuration', 'pos': 'right', 'items': [
        {'submenu': true, 'text': 'textsize', 'items': [
          {'id': 'smallText', 'text': 'small', title: 'CTRL+ALT+S', 'function': changeTextSize},
          {'id': 'mediumText', 'text': 'medium', title: 'CTRL+ALT+M', 'function': changeTextSize},
          {'id': 'largeText', 'text': 'large', title: 'CTRL+ALT+A', 'function': changeTextSize}
        ]},
        {'submenu': true, 'text': 'theme', 'items': [
          {'id': 'blueTheme', 'text': 'blue', title: 'CTRL+ALT+B', 'function': changeTheme},
          {'id': 'goldTheme', 'text': 'gold', title: 'CTRL+ALT+G', 'function': changeTheme},
          {'id': 'greenTheme', 'text': 'green', title: 'CTRL+ALT+R', 'function': changeTheme}
        ]},
        {'id': 'backupData', 'text': 'backupdata', title: 'CTRL+ALT+K', 'function': backupData},
      ]},
      {'type': 'menu', 'id': 'systemLanguage', 'title': 'CTRL+ALT+L', 'text': 'language', 'pos': 'right', 'items': []},
    ]
    var dataButtons = JSON.parse(JSON.stringify(mainMenuData.buttons))
    var updateFunctions = (item:any)=>{
      if(item.panel === 'sheetData'){
        item.function = showSheetPanel
        if(typeof item.id === 'string' && typeof item.menuTitle === 'string')
          dataSetNames[item.id] = dataLanguage(item.menuTitle)
      }
      else if(item.panel === 'reports')
        item.function = showReports
      if(typeof item.title === 'string' && typeof item.id === 'string')
        if(item.title[0] === 'F' || item.title.indexOf('CTRL+') !== -1 || item.title.indexOf('CTRL+ALT+') !== -1 || item.title.indexOf('ALT+') !== -1 || item.title.indexOf('CTRL+SHIFT+') !== -1 || item.title.indexOf('ALT+SHIFT+') !== -1){
          shortKeys[item.title] = {id: item.id}
          if(item.type === 'menu')
            shortKeys[item.title].dropdown = true
        }
    }
    dataButtons.forEach( (button:MenuItem)=>{
      button.pos = 'left'
      button.data = true
      if(typeof button.panel === 'string' || typeof button.title === 'string')
        updateFunctions(button)
      if(Array.isArray(button.items))
        button['items'].forEach( (dropdownItem:any)=>{
          if(typeof dropdownItem.panel === 'string' || typeof dropdownItem.title === 'string')
             updateFunctions(dropdownItem)
          if(Array.isArray(dropdownItem.items))
            dropdownItem.items.forEach( (dropdownSubItem:any)=>{
              if(typeof dropdownSubItem.panel === 'string' || typeof dropdownSubItem.title === 'string')
                 updateFunctions(dropdownSubItem)
            })
        })
    })
    mainMenu.menuItems = mainMenu.menuItems.concat(dataButtons)
    mainMenu.create()
    mainMenuFunctions()
    setShortKeys()
    $('.mainPanel').remove()
    getSystemConfig()
    listLanguages($('#systemLanguage ul'))
    //ipcRenderer.send('check-adminpassword')
  })

  /*ipcRenderer.once('change-adminpassword', (event: IpcRendererEvent) =>{
    boxAdminPassword()
  })*/

  ipcRenderer.on('change-theme', (event: IpcRendererEvent, changed_theme: string)=>{
    var theme: string = (changed_theme === 'goldTheme') ? 'gold' : (changed_theme === 'greenTheme') ? 'green' : (changed_theme === 'blueTheme') ? 'blue' : 'blue'
    $('#themePage').attr('href', './css/themes/'+theme+'.css')
    setTimeout( function(){
      reports.updatePrintImage()
    }, 100)
  })
  ipcRenderer.on('change-textsize', (event: IpcRendererEvent, changed_textSize: string)=>{
    var textSize = (changed_textSize === 'smallText') ? 'small' : (changed_textSize === 'mediumText') ? 'medium' : (changed_textSize === 'largeText') ? 'large' : 'medium'
    $('#fontSize').attr('href', './css/textsize/'+textSize+'.css')
    setTimeout( function(){
      reports.updatePrintImage()
      sheetPanel.tabs.sheet.updateDotPosition()
    }, 100)
  })
}

function changeTextSize(this: { id: string }){
  var textSize: string = $(this).attr('id') as string
  ipcRenderer.send('change-textsize', textSize)
}

function changeTheme(this: { id: string }){
  var theme: string = $(this).attr('id') as string
  ipcRenderer.send('change-theme', theme)
}

function backupData(){
  ipcRenderer.send('backup-data')
  ipcRenderer.once('backup-data', (event: IpcRendererEvent, link: string)=>{
    window.location.href = link
  })
}

function getSystemConfig(){
  ipcRenderer.send('get-systemconfig', '')
  ipcRenderer.once('get-systemconfig', (event: IpcRendererEvent, config: ViewSystemConfig) => {
    systemConfig = config
  })
}

function send(name: string, arg: any, ok: string, otherFn?: ()=>void){
  ipcRenderer.send(name, {'myUser': myUser, 'arg': arg})
  ipcRenderer.once(name, (event: IpcRendererEvent, result: string) => {
    if(result !== 'emptyinserted')
      alertBox(dataLanguage(result))
    if(result === ok){
      sheetPanel.close()
      mainMenu.defaultMenu()
    }
    if(typeof otherFn !== 'undefined')
      otherFn()
  })
}

function get(name: string, arg: any, otherFn?: (result: any)=>any){
  ipcRenderer.send(name, {'myUser': myUser, 'arg': arg})
  ipcRenderer.once(name, (event: IpcRendererEvent, result: string | undefined | object) => {
    if(result === undefined || result === '' && typeof result !== 'object'){
      $('.mainPanel').remove()
      mainMenu.defaultMenu()
      alertBox(dataLanguage('getdataerror'))
    }else if(typeof otherFn !== 'undefined')
        otherFn(result)
  })
}

function showSheetPanel(this: { id: string }){
  var dataID: string = $(this).attr('id') as string
  if(typeof dataID !== 'string'){
    alertBox(dataLanguage('undefinedid'))
    mainMenu.defaultMenu()
    return
  }
  var $pageTitle = $('#pageTitle')
  mainMenu.hideItems()
  sheetPanel.showPanel(dataID)
  $('#update').show().off('click').on("click", function(){
    sheetPanel.save()
    $pageTitle.html(dataLanguage('title'))
  })
  $('#cancel').show().off('click').on("click", function(){
    confirmBox(dataLanguage('askcancel'), () => {
      mainMenu.defaultMenu()
      sheetPanel.close()
      $('#lock').hide()
      $pageTitle.html(dataLanguage('title'))
    })
  })
}

function showReports(this: {id: string}){
  var reportID: string = $(this).attr('id') as string
  if(typeof reportID !== 'string'){
    alertBox(dataLanguage('undefinedid'))
    mainMenu.defaultMenu()
    return
  }
  mainMenu.hideItems()
  reports.showReport(reportID)
  $('#close').show()
}

function mainMenuFunctions(){
  /*$('#configuration').on("click", function(){
    if(typeof myUser.login !== 'undefined'){
      configurationPanel.showConfigurationPanel()
      $('#update').show().off('click').on("click", configurationPanel.update)
      $('#close').show()
    }else
      boxProfile()
  })
  $('#quitadmin').on("click", function(){
    myUser = {login: '', password: '', email: ''}
    mainMenu.defaultMenu()
    $('.mainPanel').remove()
  })*/
  $('#close').on("click", function(){
    if($('#sheetPanel').html())
      confirmBox(dataLanguage('askclose'), ()=> {
        mainMenu.defaultMenu()
        sheetPanel.close()
        $('#lock').hide()
        $('#pageTitle').html(dataLanguage('title'))
      })
    else{
      mainMenu.defaultMenu()
      $('.mainPanel').remove()
      $('#pageTitle').html(dataLanguage('title'))
    }
    $('#mainMenu a.downloadLink').remove()
  })
  $('#about').on("click", function(){
    var $message = $('<span/>').html(dataLanguage('textabout')+'<br/><b>'+dataLanguage('version')+': '+version+'</b>')
    box(dataLanguage('about'), $message.prop('outerHTML'))
  })
  /*$('#quit').on("click", function(){
    if($('#sheetPanel').html())
      confirmBox(dataLanguage('askclose'), ()=> {
        sheetPanel.save( ()=>{
          ipcRenderer.send('quit')
        })
      })
    else
      ipcRenderer.send('quit')
  })*/
}