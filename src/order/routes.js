const controller = require("./controller");
const { Router } = require("express");

router = Router();

//main routes
router.get('/order', controller.getOrders); //data management

// router.get('/cart', controller.getCart); //data management

router.post('/order/new', controller.createOrder); //buyyer

router.post('/order/cancel', controller.cancelOrder); //buyyers

router.get('/order/details/:id', controller.getOrderDetails); //seller

router.get('/order/readypickup/:id', controller.setpickup); //seller //finished //for pickingup finished items
//sub routes
router.get('/order/removePickup/:id', controller.removePickup); //buyyer //finished //when buyyer already pickup the item

router.get('/order/shop/:id/queue', controller.getAllQueue); //seller //finished

router.get('/order/user/:id/queue', controller.getUserQueue); //buyyer //finished

router.post('/order/indexqueue', controller.indexQueue); //buyyers

router.post('/order/pickuplistener', controller.pickupListener); //buyyer

router.get('/order/isSuccess/:id', controller.checkPaySuccess)//buyyer //payment

// router.put('/order/isFinished', controller.isFinished) //buyyer

router.get('/order/user/:id/checkout', controller.userCheckout) //buyyer //finished

router.get('/order/shop/:id/checkout', controller.shopCheckout) //shoop

//dfdsfsdf
router.get('/order/usercheckoutandqueue/:id', controller.userCheckoutAndQueue) //buyyer

//buyyer
router.post('/order/getNewOrder', controller.userNewCheckout) //buyyer

router.post('/order/user/new/queue', controller.usernewQueue) //buyyer

module.exports = router;