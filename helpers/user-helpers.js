var db = require("../config/connection")
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require("../app")
const { ObjectId, ObjectID } = require('mongodb');
const { cart_collection } = require("../config/collections");
const collections = require("../config/collections");
const { helpers } = require("handlebars");
const productHelpers = require("./product-helpers");
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10)
      db.get().collection(collection.user_collection).insertOne(userData).then((data) => {
        resolve(data.insertedId)
      });
    })
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {}
      let user = await db.get().collection(collection.user_collection).findOne({ email: userData.email})
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.user = user
            response.status = true
            resolve(response)
            console.log("login success")
          }
          else {
            console.log("login failed")
            resolve({ status: false,msg:"invalid credentials" })
          }
        })
      }
      else {
        console.log("login failedddd")
        resolve({ status: false })
      }
    })
  }
  ,
  adminLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let admin = await db.get().collection(collection.admin_collection).findOne({ email: adminData.email, password: adminData.password })
      console.log(admin)
      if (admin) {
        console.log("success")
        resolve(admin)
      }
      else {
        console.log("login failedddd")
        resolve()
      }
    })
  }
  ,
  addTocart: (proId, userId) => {
    let ProObj = {
      item: ObjectId(proId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(collection.cart_collection).findOne({ user: ObjectId(userId) })
      if (userCart) {
        let proExist = userCart.products.findIndex(product => product.item == proId)
        if (proExist != -1) {
          db.get().collection(collection.cart_collection).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) }, {
            $inc: { 'products.$.quantity': 1 }
          }).then(() => {
            resolve()
          })
        }
        else {
          await db.get().collection(collection.cart_collection).updateOne({ user: ObjectId(userId) }, {
            $push: { products: ProObj }
          }).then((response) => {
            resolve()
          })
        }
      }
      else {
        let cartObj = {
          user: ObjectId(userId),
          products: [ProObj]
        }

        db.get().collection(collection.cart_collection).insertOne(cartObj).then((response) => {
          resolve()
        })
      }
    })
  }
  ,
  getCartItems: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db.get().collection(collection.cart_collection).aggregate([
        {
          $match: { user: ObjectId(userId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTIONS,
            localField: 'item',
            foreignField: '_id',
            as: 'product'

          }
        }, {
          $project: {
            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
          }
        }
      ]).toArray()
      resolve(cartItems)
    })

  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db.get().collection(collection.cart_collection).findOne({ user: ObjectId(userId) })
      if (cart) {
        count = cart.products.length
      }
      resolve(count)
    })

  },
  changeProductQuantity: (details) => {
   details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise ((resolve, reject) => {
            if( details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.cart_collection)
                    .updateOne({_id: ObjectId(details.cart)},
                    {
                        $pull: {products: {item: ObjectId(details.product)} }
                    }
                ).then((response) => {
                    resolve({removeProduct: true,count:details.count})
                })
            } else {
                db.get().collection(collection.cart_collection)
                    .updateOne( { _id : ObjectId(details.cart) , 'products.item' : ObjectId(details.product) },
                    {
                        $inc: { 'products.$.quantity' : details.count }
                    }
                ).then((response) => {
                    resolve({status: true})
                })
      }
    })

  },
  deleteProduct: (details) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.cart_collection).updateOne({ _id: ObjectId(details.cart) }, {
        $pull: { products: { item: ObjectId(details.product) } }
      }).then((response) => {
        resolve({ removeProduct: true })
      })
    })
  },
  getTotalprice: (userId, count) => {
    return new Promise(async (resolve, reject) => {
      if (count == 0) {
        resolve()
      }
      else {
        let total = await db.get().collection(collection.cart_collection).aggregate([
          {
            $match: { user: ObjectId(userId) }
          },
          {
            $unwind: '$products'
          },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity'
            }
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTIONS,
              localField: 'item',
              foreignField: '_id',
              as: 'product'

            }
          }, {
            $project: {
              item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } }
            }
          }
        ]).toArray()
        resolve(total[0].total)
      }

    })
  }
  , getUser: () => {
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection(collection.user_collection).find().toArray()
      resolve(user)
    })
  },
  blockUser: (userId) => {
    console.log(userId);
    return new Promise((resolve, reject) => {
      db.get().collection(collection.user_collection).deleteOne({ _id: ObjectId(userId) }).then((response) => {
        resolve()
      })
    })

  },
  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      var status = order['payment-method'] === 'COD' ? 'PLACED' : 'PENDING'
      var orderObj = {
        deliveryDetails : {
            mobile: order.phone,
            address: order.address,
            pincode: order.pin
        },
        userId:ObjectId(order.userId),
                    paymentMethod: order['payment-method'],
                    products: products,
                    totalAmount: total,
                    status: status,
                    date: new Date().toLocaleDateString()
      }
      db.get().collection(collection.order_collection).insertOne(orderObj).then((response) => {
        db.get().collection(collection.cart_collection).deleteOne({user: ObjectId(order.userId)})
        console.log(response)
        resolve()
    })
    })
    },
  getCartProductList: (userId) => {
    return new Promise(async(resolve, reject) => {
        var cart = await db.get().collection(collection.cart_collection).findOne({user: ObjectId(userId)})
        resolve(cart.products)
    })
},
getUserOrders: (userId) => {
  return new Promise(async(resolve, reject) => {
      var orders = await db.get().collection(collection.order_collection).find({userId : ObjectId(userId)}).toArray()
      resolve(orders)
  })
},
getOrderProducts: (orderId) => {
  return new Promise(async(resolve, reject) => {
      var orderItems = await db.get().collection(collection.order_collection).aggregate([
          {
              $match: { _id: ObjectId(orderId) }
          },
          {
              $unwind: '$products'
          },
          {
              $project: {
                  item: '$products.item',
                  quantity: '$products.quantity'
              }
          },
          {
              $lookup: {
                  from: collection.PRODUCT_COLLECTIONS,
                  localField: 'item',
                  foreignField: '_id',
                  as: 'product' 
              }
          },
          {
              $project: {
                  item: 1,
                  quantity: 1,
                  product: { $arrayElemAt: ['$product', 0] }
              }
          }

      ]).toArray()
      // console.log(orderItems);
      resolve(orderItems)
  })
}
}

