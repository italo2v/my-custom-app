const pathDB:any = require('path')
const fsDB:any = require('fs')
const hash_crypto:any = require('crypto')

interface LocalDB {
  connection: (collection:string, type:string, arg:AllowedFilters|Entry[], callback:(err:string|null, result:any)=>void, arg2?:Projection)=>void;
  userDataPath: string;
  appPath: string;
}
interface AllowedFilters {
  _id?: string;
  ticker?: string;
  market?: string;
  language?: string;
}
interface Projection {
  projection: ProjectionField;
}
interface ProjectionField {
  [field:string]: 0|1;
}
interface Entry {
  _id:string;
  [key:string]: any;
}
interface ReadError {
  code: string;
}

module.exports = {
  connection: (collection:string, type:string, arg:AllowedFilters|Entry[], callback: (err:string|null, result:any)=>void, arg2?:Projection)=>{
    if(typeof arg !== 'object')
      console.log('Unknow string to find')
    else if(Array.isArray(arg)) {
      if (type === 'bulkWrite')
        insertOne(collection, arg, callback)
      else if (type === 'aggregate')
        aggregate(collection, arg, callback)
    }else {
      if ((type === 'find' || type === 'findOne'))
        find(collection, type, arg, callback, arg2)
      else if (type === 'deleteOne')
        deleteOne(collection, arg, callback)
    }
  },
  userDataPath: '',
  appPath: ''
}

function deleteOne(collection:string, arg: AllowedFilters, callback: (err:string, result:ResultDB)=>void){
  if(arg._id === undefined) {
    callback('emptyselection', {result: {n: 0}})
    return
  }
  var id:string = arg._id
  find(collection, 'find', {}, (err:string|null, entries: Entry[]|Entry)=>{
    var n:number=0
    entries.forEach((entry: Entry, e:number) => {
      if(id === entry._id){
        entries.splice(e, 1)
        n++
      }
    })
    var this_path:string = pathDB.join(module.exports.userDataPath, collection+'.json')
    fsDB.writeFile(this_path, JSON.stringify(entries), (err:string)=>{
      if (err) throw err
      callback(err, {'result': {'n': n}})
    })
  })
}

