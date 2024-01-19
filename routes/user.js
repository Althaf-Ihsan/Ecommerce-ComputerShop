const { response } = require('express');
var express = require('express');
const contactForm = require('../helpers/contactForm');
var productHelpers = require("../helpers/product-helpers");
var userHelpers = require("../helpers/user-helpers");
const collection=require('../config/collections')
const db=require("../config/connection")
var router = express.Router();
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  }
  else {
    res.render('user/login')
  }
}
/* GET home page. */
router.get('/', function async(req, res, next) {

  productHelpers.getAllProducts().then((products) => {

    res.render('user/userPage', { layout: 'layout2', products})
  })
});
router.post('/submit', (req, res) => {
  contactForm.getdata(req.body).then((response) => {
    res.redirect('/');
  })
})
router.get('/signup', function (req, res) {
  res.render('user/signup', { admin: false })
})
router.get('/login', async function (req, res) {
  
 if(req.session.loggedIn)
  {
    let user = req.session.user
    await userHelpers.getCartCount(req.session.user._id).then((count)=>{
      productHelpers.getAllProducts().then((products) => {
        res.render('user/userPage', {products, user,count,layout:"layout"})
      })
    })
    
  }
  else{
    res.render('user/login', {admin: false,error:req.session.error})
    req.session.logginErr=false
  }
  

})
router.post('/signup', (req, res) => {
  
  userHelpers.doSignup(req.body).then((response) => {
    console.log(response)
    res.redirect('/login')
  })
})

router.post('/login', (req, res) => {
  if(req.body.email=="admin@gmail.com"&& req.body.password=="123456")
  {
    productHelpers.getAllProducts().then((products) => {
      console.log(products)
      res.render('admin/view-products', { admin: true, products })
    })
  }
  else{
    userHelpers.doLogin(req.body).then(async(response) => {
      if (response.status) {
        req.session.loggedIn = true
        req.session.user = response.user
        let user = req.session.user
       await userHelpers.getCartCount(req.session.user._id).then((count)=>{
          productHelpers.getAllProducts().then((products) => {
            res.render('user/userPage', {products, user,count})
          })
        })
        
  
      }
      else {
        console.log(response)
        req.session.error=response.msg
        res.redirect('/login')
      }
    })
  }
  
})
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})
router.get('/cart', verifyLogin, async (req, res, next) => {
  await userHelpers.getCartCount(req.session.user._id).then(async(count)=>{
    let products = await userHelpers.getCartItems(req.session.user._id)
    let totalValue=await userHelpers.getTotalprice(req.session.user._id,count)
    console.log(count)
    console.log(products)
    if(count==0)
    {
      let errMessage="cart is empty"
      res.render('user/cart', { user: req.session.user})
    }
    else{
      res.render('user/cart', { user1: req.session.user._id,user: req.session.user, products,totalValue })
    }
   
    })


})
router.get('/addTocart/:id', verifyLogin, (req, res) => {
  console.log("api called");
  userHelpers.addTocart(req.params.id, req.session.user._id).then(() => {
    res.json({status:true})
  })
})
router.post('/change-product-quantity',async(req,res)=>{
userHelpers.changeProductQuantity(req.body).then(async(response)=>{
if(response.count===-1)
{
  return res.json(response)
}
  response.total= await userHelpers.getTotalprice(req.body.user,req.body.cocount)
  res.json(response)
})
})
router.post('/deleteProduct',(req,res,next)=>{
  userHelpers.deleteProduct(req.body).then(async(response)=>{
    res.json(response)
  })
})
router.get('/placeOrder',verifyLogin,async(req,res,next)=>{
 let Total=await userHelpers.getTotalprice(req.session.user._id)
 res.render('user/placeOrder',{Total,user:req.session.user})
})
router.post('/placeOrder', async(req, res) => {
  var products = await userHelpers.getCartProductList(req.body.userId)
  var totalPrice = await userHelpers.getTotalprice(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
  res.json({status:true})
  })
})
router.get('/orders',verifyLogin, async(req, res) => {
  var orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/view-order', {user: req.session.user, orders})
})
router.get('/order-complete', verifyLogin, (req, res) => {
  res.render('user/order-complete', {user: req.session.user})
})
router.get('/view-order-products/:id', verifyLogin, async(req, res) => {
  var products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products', {user: req.session.user, products})
})
router.get("/home",(req,res,next)=>{
  res.redirect("login/")
})
module.exports = router;