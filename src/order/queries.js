//data management
const getOrders   = 'SELECT * ' + 
                    'FROM "checkout";';

//buyyer
const createOrder = 'INSERT INTO "checkout" '+ 
                    '(paymentRef, userRef, shopRef, groupNum, serviceTax, deliveryFee, totalamount, location, isSpecial, isCanceled, isFinished, created_at) ' +
                    'VALUES ' +
                    '($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;';
//buyyer
const createCart =  'INSERT INTO "cart" '+
                    '(groupNum, itemRef, quantity, price, subTotalPrice, created_at) '+
                    'VALUES ' +
                    '($1, $2, $3, $4, $5, $6) RETURNING *';
//buyyer
const cancelOrder = 'UPDATE "checkout" ' +
                    'SET isCanceled = $1 ' +
                    'WHERE userRef = $2 AND shopRef = $3 AND groupNum = $4';
//seller
const orderDetail = 'SELECT * ' +
                    'FROM "checkout" ' +
                    'WHERE checkOutId = $1';
//seller
const cartItems   = 'SELECT * ' +
                    'FROM "cart" ' +
                    'WHERE groupNum = $1';
//seller
const isFinished  = 'UPDATE "checkOut" ' +
                    'SET isFinished = $1 ' +
                    'WHERE checkOutId = $2'
module.exports = {
    //FETCH
    getOrders, //data management
    
    orderDetail, //seller
    cartItems, //seller

    //CREATE
    createOrder, //buyyer
    createCart, //buyyer

    //UPDATE
    cancelOrder, //buyyers
    isFinished, //seller
}