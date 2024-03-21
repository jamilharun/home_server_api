const controller = require("./controller");
const { Router } = require("express");

router = Router();

//main routes
router.get('/order', controller.getOrders); //data management

// router.get('/cart', controller.getCart); //data management

router.post('/order/new', controller.createOrder, controller.createCart); //buyyer

router.post('/order/cancel', controller.cancelOrder); //buyyers

router.get('/order/details/:id', controller.getOrderDetails); //seller

router.post('/order/readytopickup', controller.setpickup); //seller

//sub routes
router.get('/order/shop/:id/queue', controller.getAllQueue); //seller

router.post('/order/indexqueue', controller.indexQueue); //buyyers

router.post('/order/pickuplistener', controller.pickupListener); //buyyer

module.exports = router;