function make_id() {
  var text:string = ""
  var possible:string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (var i:number = 0; i < 24; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  return text
}

function insertOne(collection:string, arg:Entry[], callback: (err:string, result:ResultDB)=>void){
  find(collection, 'find', {}, (err:string|null, entries:Entry[]|Entry)=>{
    var insertedCount:number = 0
    var insertedIds:string[] = []
    arg.forEach((doc:Entry)=>{
      var exist_id:boolean = true
      var this_id:string = make_id()
      while(exist_id){
        exist_id = false
        entries.forEach((entry:Entry) => {
          if(entry._id === this_id) {
            exist_id = true
            this_id = make_id()
          }
        })
      }
      insertedIds.push(this_id)
      doc.insertOne.document._id = this_id
      entries.push(doc.insertOne.document)
      insertedCount++
    })
    var this_path:string = pathDB.join(module.exports.userDataPath, collection+'.json')
    fsDB.writeFile(this_path, JSON.stringify(entries), (err:string)=>{
      if (err) throw err
      callback(err, {'insertedCount': insertedCount, 'insertedIds': insertedIds})
    })
  })
}

function aggregate(collection:string, arg:Entry[], callback: (err:string, col1_entries: Entry[])=>void){
  var error:string = ''
  find(collection, 'find', {}, (err:string|null, col1_entries:Entry[]|Entry)=>{
    find(arg[0]['$lookup'].from, 'find', {}, (err2:string|null, col2_entries:Entry[]|Entry)=>{
      if(Array.isArray(col1_entries) && Array.isArray(col2_entries)) {
        col1_entries.forEach((doc: Entry) => {
          col2_entries.forEach((doc2: Entry) => {
            var localField: any = arg[0]['$lookup'].localField
            var foreignField: any = arg[0]['$lookup'].foreignField
            if (typeof doc[localField] === 'undefined')
              error = 'unknow local field.'
            else if (typeof doc2[foreignField] === 'undefined')
              error = 'unknow foreign field.'
            else if (doc[localField] === doc2[foreignField]) {
              doc[arg[0]['$lookup'].as] = [doc2]
            }
          })
        })
        callback(error, col1_entries)
      }
    })
  })
}

function find(collection:string, type:"find"|"findOne", arg:AllowedFilters, callback: (err:string|null, entries: Entry[]|Entry)=>void, arg2?:Projection){
  var this_path:string = pathDB.join(module.exports.userDataPath, collection+'.json')
  var local_file:string = module.exports.appPath+'/db_startup/'+collection+'.json'
  var entries
  try{
    fsDB.readFile(this_path, (error:ReadError|null, data:string)=>{
      if(error === null){
        if(collection === 'languages'){
          var this_checksum:string = hash_crypto.createHash('sha256').update(JSON.stringify(JSON.parse(data))).digest('hex')
          try{
            fsDB.readFile(local_file, (err:string|null, local_data:string)=>{
              if(err) throw err
              var local_checksum:string = hash_crypto.createHash('sha256').update(JSON.stringify(JSON.parse(local_data))).digest('hex')
              if(local_checksum !== this_checksum){
                var defaults:any = JSON.parse(local_data)
                fsDB.writeFile(this_path, JSON.stringify(defaults), (err:string)=>{
                  if (err) throw err
                  console.log('File created: '+pathDB.join(module.exports.userDataPath, collection+'.json'))
                  entries = get_entries(defaults, arg)
                  if(type === 'find')
                    callback(err, entries)
                  else if(type === 'findOne')
                    callback(err, entries[0])
                })
              }
            })
          }catch(error){
            console.log(error)
          }
        }
        var json = JSON.parse(data)
        entries = get_entries(json, arg, arg2)
        if(type === 'find')
          callback(error, entries)
        else if(type === 'findOne')
          callback(error, entries[0])
      }else if(error.code === 'ENOENT'){
        try{
          fsDB.readFile(local_file, (err:ReadError|null, data:string)=>{
            var defaults:any[] = []
            if (err === null)
              defaults = JSON.parse(data)
            if(!fsDB.existsSync(module.exports.userDataPath) && !fsDB.lstatSync(module.exports.userDataPath).isDirectory() )
              fsDB.mkdir(module.exports.userDataPath, (err:string) => {
                if (err) throw err
                console.log('Config dir created')
              })
            fsDB.writeFile(this_path, JSON.stringify(defaults), (err:string)=>{
              if (err) throw err
              console.log('File created: '+this_path)
              entries = get_entries(defaults, arg)
              if(type === 'find')
                callback(err, entries)
              else if(type === 'findOne')
                callback(err, entries[0])
            })
          })
        }catch(error){
          console.log(error)
        }
      }
    })
  } catch(error){
    console.log(error)
  }
}

function get_entries(json:Entry[], arg:AllowedFilters, arg2?:Projection){
  if(Object.entries(arg).length > 0)
    Object.entries(arg).forEach( (search:[string,any]) => {
      var remove: any[] = []
      json.forEach((doc:any, d:number) => {
        if(search[1] !== doc[search[0]])
          remove.push(d)
      })
      for(var i:number=remove.length-1;i>=0;i--)
        json.splice(remove[i], 1)
    })
  if(typeof arg2 !== 'undefined')
    if(typeof arg2.projection !== 'undefined'){
      json.forEach((doc:Entry, d:number) => {
        var mydoc:any = {}
        var excludeid:boolean = false
        Object.entries(arg2.projection).forEach((projection:[string, 0|1]) => {
          if(projection[0] === '_id' && projection[1] === 0)
            excludeid = true
          Object.entries(doc).forEach((field:[string, any]) => {
            if(field[0] === projection[0])
              if(projection[1] === 0)
                delete doc[field[0]]
              else if(projection[1] === 1)
                mydoc[field[0]] = field[1]
          })
        })
        if(!excludeid)
          mydoc._id = doc._id
        json[d] = mydoc
      })
    }
  return json
}
