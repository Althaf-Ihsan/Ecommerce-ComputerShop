const MongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=(callback)=>{
    const dbname="onlineStore"
MongoClient.connect("mongodb://0.0.0.0:27017/",(err,data)=>{
    if(err) return callback(err)
    state.db=data.db(dbname)
})
callback()
}
module.exports.get=()=>{
    return state.db
}
