var db=require("../config/connection")
var collection=require('../config/collections')
const { ObjectId, ObjectID } = require('mongodb');
module.exports={
     addProduct:(product,callback)=>{
        db.get().collection(collection.PRODUCT_COLLECTIONS).insertOne(product).then((data)=>{
        callback(data.insertedId)
   })
  },
    getAllProducts:()=>{
       return new Promise(async(resolve,reject)=>{
        let products=await db.get().collection(collection.PRODUCT_COLLECTIONS).find().toArray()
        resolve(products)
       })
    },
    deleteProduct:(proId)=>{
          return new Promise((resolve,reject)=>{
             db.get().collection(collection.PRODUCT_COLLECTIONS).deleteOne({_id:ObjectId(proId)}).then((response)=>{
                 resolve(response)
             })
          })
    },
    getProductDetails:(proId)=>{
     return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTIONS).findOne({_id:ObjectId(proId)}).then((product)=>{
         resolve(product)
      })
     })
    },
    updateProduct:(proId,proDetails)=>{
      return new Promise((resolve,reject)=>{
         db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({_id:ObjectId(proId)},{
            $set:{
               productName:proDetails.productName,
               category:proDetails.category,
               price:proDetails.price
            }
         }).then((response)=>{
            resolve()
         })
      })

    }
}