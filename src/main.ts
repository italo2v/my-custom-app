const {ipcMain, app, BrowserWindow, session, remote}:any = require('electron')
const path:any = require('path')
const controls: Controls = require('./Control/controls.js')
const baseURL = 'http://localhost/'
var my_diaglanguage: MyDialog

interface ListControls {
  listen: string;
  control: any;
}

interface MyDialog {
  yes: string;
  no: string;
  confirm: string;
  askquit: string;
}

interface WindowBounds {
  x:number;
  y:number;
  width:number;
  height:number;
}

interface LoginData {
  login:string;
  password:string;
}

const listControls: ListControls[] = [
  {listen: 'save-data', control: controls.saveData},
  {listen: 'get-data', control: controls.getData},
  {listen: 'get-entriesdata', control: controls.getEntriesData},
  {listen: 'verify-foreignkey', control: controls.verifyForeignKey},
  {listen: 'get-reportdata', control: controls.getReportData},
  {listen: 'get-reportyearstabs', control: controls.getReportYearsTabs},
  {listen: 'register-stock', control: controls.registerStock},
  {listen: 'get-stock', control: controls.getStock},
  {listen: 'list-languages', control: controls.listLanguages},
  {listen: 'get-systemconfig', control: controls.getSystemConfig},
  {listen: 'update-systemconfig', control: controls.updateSystemConfig},
  {listen: 'change-adminpassword', control: controls.changeAdminPassword},
  {listen: 'backup-data', control: controls.backupData}
]

listControls.forEach( (item: ListControls) => {
ipcMain.on(item.listen, (event:any , arg:string|object) => {
    item.control(arg, (result:any) => {
      event.reply(item.listen, result)
    })
  })
})

ipcMain.on('change-language', (event: any, language:string) => {
  setCookie('langLocale', language, function(){
    getLanguage( (datalanguage: LangText) => {
      event.reply('change-language', datalanguage)
    })
  })
})

function getLanguage(callback: (datalanguage: LangText)=>void){
  getCookie('langLocale', (language:string)=>{
    controls.getLanguage(language, (datalanguage:LangText)=>{
      my_diaglanguage = {'yes': datalanguage['yes'], 'no': datalanguage['no'], 'confirm': datalanguage['confirm'], 'askquit': datalanguage['askquit']}
      controls.systemConfig.langLocale = datalanguage['langLocale']
      callback(datalanguage)
    })
  })
}

ipcMain.on('change-theme', (event:any, theme:string) => {
  if(theme === '')
    getCookie('theme', (this_theme:string)=>{
      event.reply('change-theme', this_theme)
    })
  else
    setCookie('theme', theme, function(){
      controls.systemConfig.theme = theme
      event.reply('change-theme', theme)
    })
})

ipcMain.on('change-textsize', (event:any, textSize:string) => {
  if(textSize === '')
    getCookie('textSize', (this_textSize:string)=>{
      event.reply('change-textsize', this_textSize)
    })
  else
    setCookie('textSize', textSize, function(){
      controls.systemConfig.textSize = textSize
      event.reply('change-textsize', textSize)
    })
})

function getCookie(cookie_name:string, callback:Function){
  session.defaultSession.cookies.get({ url: baseURL, name: cookie_name}).then((cookies: {value:string}[]) => {
    if(typeof cookies[0] !== 'undefined' && cookies[0].value !== '')
      callback(cookies[0].value)
    else if(cookie_name === 'theme' || cookie_name === 'textSize' || cookie_name === 'langLocale')
      callback(controls.systemConfig[cookie_name])
    else
      callback('')
  }).catch((error:string) => {
    console.log(error)
  })
}

function setCookie(cookie_name:string, value: string, callback:Function){
  const cookie = { url: baseURL, name: cookie_name, value: value, expirationDate: new Date().getTime()+30*24*3600*1000}
  session.defaultSession.cookies.set(cookie)
  .then(()=>{
    callback()
  }, (error:string) => {
    console.error(error)
  })
}

/*ipcMain.on('check-adminpassword', (event)=>{
  controls.getAdminPassword('', (passwd)=>{
    if(passwd == 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI='){ //'123456'
      event.reply('change-adminpassword')
    }
  })
})

ipcMain.on('login', (event:any, data: { myUser:string, arg:LoginData }) => {
  controls.getAdminPassword('', (adminpasswd:string)=>{
    if(data.arg.login === 'admin' && data.arg.password === adminpasswd){
      setCookie('login', data.arg.password, function(){
        event.reply('login', 'authenticated')
      })
    }else{
      event.reply('login', 'invalidlogin')
    }
  })
})*/

ipcMain.on('quit', (event:any) => {
  //event.reply('check-savedata')
  //ipcMain.once('quitapp', (event)=>{
    app.quit()
  //})
})

function createWindow () {
  // Create the browser window.
  const mainWindow:any = new BrowserWindow({
    //width: 1920,
    //height: 1080,
    icon: path.join(__dirname, '../icon.png'), //Credits: flaticon.com
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false
    }
  })
  getCookie('windowPosition', (position:string)=>{
    if(position.split('{').length > 1 && position.split('}').length > 1){
      var bounds:WindowBounds = JSON.parse(position)
      mainWindow.setBounds({x:bounds.x, y:bounds.y, width:bounds.width, height:bounds.height})
    }else{
      mainWindow.setBounds({width: 1920, height: 1080})
      mainWindow.maximize()
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, './View/index.html'))
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.removeMenu()
    mainWindow.setMenuBarVisibility(false)
    controls.systemConfig.userDataPath = (app || remote.app).getPath('userData')
    controls.systemConfig.appPath = (app || remote.app).getAppPath()
    //console.log((app || remote.app).getPath('userData'))
    controls.getSystemConfig('', (config: ServerSystemConfig)=>{
      config.userDataPath = controls.systemConfig.userDataPath
      config.appPath = controls.systemConfig.appPath
      controls.systemConfig = config
      getLanguage( (datalanguage:LangText) => {
        mainWindow.webContents.send('change-language', datalanguage)
      })
      getCookie('theme', (theme:string) => {
        mainWindow.webContents.send('change-theme', theme)
      })
      getCookie('textSize', (textSize:string) => {
        mainWindow.webContents.send('change-textsize', textSize)
      })
    })
  })
  mainWindow.on('close', function(e:any) {
    setCookie('windowPosition', JSON.stringify(mainWindow.getBounds()), function(){
      mainWindow.webContents.send('check-savedata')
      var yes:string = my_diaglanguage['yes'] || 'yes'
      var no:string = my_diaglanguage['no'] || 'no'
      var title:string = my_diaglanguage['confirm'] || 'Confirm'
      var ask:string = my_diaglanguage['askquit'] || 'Are you sure you want to quit?' //@ts-ignore
      const choice:any = require('electron').dialog.showMessageBoxSync(this,
        {
          type: 'question',
          buttons: [yes, no],
          title: title,
          message: ask
        })
      if (choice === 1)
        e.preventDefault()
      else
        mainWindow.webContents.send('quit')
    })
  })

  // Open the DevTools.
  //var devtools = new BrowserWindow()
  //mainWindow.webContents.setDevToolsWebContents(devtools.webContents)
  //mainWindow.webContents.openDevTools({ mode: 'detach' })
  //mainWindow.webContents.openDevTools()


}
app.commandLine.appendSwitch('disable-gpu-sandbox')

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () =>  {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
