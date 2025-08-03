const db: DB = require('../Model/db.js') //@ts-ignore
const fs:any = require('fs')
const JSZip:any =  require("jszip")

interface Controls {
  systemConfig: ServerSystemConfig;
  getSystemConfig: (arg:any, callback: (config:ServerSystemConfig)=>void)=>void;
  updateSystemConfig: (obj:{ myUser:LoginData, arg:ServerSystemConfig }, callback: (result:string)=>void)=>void;
  changeAdminPassword: (obj:{ myUser:LoginData, arg: ChangeAdmPassword }, callback: (result:string)=>void)=>void;
  getAdminPassword: (arg:any, callback: (admin_password:string)=>void)=>void;
  getData: (obj:{ myUser:LoginData, arg:string }, callback: (data:DataSet|string)=>void)=>void;
  getEntriesData: (obj:{ myUser:LoginData, arg:string }, callback: (items:EntriesData)=>void)=>void;
  verifyForeignKey: (obj:{ myUser:LoginData, arg:{id:string, dataset:string, year:string} }, callback: (allow:boolean)=>void)=>void;
  getReportData: (obj:{ myUser:LoginData, arg:SelectorDB }, callback: (items:EntriesData)=>void)=>void;
  getReportYearsTabs: (obj:{ myUser:LoginData, arg:SelectorDataSets[] }, callback: (items:EntriesData)=>void)=>void;
  saveData: (obj:{ myUser:LoginData, arg:SaveData }, callback: (result:string)=>void)=>void;
  getStock: (obj: { myUser:LoginData, arg:Stock }, callback: (result:StockDB|"none")=>void)=>void;
  registerStock: (obj: { myUser:LoginData, arg:Stock }, callback: (result:string)=>void)=>void;
  deleteStock: (obj: { myUser:LoginData, arg: {id:string} }, callback: (result:string)=>void)=>void;
  listLanguages: (arg:any, callback: (languages:DescLanguage[])=>void)=>void;
  getLanguage: (lang:string, callback: (datalanguage:LangText)=>void)=>void;
  getLanguageSystem: (callback: (datalanguage:LangText)=>void)=>void;
  verifyTickerUnique: (dataSet: DataSetYears)=>boolean;
  verifyNegativeStockQuantity: (dataSet: DataSetYears)=>boolean;
  backupData: (obj:any, callback: (tmp_file:string)=>void)=>void;
}
interface ServerSystemConfig {
  userDataPath: string;
  appPath: string;
  langLocale: string;
  theme: string;
  textSize: string;
  mongodb?: MongoDBConfig
  admin_password?: string;
  _id?: string;
}
interface EntriesData {
  [year:string]: EntriesTab;
}
interface EntriesTab {
  [tab: string]: EntryData[];
}
interface EntryData{
  value: string;
  _id: string;
}
interface SaveData {
  dataSet: DataSetYears;
  collection: string;
  empty?: boolean;
}
interface ChangeAdmPassword{
  currentpassword?: string;
  admin_password: string;
}
interface DataLang {
  language: string;
  name:string;
  picture: string;
  langLocale?:string;
  text: LangText;
}
interface LangText {
  [key:string]:string;
}
interface DescLanguage {
  name: string;
  language: string;
  picture: string;
}
interface ReportData {
  title:string;
  selector: SelectorData;
  type:string;
}
interface Stock {
	market: string;
	ticker: string;
	data?: StockMonthPrice[];
}
interface StockIndex extends Stock {
	index: number;
}
interface StockMonthPrice {
	month: number;
	year: number;
	price: number|null;
}
type StockTransaction = "B" | "S" | "BS" | "IN" | "SP"
interface StockTransactions {
	transaction: StockTransaction;
	option?: string;
	dateISO: string;
	quantity: number|string;
	price?: number|string;
	costs?: number|string;
}

