const bcrypt = require('bcrypt');
const redisClient = require('../lib/redis');
const pool = require('../lib/postgres');
const queries = require('./queries');
const { generateUID } = require('../utils/genUid');
const { generateToken } = require('../utils/auth');


const getOrders = async (req, res) => {
    console.log('get orders');
    try {
        // Query to fetch orders from the database
        // Execute the query
        await pool.query(queries.getOrders, (err, result) =>{
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(200).json(result.rows);
        });
        // Send the fetched orders as JSON response
    } catch (error) {
        // Handle errors
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const createOrder = async (req, res) => {
    console.log('create order');
    const { paymentRef, userRef, shopRef, groupNum, serviceTax, deliveryFee, totalAmount, 
            location, isSpecial, isFinished, created_at } = req.body;
    const isCanceled = null; //default value upon create order

    console.log(req.body);
    try {
        const values = [paymentRef, userRef, shopRef, groupNum, serviceTax, deliveryFee, 
                        totalAmount, location, isSpecial, isCanceled, isFinished, created_at];
        const result = await pool.query(queries.createOrder, values);
        const outPut = result.rows[0]; // Assuming you want to return the first inserted row
        console.log('outPut: ', outPut);
        if (isSpecial) {
            redisClient.rpush(`queue:${shopRef}:special`, JSON.stringify(outPut.checkoutid), (err, result) => {
                if (err) {
                    console.error('Error pushing to queue:', err);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }
                console.log('add to special queue');
                console.log('result: ', result);
            });
        } else {
            redisClient.rpush(`queue:${shopRef}`, JSON.stringify(outPut.checkoutid), (err, result) => {
                if (err) {
                    console.error('Error pushing to queue:', err);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }
                console.log('add to queue');
                console.log('result: ', result);
            });
        }
        res.status(201).json(outPut);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
    

const createCart = async (req, res) => {
    console.log('create cart');
    const { groupNum, cartItem, created_at } = req.body;
    console.log(cartItem);
    try {
        for (const items of cartItem) {
            const item = items[0];
            
            const itemRef = item._id;
            const quantity = items.length;
            const price = item.price;
            const subTotalPrice = quantity * price;
            
            const values = [groupNum, itemRef, quantity, price, subTotalPrice, created_at];

            try {
                const result = await pool.query(queries.createCart, values);
                const outPut = result.rows[0]; // Assuming you want to return the first inserted row
                console.log('outPut: ', outPut);
                // You might want to collect all outputs and send them back after the loop completes
            } catch (err) {
                console.error('Error creating cart item:', err);
                res.status(500).json({ error: err.message });
                return; // Exit the function if an error occurs
            }
        }
        // Send response after all cart items are inserted
        res.status(201).json({ message: 'Cart items created successfully' });
    } catch (error) {
        // Handle errors
        console.error('Error creating cart item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const cancelOrder = async (req, res) => {
    console.log('cancel order');
    const { userRef, shopRef, groupNum, isCanceled } = req.body;
    try {
        // Execute the UPDATE statement to mark the order as canceled
        const values = [isCanceled, userRef, shopRef, groupNum];
        const result = await pool.query(queries.cancelOrder, values);

        // Check if any rows were affected by the UPDATE
        if (result.rowCount === 1) {
            const checkoutid = result.rows[0].checkoutid;
            const isSpecial = result.rows[0].isSpecial;
            if (isSpecial) {
                redisClient.lrem(`queue:${shopRef}:special`, 1, checkoutid, (err, result) => {
                    if (err) {
                        console.error('Error removing from queue:', err);
                        res.status(500).json({ error: 'Internal server error' });
                        return;
                    }
                    console.log('result: ', result);
                });
            } else {
                redisClient.lrem(`queue:${shopRef}`, 1, checkoutid, (err, result) => {
                    if (err) {
                        console.error('Error removing from queue:', err);
                        res.status(500).json({ error: 'Internal server error' });
                        return;
                    }
                    console.log('result: ', result);
                });
            }
            res.status(200).json({ message: 'Order canceled successfully' });
        } else {
            res.status(404).json({ error: 'Order not found or already canceled' });
        }
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getOrderDetails = async (req, res) => {
    console.log('get order by shopid');
    const { checkoutid } = req.params; // Correcting the extraction of checkoutid
    try {
        // Query database to fetch order details by checkoutid
        const values = [checkoutid];
        const { rows } = await pool.query(queries.orderDetail, values);

        // Check if an order with the provided checkoutid exists
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        } else {
            const groupNum = rows[0].groupNum;
            const {cartRow} = await pool.query(queries.cartItems, groupNum);
            if (cartRow.length === 0) {
                return res.status(404).json({ error: 'Cart not found' });
            } else return res.status(200).json(cartRow);
        }
        // Send the order details as JSON response
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const setpickup = async (req, res) => {
    console.log('ready to pickup');
    const { checkoutid, shopRef, isSpecial, isFinished } = req.body;
    try {
        // Update the status of the order to indicate it is ready for pickup
        const values = [isFinished, checkoutid];
        await pool.query(queries.isFinished, values);
        if (isSpecial) {
            redisClient.rpop(`queue:${shopRef}:special`, checkoutid, (err, result) => {
                if (err) {
                    console.error('Error pushing to queue:', err);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }
                console.log('result: ', result);
            });
        } else {
            redisClient.rpop(`queue:${shopRef}`, checkoutid, (err, result) => {
                if (err) {
                    console.error('Error pushing to queue:', err);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }
                console.log('result: ', result);
            });
        };
        await redisClient.rpush(`pickup:${shopRef}`, checkoutid, (err, result) => {
            if (err) {
                console.error('Error adding to pickup queue:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            console.log('result: ', result);
        });
        res.status(200).json({ message: 'Order status updated to ready for pickup' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//===================
//redis

// for costumers
const indexQueue = async (req, res) => {
    console.log('index queue');
    const { checkoutid, shopRef, isSpecial } = req.body;
    try {
        if (isSpecial) {
            const index = await redisClient.lindex(`queue:${shopRef}:special`, checkoutid);
            if (index !== -1) {
                res.status(200).json({ index });
            } else {
                res.status(404).json({ error: 'Checkout ID not found in the queue' });
            }
        } else {
            const speciallength = await redisClient.llen(`queue:${shopRef}:special`);
            const index = await redisClient.lindex(`queue:${shopRef}`, checkoutid);
            const actualindex = index + speciallength;
            if (index !== -1) {
                res.status(200).json({ actualindex });
            } else {
                res.status(404).json({ error: 'Checkout ID not found in the queue' });
            }
        }
    } catch (error) {
        console.error('Error indexing queue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const pickupListener = async (req, res) => {
    console.log('pickup listener');
    const { checkoutid, shopRef} = req.body;
    try {
        redisClient.lindex(`pickup:${shopRef}`, checkoutid, (err, result) => {
            if (err) {
                console.error('Error pushing to queue:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            console.log('result: ', result);
            res.status(200).json({ 
                result: result,
                message: 'ready to pickup' });
        });
    } catch (error) {
        console.log('Error pushing to queue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// for seller
const getAllQueue = async (req, res) => {
    console.log('get all queue');
    const  shopRef  = req.params.id;
    try {
        const queueSpecial = await redisClient.lrange(`queue:${shopRef}:special`, 0, -1);
        const queue = await redisClient.lrange(`queue:${shopRef}`, 0, -1);

        const allQueue = {
            queueSpecial,
            queue
        };

        res.status(200).json(allQueue);
    } catch (error) {
        console.error('Error retrieving queue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = {
    //FETCH
    getOrders,      //data management

    getAllQueue,    //seller
    getOrderDetails, //seller

    //CREATE
    createOrder,    //buyyer
    createCart,     //buyyer

    //UPDATE
    cancelOrder,    //buyyer
    setpickup,       //seller
    //REDIS
    indexQueue,      //buyyer
    pickupListener,  //buyyer
};