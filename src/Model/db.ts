const selector: Selector = require('./selector.js')

interface DB {
  mongodb: MongoDB;
  localdb: LocalDB;
  listLanguages: (callback: (err:string, result:DescLanguage[])=>void)=>void;
  getLanguage: (language:string, callback: (err:string, result:DataLang)=>void)=>void;
  getLanguageSystem: (callback: (err:string, result:DataLangDB[])=>void)=>void;
  getSystemConfig: (callback: (err:string, result:ServerSystemConfig[])=>void)=>void;
  registerSystemConfig: (config: ServerSystemConfig, callback: (err:string, result:ResultDB)=>void)=>void;
  deleteSystemConfig: (id: string, callback: (err:string, result:ResultDB)=>void)=>void;
  getData: (arg:string, callback: (err:string|null, result:DataSet)=>void)=>void;
  getReportData: (arg:SelectorData[], callback: (err:string|null, result:DataSet|"emptydata")=>void)=>void;
  deleteData: (collection:string, id: string, callback: (err:string, result:ResultDB)=>void)=>void;
  saveData: (collection:string, dataSet: DataSetYears, callback: (err:string, result:ResultDB)=>void)=>void;
  getStock: (ticker: string, market:string, callback: (err:string, result:StockDB)=>void)=>void;
  registerStock: (stock: Stock, callback: (err:string, result:ResultDB)=>void)=>void;
  deleteStock: (id: string, callback: (err:string, result:ResultDB)=>void)=>void;
}
interface DataSet {
  dataSet: DataSetYears;
  _id?:string;
}
interface ResultDB {
  insertedCount?: number;
  insertedIds?: Array<string>;
  result?: ResultCountDB;
}
interface ResultCountDB {
  n: number;
}
interface MongoDBConfig {
  host?: string;
  port?: string;
  passwd?: string
  dbuser?: string;
  dbname?: string;
  dbpassword?: string;
}
interface MongoDB extends MongoDBConfig {
  connection: (collection:string, dbFunction:string, query:object, callback: (err:string, result:any)=>void)=>void;
}
interface StockDB extends Stock {
  _id: string;
}
interface DataLangDB extends DataLang {
  datalanguage: DataLang[];
}
interface DataSetSelection {
  [title: string]: DataSet
}