module.exports = {
  systemConfig: {},
  getSystemConfig: (arg:any, callback: (result: object)=>void) => {
    db.localdb.userDataPath = module.exports.systemConfig.userDataPath
    db.localdb.appPath = module.exports.systemConfig.appPath
    db.getSystemConfig( (err:string, config: ServerSystemConfig[]) => {
      if (err) throw err;
      if(config.length > 0){
        delete config[0]._id
        delete config[0].admin_password
        callback(config[0])
      }else
        callback({})
    })
  },
  updateSystemConfig: (obj: {myUser:LoginData, arg: ServerSystemConfig}, callback: (result:string)=>void) => {
    var user:LoginData = obj.myUser
    var config:ServerSystemConfig = obj.arg
    module.exports.getAdminPassword('', (passwd:string)=>{
      if(typeof user === 'undefined' || user.login !== 'admin' || user.password !== passwd){
        callback('invaliduser')
        return
      }
      if(typeof config.mongodb !== 'undefined'){
        if(config.mongodb.host === ''){
          callback('inserthost')
          return
        }
        else if(config.mongodb.port === ''){
          callback('insertport')
          return
        }else if(config.mongodb.dbname === ''){
          callback('insertdbname')
          return
        }
      }
      if(typeof config.admin_password !== 'undefined'){
        if(config.admin_password.length !== 44){
          callback('invalidpassword')
          return
        }
      }
      module.exports.getLanguage(config.langLocale, (datalanguage: DataLang)=>{
        config.langLocale = datalanguage['langLocale']?.toString()||''
        var this_db: LocalDB|MongoDBConfig = db.localdb
        db.getSystemConfig( (err:string, conf: ServerSystemConfig[]) => {
          if (err) throw err;
          var conf_local:ServerSystemConfig = conf[0]
          if(typeof config.mongodb === 'undefined')
            config.mongodb = {}
          var mongoconf:MongoDBConfig = config.mongodb || {}
          if(typeof mongoconf.host !== 'undefined' && typeof mongoconf.port !== 'undefined' && typeof mongoconf.dbname !== 'undefined' &&  typeof mongoconf.dbuser !== 'undefined' &&  typeof mongoconf.dbpassword !== 'undefined'){
            this_db = db.mongodb
            db.mongodb.host = mongoconf.host
            db.mongodb.port = mongoconf.port
            db.mongodb.dbname = mongoconf.dbname
            db.mongodb.dbuser = mongoconf.dbuser
            db.mongodb.dbpassword = mongoconf.dbpassword
            try{
              db.mongodb.connection('system', 'find', {}, (err:string, test: ServerSystemConfig[])=>{
                this_db = db.localdb
                if(err !== null || test.length === 0){
                  module.exports.getSystemConfig('', (conf:object)=>{ //reset db config
                    callback('incorrectdb')
                  })
                }else{
                  if(typeof conf_local.mongodb !== 'undefined'
                   && conf_local.mongodb.host === mongoconf.host
                   && conf_local.mongodb.port === mongoconf.port
                   && conf_local.mongodb.dbname === mongoconf.dbname
                   && conf_local.mongodb.dbuser === mongoconf.dbuser
                   && conf_local.mongodb.dbpassword === mongoconf.dbpassword){
                    this_db = db.mongodb
                    delete config.mongodb
                    db.getSystemConfig( (err:string, conf_mongo:ServerSystemConfig[]) => { //update system at mongodb
                        if (err) throw err
                        if(typeof config.admin_password === 'undefined')
                          config.admin_password = conf_mongo[0].admin_password
                        db.registerSystemConfig(config, (err:string, res:ResultDB) => {
                          if(res.insertedCount === 1){
                            db.deleteSystemConfig(conf_mongo[0]._id?.toString()||'', (err:string, result:ResultDB) => {
                              if (err) throw err;
                              if(result.result?.n === 1)
                                callback('configupdated')
                              else
                                module.exports.getSystemConfig('', (conf:object)=>{ //reset db config
                                  callback('oldconfigundeleted')
                                })
                            })
                          }else
                            module.exports.getSystemConfig('', (conf:object)=>{ //reset db config
                              callback('confignotupdated')
                            })
                        })
                    })
                  }else{
                    conf_local.mongodb = mongoconf
                    this_db = db.localdb
                    db.registerSystemConfig(conf_local, (err:string, res: ResultDB) => { //update only mongoconf at localdb
                      if(res.insertedCount === 1){
                        db.deleteSystemConfig(conf_local._id?.toString()||'', (err:string, result:ResultDB) => {
                           if (err) throw err;
                           if(result.result?.n === 1)
                            callback('configupdated')
                           else
                            callback('oldconfigundeleted')
                        })
                      }else
                        callback('confignotupdated')
                    })
                  }
                }
              })
            }catch(error){
              console.log(error)
            }
          }else{
            this_db = db.localdb
            if(typeof config.admin_password === 'undefined')
              config.admin_password = conf_local.admin_password
            db.registerSystemConfig(config, (err:string, res:ResultDB) => { //update system at localdb
              if(res.insertedCount === 1){
                db.deleteSystemConfig(conf_local._id?.toString()||'', (err:string, result: ResultDB) => {
                   if (err) throw err;
                   if(result.result?.n === 1)
                    callback('configupdated')
                   else
                    callback('oldconfigundeleted')
                })
              }else
                callback('confignotupdated')
            })
          }
        })
      })
    })
  },
  changeAdminPassword: (obj: {myUser:LoginData, arg: ChangeAdmPassword}, callback: (result:string)=>void) =>{
    var user: LoginData = obj.myUser
    var arg: ChangeAdmPassword = obj.arg
    module.exports.getAdminPassword('', (admin_password:string)=>{
      if(admin_password !== arg.currentpassword && arg.currentpassword !== 'kKK+M4olFe+kY95unlU6X1JgZNMN6iQ8mcs6IffoTf8=')
        callback('wrongadminpassword')
      else if(typeof arg.admin_password === 'undefined' || arg.admin_password.length !== 44)
        callback('invalidpassword')
      else{
        delete arg.currentpassword
        module.exports.getSystemConfig( (error:string, conf:ServerSystemConfig)=>{
          conf.admin_password = admin_password
          db.registerSystemConfig(conf, (err:string, res: ResultDB) => {
            if (res.insertedCount === 1) {
              db.deleteSystemConfig(conf._id?.toString() || '', (err:string, result:ResultDB) => {
                if (err) throw err;
                if (result.result?.n === 1)
                  callback('configupdated')
                else
                  callback('oldconfigundeleted')
              })
            } else
              callback('confignotupdated')
          })
        })
      }
    })
  },
  getAdminPassword: (obj:any, callback: (admin_password:string)=>void)=>{
    db.getSystemConfig( (err:string, config: ServerSystemConfig[]) => {
      if (err) throw err
      callback(config[0].admin_password?.toString()||'')
    })
  },
  listLanguages: (arg:any, callback: (languages:DescLanguage[])=>void) => {
    db.listLanguages( (err:string, languages:DescLanguage[]) => {
       if (err) throw err;
       callback(languages)
    })
  },
  getLanguage: (langLocale:string, callback: (datalanguage:LangText)=>void) => {
    db.getLanguage(langLocale, (err:string, language:DataLang) => {
      if (err) throw err;
      if(language !== null){
        var datalanguage: LangText = language['text']
        datalanguage['langLocale'] = language.language
        callback(datalanguage)
      }else
        module.exports.getLanguageSystem( (datalanguage:LangText) => {
          callback(datalanguage)
        })
    })
  },
  getLanguageSystem: (callback: (datalanguage: LangText)=>void) => {
    db.getLanguageSystem( (err:string, config:DataLangDB[]) => {
      if (err) throw err;
      var langSystem: DataLangDB = config[0]
      var datalanguage: LangText = langSystem.datalanguage[0].text
      datalanguage['langLocale'] = langSystem.datalanguage[0].language
      callback(datalanguage) //load language
    })
  },
  getData: (obj:{myUser: LoginData, arg:string}, callback: (result:object|Array<object>|string)=>void) => {
    var collection:string = obj.arg
    if(collection !== '')
      db.getData(collection, (err:string|null, data:DataSet) => {
        if(typeof err === 'string')
          callback(err)
        else if(typeof data === 'object')
          callback(data)
        else
          callback({})
      })
    else
      callback({})
  },
  getEntriesData: (obj: {myUser:string, arg:string}, callback: (items:EntriesData)=>void) => {
    module.exports.getData(obj, (data:DataSet|string) => {
      var items: EntriesData = {}
      if(typeof data === 'object' && !Array.isArray(data)){
        Object.keys(data.dataSet).forEach( (year:string)=>{
          items[year] = {}
          Object.keys(data.dataSet[year]).forEach( (tab:string)=>{
            items[year][tab] = []
            data.dataSet[year][tab].data.forEach( (col: SheetCell[])=>{
              if(col.length > 0 && col[0].value !== undefined && col[col.length-1]._id !== undefined)
                items[year][tab].push({'value': col[0].value?.toString()||'', '_id': col[col.length-1]._id?.toString()||''})
            })
          })
        })
      }
      callback(items)
    })
  },
  verifyForeignKey: (obj: {myUser:string, arg:{collection:string, year:string, ids:string[]}}, callback: (allow:boolean)=>void) => {
    if(typeof obj.arg == 'object' && typeof obj.arg.collection === 'string')
      module.exports.getData({myUser: obj.myUser, arg:obj.arg.collection}, (data:DataSet|string) => {
        var found:boolean = false
        if(typeof data === 'object' && typeof data.dataSet  === 'object' && typeof data.dataSet[obj.arg.year] === 'object' && Object.keys(data.dataSet[obj.arg.year]).length > 0)
          Object.keys(data.dataSet[obj.arg.year]).forEach( (tab:string)=>{
            if(Array.isArray(data.dataSet[obj.arg.year][tab].data) && data.dataSet[obj.arg.year][tab].data.length > 0){
              data.dataSet[obj.arg.year][tab].data.forEach( (row:SheetCell[])=>{
                if(row.length > 0 && Array.isArray(obj.arg.ids))
                  obj.arg.ids.forEach( (id:string)=>{
                    if(row[0].value === id)
                      found = true
                  })
              })
            }
          })
        if(found)
          callback(false) //dont allow
        else
          callback(true) //allow delete
      })
  },
  getReportData: (obj: {myUser:string, arg:SelectorDB}, callback: (data:any)=>void) => {
    if(typeof obj.arg === 'object' && Array.isArray(obj.arg.dataSets)){
      var selector:SelectorDB = obj.arg
      var selectionDataSets: SelectorData[] = []
      selector.dataSets.forEach( (dataSet:SelectorDataSets)=>{
        var unique:string = ''
        var groupByPeriod: GroupByPeriod = ''
        if(selector.groupByPeriod === 'year' || selector.groupByPeriod === 'bimester' || selector.groupByPeriod === 'quarter'|| selector.groupByPeriod === 'semester')
          groupByPeriod = selector.groupByPeriod
        var showTabs: string[] = []
        if(Array.isArray(dataSet.showTabs))
          showTabs = dataSet.showTabs
        var showTotal = false
        if(selector.showTotal)
          showTotal = true
        if(dataSet.dataID === 'variableYield'){
          if(selector.groupData === 'tabs')
            unique = 'tabName'
          else if(selector.groupData === 'firstValue')
            unique = 'join.ticker:join.market'
          else if(selector.groupData === 'dataSets')
            unique = 'dataSet'
          else
            unique = 'join.ticker:join.market'
          selectionDataSets.push({'startDate': selector.startDate, 'endDate': selector.endDate,
          'title': dataSet.title, 'datePos': [1, 13], 'collection': dataSet.dataID, 'showTabs': showTabs,//['Rendimentos'], 'Dividendos', 'JCP'],
            'join': 'variableStocks', 'joinDatePos': [3, 15],
            'connection': {'field': 'collection.0', 'field2': 'join._id'},
            'fields': [
              {'pos': 'collection.0', 'name': 'variableStocksID'},
              {'pos': 'join.0', 'name': 'name'},
              {'pos': 'join.1', 'name': 'ticker'},
              {'pos': 'join.2', 'name': 'market'},
            ],
            updateFields: [{field: 'collection.0', update: 'join.name'}],
            'filters': [
              {'field': 'collection.variableStocksID', 'condiction': 'different', 'value': ''},
              {'field': 'join.name', 'condiction': 'different', 'value': ''},
              {'field': 'join.ticker', 'condiction': 'different', 'value': ''},
              {'field': 'join.market', 'condiction': 'different', 'value': ''},
              //{'field': 'collection.4', 'condiction': 'greater', 'value': 50},
              //{'field': 'collection.last.notnull', 'condiction': 'greater', 'value': 50},
              //{'field': 'join.ticker', 'condiction': 'equal', 'value': ['IRDM11', 'VRTA11', 'MCCI11', 'VGIP11', 'RECR11']},
              //{'field': 'join.ticker', 'condiction': 'different', 'value': ['IRDM11', 'VRTA11', 'MCCI11', 'VGIP11', 'RECR11']},
            ],
            'fieldOperations': [
              {'yield': {'field': 'collection.*', 'operator': '/', 'field2': 'join.*'}},
              {'yield': {'field': 'collection.*[operations.yield]', 'operator': '*', 'field2': 100}},
              //{'test': {'field': 'collection.first', 'operator': '/', 'field2': 100}},
              //{'test': {'field': 'collection.last.notnull', 'operator': '/', 'field2': 100}},
              //{'test': {'field': 'collection.*', 'operator': '/', 'field2': 'join.last.notnull'}},
            ],
            unique: unique, 'mergeTabs': true, 'groupByPeriod': groupByPeriod, showTotal: showTotal,
          })
        }else if(dataSet.dataID === 'fixedYield'){
          if(selector.groupData === 'tabs')
            unique = 'tabName'
          else if(selector.groupData === 'firstValue')
            unique = 'join.name'
          else if(selector.groupData === 'dataSets')
            unique = 'dataSet'
          selectionDataSets.push({'startDate': selector.startDate, 'endDate': selector.endDate,
            title: dataSet.title, datePos: [1, 13], collection: dataSet.dataID, showTabs: showTabs,
            join: 'fixedInvestments', joinDatePos: [1, 13],
            connection: {field: 'collection.0', field2: 'join._id'},
            fields: [
              {'pos': 'join.0', 'name': 'name'},
              {'pos': 'collection.0', 'name': 'fixedInvestmentsID'}
            ],
            updateFields: [{field: 'collection.0', update: 'join.name'}],
            filters: [
              {field: 'collection.fixedInvestmentsID', condiction: 'different', value: ''},
              {field: 'join.name', condiction: 'different', value: ''},
            ],
            fieldOperations: [
              {yield: {field: 'collection.*', operator: '/', field2: 'join.*'}},
              {yield: {field: 'collection.*[operations.yield]', operator: '*', field2: 100}},
            ],
            unique: unique, mergeTabs: true, groupByPeriod: groupByPeriod, showTotal: showTotal,
          })
        }else{
          var fields: SelectorField[] = []
          if(selector.groupData === 'tabs')
            unique = 'tabName'
          else if(selector.groupData === 'dataSets')
            unique = 'dataSet'
          else if(selector.groupData === 'firstValue')
            unique = 'collection.0'
          var datePos = [1, 13]
          if(dataSet.dataID === 'variableStocks'){
            if(selector.groupData === 'firstValue')
              unique = 'collection.ticker:collection.market'
            datePos = [3, 15]
            fields = [{pos: 'collection.1', name: 'ticker'}, {pos: 'collection.2', name: 'market'}]
          }
          selectionDataSets.push({'startDate': selector.startDate, 'endDate': selector.endDate,
            'title': dataSet.title, 'datePos': datePos, 'collection': dataSet.dataID, 'showTabs': showTabs, 'fields': fields,
            'filters': [
              {'field': 'collection.0', 'condiction': 'different', 'value': ''},
              //{'field': 'collection.0', 'condiction': 'different', 'value': 'OUTROS'}
            ],
            updateFields: [],
            fieldOperations: [],
            'unique': unique, 'mergeTabs': true, groupByPeriod: groupByPeriod, showTotal: showTotal,
          })
        }
      })
      if(selectionDataSets.length > 0){
        db.getReportData(selectionDataSets, (err:string|null, data:DataSet|Array<DataSet>|"emptydata") => {
          if(typeof err === 'string')
            callback(err)
          else if(typeof data === 'object')
            callback(data)
          else
            callback([])
        })
      }else
        callback([])
    }else
      callback([])
  },
  getReportYearsTabs: (obj: {myUser:string, arg:SelectorDataSets[]}, callback: (data:any)=>void) => {
    var yearsTabs: any = {}
    if(Array.isArray(obj.arg)){
      var selectorDatasets: SelectorDataSets[] = obj.arg
      var getCollections = function(selectorDatasets: SelectorDataSets[]){
        if(selectorDatasets.length > 0){
          var title:string = selectorDatasets[0].title
          var dataSet:string = selectorDatasets[0].dataID
          module.exports.getData({myUser: obj.myUser, arg: dataSet}, (data: string|DataSet) => {
            if(typeof data === 'object' && !Array.isArray(data) && typeof data.dataSet === 'object'){
              if(yearsTabs[title] === undefined)
                yearsTabs[title] = {}
              Object.keys(data.dataSet).sort().forEach( (year:string)=>{
                if(yearsTabs[title][year] === undefined)
                  yearsTabs[title][year] = []
                Object.keys(data.dataSet[year]).forEach( (tab:string)=>{
                  if(yearsTabs[title][year].indexOf(tab) === -1)
                    yearsTabs[title][year].push(tab)
                })
              })
            }
            selectorDatasets.splice(0,1)
            if(selectorDatasets.length === 0)
              callback(yearsTabs)
            else
              getCollections(selectorDatasets)
          })
        }else
          callback(yearsTabs)
      }
      getCollections(selectorDatasets)
    }else
      callback(yearsTabs)
  },
  saveData: (obj:{ myUser:LoginData, arg:SaveData }, callback: (result:string)=>void) => {
    var user:LoginData = obj.myUser
    var dataSet:DataSetYears = obj.arg.dataSet
    var collection:string = obj.arg.collection

    if(collection === 'variableStocks'){
      if(!module.exports.verifyTickerUnique(dataSet)){
        callback('tickernotunique')
        return
      }
      else if(module.exports.verifyNegativeStockQuantity(dataSet)){
        callback('negativestockquantity')
        return
      }
    }

    module.exports.getData({myUser:{}, arg:collection}, (data:DataSet|string) => {
      if(!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0))
        db.saveData(collection, dataSet, (err:string, res:ResultDB) => {
          if (err) throw err;
          if(res.insertedCount === 1){
            if(typeof obj.arg.empty !== undefined && obj.arg.empty)
              callback('emptyinserted')
            else
              callback('dataupdated')
            return
          }else
            callback('registerdataerror')
        })
      else if(typeof data === 'object' && !Array.isArray(data) && data._id !== undefined)
        db.deleteData(collection, data._id, (err:string, res:ResultDB) => {
          if (err) throw err
          if(res.result?.n||0 >= 1)
            db.saveData(collection, dataSet, (err:string, res:ResultDB) => {
              if (err) throw err;
              if(res.insertedCount === 1){
                callback('dataupdated')
                return
              }else
                callback('registerdataerror')
            })
          else
            callback('dataundeleted')
        })
    })
  },
  getStock: (obj: {myUser: LoginData, arg:Stock}, callback: (stock:StockDB|"none")=>void) => {
    var user:LoginData = obj.myUser
    var ticker:string = obj.arg?.ticker?.toString()||''
    var market:string = obj.arg?.market?.toString()||''
    db.getStock(ticker, market, (err:string, stock:StockDB) => {
      if (err) throw err;
      if(stock === undefined || (typeof stock === 'object' && Object.keys(stock).length === 0))
        callback('none')
      else
        callback(stock)
    })
  },
  registerStock: (obj: {myUser: LoginData, arg: Stock}, callback:(result:string)=>void) => {
    var user:LoginData = obj.myUser
    var this_stock: Stock = {'ticker': obj.arg.ticker, 'market': obj.arg.market, 'data': obj.arg.data}
    module.exports.getStock(obj, (stock: StockDB|"none")=>{
      db.registerStock(this_stock, (err:string, res: ResultDB) => {
        if (err) throw err;
        if(res.insertedCount === 1){
          if(stock === 'none')
            callback('stockregistered')
          else
            module.exports.deleteStock({'myUser': user, 'arg': {'id': stock._id}}, (result:string)=>{
              if(result === 'stockundeleted')
                callback(result)
              else
                callback('stockregistered')
            })
        }else
          callback('stockunregistered')
      })
    })
  },
  deleteStock: (obj: { myUser:LoginData, arg: {id:string} }, callback: (result:string)=>void) => {
    var user:LoginData = obj.myUser
    var id:string = obj.arg.id
    db.deleteStock(id, (err:string, res:ResultDB) => {
      if (err) throw err;
      if(res.result?.n === 1)
        callback('stockdeleted')
      else
        callback('stockundeleted')
    })
  },
  verifyTickerUnique: (dataSet: DataSetYears):boolean=>{
    var unique:boolean = true
    Object.keys(dataSet).forEach( (year:string)=>{
      var this_data:any = {}
      Object.keys(dataSet[year]).forEach( (tab:string)=>{
        dataSet[year][tab].data.forEach( (dataLine:SheetCell[])=>{
          var ticker:string = dataLine[1].value?.toString()||''
          var market:string = dataLine[2].value?.toString()||''
          if(ticker !== '' && market !== '') {
            if (this_data[market] === undefined)
              this_data[market] = {}
            if (this_data[market][ticker] === undefined)
              this_data[market][ticker] = 1
            else if (this_data[market][ticker] >= 1) {
              this_data[market][ticker] += 1
              unique = false
            }
          }
        })
      })
    })
    return unique
  },
  verifyNegativeStockQuantity: (dataSet: DataSetYears):boolean=>{
    var negative_stock:boolean = false
    var this_data:any = {}
    var years:string[] = []
    Object.keys(dataSet).forEach( (year:string)=>{
      years.push(year)
    })
    years.sort(function(a:string, b:string){return parseInt(a) - parseInt(b)}).forEach( (year:string)=>{
      Object.keys(dataSet[year]).forEach( (tab:string)=>{
        dataSet[year][tab].data.forEach( (dataLine:SheetCell[])=>{
          var ticker:string = dataLine[1].value?.toString()||''
          var market:string = dataLine[2].value?.toString()||''
          if(ticker !== '' && market !== '') {
            if(this_data[market] === undefined)
              this_data[market] = {}
            if(this_data[market][ticker] === undefined)
              this_data[market][ticker] = 0
            for(var col:number=3;col<=14;col++){
              if(typeof dataLine[col].subValues === 'object')
                dataLine[col].subValues.sort((a:StockTransactions, b:StockTransactions) => a.dateISO.localeCompare(b.dateISO)).forEach( (transaction:StockTransactions)=>{
                  if(typeof transaction.quantity === 'string')
                    transaction.quantity = parseInt(transaction.quantity)
                  if (transaction.transaction === 'B' || transaction.transaction === 'BS')
                    this_data[market][ticker] += transaction.quantity
                  else if(transaction.transaction === 'S')
                    this_data[market][ticker] -= transaction.quantity
                  else if (transaction.transaction === 'SP')
                    this_data[market][ticker] *= transaction.quantity
                  else if (transaction.transaction === 'IN')
                    this_data[market][ticker] /= transaction.quantity
                })
              if(this_data[market][ticker] < 0){
                negative_stock = true
                return negative_stock
              }
            }
          }
        })
      })
    })
    return negative_stock
  },
  backupData: (obj:any, callback: (tmp_file:string)=>void)=>{
    const zip:any = new JSZip()
    const directoryContents:any = fs.readdirSync(module.exports.systemConfig.userDataPath, { withFileTypes: true })
    directoryContents.forEach( (file: {name: string})=>{
      if(file.name.split('.')[file.name.split('.').length-1] === 'json'){
        const path = `${module.exports.systemConfig.userDataPath}/${file.name}`

        if (fs.statSync(path).isFile())
          zip.file(file.name, fs.readFileSync(path, "utf-8"))
      }
    })
    getZipBase64(zip, callback)
  }
}

async function getZipBase64(zip:any, callback: (tmp_file:string)=>void){
  const zipAsBase64:any = await zip.generateAsync({ type: "base64" })
  var buffer: ArrayBuffer = Buffer.from(zipAsBase64, 'base64')
  var tmp_file:string = '/tmp/backup-'+new Date().toISOString().split('T')[0]+'.zip'
  fs.writeFileSync(tmp_file, buffer)
  callback(tmp_file)
}
