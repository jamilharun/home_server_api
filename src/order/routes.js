const controller = require("./controller");
const { Router } = require("express");

router = Router();

//main routes
router.get('/order', controller.getOrders); //data management

// router.get('/cart', controller.getCart); //data management

router.post('/order/new', controller.createOrder, controller.createCart); //buyyer

router.post('/order/cancel', controller.cancelOrder); //buyyers

router.get('/order/details/:id', controller.getOrderDetails); //seller

router.post('/order/readytopickup', controller.setpickup); //seller //for pickingup finished items
//sub routes
router.post('/order/removeFromPickup', controller.removePickup); //buyyer //when buyyer already pickup the item

router.get('/order/shop/:id/queue', controller.getAllQueue); //seller

router.get('/order/user/:id/queue', controller.getUserQueue); //buyyer

router.post('/order/indexqueue', controller.indexQueue); //buyyers

router.post('/order/pickuplistener', controller.pickupListener); //buyyer

router.get('/order/isSuccess/:id', controller.checkPaySuccess)//buyyer

// router.put('/order/isFinished', controller.isFinished) //buyyer

router.get('/order/user/:id/checkout', controller.userCheckout) //buyyer

router.get('/order/shop/:id/checkout', controller.shopCheckout)

module.exports = router;