module.exports = {
  mongodb: {},
  localdb: require('./local_db.js'),
  listLanguages: (callback: (err:string, result:DescLanguage[])=>void) => {
    module.exports.localdb.connection('languages', 'find', {}, callback, { projection: { _id: 0, name: 1, language: 1, picture: 1 } })
  },
  getLanguage: (language:string, callback: (err:string, result:DataLang)=>void) => {
    module.exports.localdb.connection('languages', 'findOne', {'language': language}, callback)
  },
  getLanguageSystem : (callback: (err:string, result:DataLangDB[])=>void) => {
    module.exports.localdb.connection('system', 'aggregate', [
         {
           $lookup:
             {
               from: "languages",
               localField: "langLocale",
               foreignField: "language",
               as: "datalanguage"
             }
        }
      ], callback)
  },
  getSystemConfig : (callback: (err:string, result:ServerSystemConfig[])=>void) => {
    module.exports.localdb.connection('system', 'find', {}, callback)
  },
  registerSystemConfig : (config: ServerSystemConfig, callback: (err:string, result:ResultDB)=>void) => {
    module.exports.localdb.connection('system', 'bulkWrite', [
      {
        insertOne: {
          document: {
            "langLocale": config.langLocale,
            "admin_password": config.admin_password,
            "theme": config.theme,
            "textSize": config.textSize,
            "mongodb": config.mongodb
          }
        }
      }], callback)
  },
  deleteSystemConfig : (id: string, callback: (err:string, result:ResultDB)=>void) => {
    module.exports.localdb.connection('system', 'deleteOne', {"_id": id}, callback)
  },
  getData : (collection:string, callback: (err:string|null, result:DataSet)=>void) => {
      module.exports.localdb.connection(collection, 'findOne', {}, callback)
  },
  getReportData: (arg:SelectorData[], callback: (err:string|null, result:DataSet|"emptydata")=>void)=>{
    if(Array.isArray(arg) && arg.length > 0){
      var dataSets: DataSetSelection = {}
      var joinedDataSets: DataSet
      var n:number=0
      var getDataSets = function(selectors: SelectorData[], callbackDS:Function){
        var selectorData = selectors[0]
        if(selectorData.collection !== undefined){
          module.exports.localdb.connection(selectorData.collection, 'findOne', {}, (err:string, this_collection:DataSet)=>{
            var selectDataSet: DataSet|string = ''
            if(selectorData.join !== undefined){
              module.exports.localdb.connection(selectorData.join, 'findOne', {}, (err:string, this_join:DataSet)=>{
                selectDataSet = selector.selectData(this_collection, this_join, selectorData)
                if(typeof selectDataSet === 'object')
                  dataSets[selectorData.title] = selectDataSet
                selectors.splice(0, 1)
                if(selectors.length > 0)
                  getDataSets(selectors, callbackDS)
                else
                  callbackDS(dataSets)
              })
            }else{
              selectDataSet = selector.selectData(this_collection, null, selectorData)
              if(typeof selectDataSet === 'object')
                dataSets[selectorData.title] = selectDataSet
              selectors.splice(0, 1)
              if(selectors.length > 0)
                getDataSets(selectors, callbackDS)
              else
                callbackDS(dataSets)
            }
          })
        }
      }
      getDataSets(arg, (dataSets:DataSetSelection)=>{
        joinedDataSets = joinDataSets(dataSets)
        if(Object.keys(joinedDataSets.dataSet).length > 0)
          callback(null, joinedDataSets)
        else
          callback(null, 'emptydata')
      })
    }else
      callback(null, 'emptydata')
  },
  deleteData : (collection:string, id: string, callback: (err:string, result:ResultDB)=>void) => {
    module.exports.localdb.connection(collection, 'deleteOne', {"_id": id}, callback)
  },
  saveData : (collection:string, dataSet: DataSetYears, callback: (err:string, result:ResultDB)=>void) => {
    module.exports.localdb.connection(collection, 'bulkWrite', [
      {
        insertOne: {
          document: { dataSet }
        }
      }], callback)
  },
  getStock : (ticker: string, market:string, callback: (err:string, result:StockDB)=>void) => {
    module.exports.localdb.connection('stockPrice', 'findOne', {"ticker": ticker, "market": market}, callback)
  },
  registerStock : (stock: Stock, callback: (err:string, result:ResultDB)=>void) => {
    module.exports.localdb.connection('stockPrice', 'bulkWrite', [
      {
        insertOne: {
          document: {
            'ticker': stock.ticker,
            'market': stock.market,
            'data': stock.data
          }
        }
      }], callback)
  },
  deleteStock : (id: string, callback: (err:string, result:ResultDB)=>void) => {
    module.exports.localdb.connection('stockPrice', 'deleteOne', {"_id": id}, callback)
  }
}

function joinDataSets(dataSets: DataSetSelection):DataSet{
  var myDataSet:DataSet = {dataSet:{}}
  var rowTotal:SheetCell[] = []
  Object.keys(dataSets).forEach( (title:string)=>{
    var ds: DataSet = dataSets[title]
    Object.keys(ds.dataSet).forEach( (year:string)=>{
      if(myDataSet.dataSet[year] === undefined)
        myDataSet.dataSet[year] = {}
        Object.keys(ds.dataSet[year]).forEach( (tab:string)=>{
          if(myDataSet.dataSet[year][tab] === undefined)
            myDataSet.dataSet[year][tab] = {data: [], tabNumber: -1}
          if(ds.dataSet[year][tab].data)
            ds.dataSet[year][tab].data.forEach( (row: SheetCell[], ri:number)=>{
              if(row[row.length-1].total){
                if(rowTotal.length === 0)
                  rowTotal = row
                else
                  row.forEach( (cell:SheetCell, i:number)=>{
                    if(rowTotal[i] === undefined)
                      rowTotal[i] = {}
                    var cell_total = rowTotal[i]
                    if(typeof cell.value === 'number')
                      if(typeof cell_total.value === 'number')
                        cell_total.value += cell.value
                      else
                        cell_total.value = cell.value
                    if(cell.language)
                      if(!cell_total.language)
                        cell_total.language = cell.language
                      else if(cell.language !== cell_total.language)
                        cell_total.language = ''
                  })
                ds.dataSet[year][tab].data.splice(ri, 1)
              }else{
                row[row.length-1].dataSet = title
                myDataSet.dataSet[year][tab].data.push(row)
              }
            })
        })
    })
  })
  var year: string = Object.keys(myDataSet.dataSet).at(-1)||''
  var tab:string = ''
  if(Object.keys(myDataSet.dataSet).length > 0)
    tab = Object.keys(myDataSet.dataSet[year]).at(-1)||''
  if(rowTotal.length > 0 && tab !== '')
    myDataSet.dataSet[year][tab].data.unshift(rowTotal)
  return myDataSet
}