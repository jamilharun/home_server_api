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
// const cancelOrder = 'UPDATE "checkout" ' +
//                     'SET isCanceled = $1 ' +
//                     'WHERE userRef = $2 AND shopRef = $3 AND groupNum = $4';
const cancelOrder = 'UPDATE "checkout" ' +
                    'SET isCanceled = $1 ' +
                    'WHERE userRef = $2 AND shopRef = $3 AND groupNum = $4 ' +
                    'RETURNING *'; // '*' indicates returning all columns, you can specify specific columns if needed
//seller
const orderDetail = 'SELECT * ' +
                    'FROM "checkout" ' +
                    'WHERE checkOutId = $1';
//seller
const cartItems   = 'SELECT * ' +
                    'FROM "cart" ' +
                    'WHERE groupNum = $1';
//seller
const isFinished = 'UPDATE "checkout" ' +
                  'SET isFinished = true ' +
                  'WHERE checkOutId = $1 ' +
                  'RETURNING *'  // Replace * with specific columns if needed
const isFinishedv2 = 'UPDATE "checkout" ' +
                  'SET isCanceled = true ' +
                  'WHERE checkOutId = $1 ' +
                  'RETURNING *'  // Replace * with specific columns if needed

                  //buyyer
// const getUserOrder=`SELECT c.*, p.* 
//                     FROM checkout c 
//                     JOIN payment p ON c.paymentRef = p.paymentId 
//                     WHERE p.paySuccess = TRUE AND 
//                     c.isCanceled = FALSE AND 
//                     c.userRef = $1;
//byyuer //queue
const getUserOrder= 'SELECT * FROM "checkout" WHERE ' +
                    'isCanceled = FALSE AND ' +
                    'isFinished = FALSE AND ' +
                    'userRef = $1;';

const getallUserOrder= 'SELECT * FROM "checkout" WHERE ' +
                    'isCanceled = FALSE AND ' +
                    'userRef = $1;';

//seller
// const getShopOrder=`SELECT c.*, p.* 
//                     FROM checkout c 
//                     JOIN payment p ON c.paymentRef = p.paymentId 
//                     WHERE p.paySuccess = TRUE AND 
//                     c.isCanceled = FALSE AND  
//                     c.shopRef = $1;
//seller
const getShopOrder=`SELECT * FROM "checkout" WHERE 
                    isCanceled = FALSE AND  
                    shopRef = $1; `

const getShopOrderv2=`SELECT * FROM "checkout" WHERE 
                    isCanceled = FALSE AND
                    isFinished = FALSE AND
                    shopRef = $1; `

// buyyer
const finishedOrder = 'SELECT * ' +
                    'FROM "checkout" ' +
                    'WHERE isFinished = TRUE ' +
                    'AND isCanceled = FALSE ' +
                    'AND userRef = $1';

module.exports = {
    //FETCH
    getOrders, //data management
    getUserOrder, //buyyer
    orderDetail, //seller
    cartItems, //seller
    getShopOrder, //seller
    getShopOrderv2,
    // getCheckoutId, //buyyer //queue
    getallUserOrder,
    finishedOrder,
    isFinishedv2, //buyyer
    //CREATE
    createOrder, //buyyer
    createCart, //buyyer

    //UPDATE
    cancelOrder, //buyyers
    isFinished, //seller
}