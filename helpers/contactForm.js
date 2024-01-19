var db=require("../config/connection")
var collection=require('../config/collections')
module.exports={
    getdata:(value)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.Contact_data).insertOne(value).then((response)=>{
                resolve(response)
            })
        })
       

}
}