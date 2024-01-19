var express = require('express');
const { response } = require('../app');
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const userHelpers = require('../helpers/user-helpers');
/* GET users listing. */
router.get('/', function (req, res, next) {
   productHelpers.getAllProducts().then((products) => {
      console.log(products)
      res.render('admin/view-products', { admin: true, products })
    })

});
router.get('/logout', function (req, res, next) {
  res.render('user/login')
  });

router.get('/add-products', (req, res,next) => {
  res.render("admin/add-products", { admin: true })
});
router.post('/add-products', (req, res) => {
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image
    image.mv("./public/product-images/" + id + '.jpg', (err, done) => {
      if (err) {
        console.log(err)
      }
      else {
        res.redirect('/admin/')
      }
    })
  })
})
router.get('/delete-products/:id', (req, res) => {
  let proId = req.params.id
  console.log(proId)
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/')
  })
})
router.get('/edit/:id', async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  console.log(product)
  res.render('admin/edit', { product, admin: true })
})
router.post('/edit/:id', (req, res) => {
  let id = req.params.id
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin')
    if (req.files.image) {
      let image = req.files.image
      image.mv("./public/product-images/" + id + '.jpg')
    }
  })
})
router.get("/allUsers",(req,res,next)=>{
  userHelpers.getUser().then((user) => {
    res.render('admin/allusers', { admin: true,user })
    console.log(user);
  })
})
router.get("/orders",(req,res,next)=>{
  res.render("admin/orders")
})
router.get('/blockUser/:id', (req, res) => {
  userHelpers.blockUser(req.params.id).then(() => {
    console.log(req.params.id);
    req.session.user = null;
    res.redirect('/admin/allUsers')
  })
})
module.exports = router;
