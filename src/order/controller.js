const bcrypt = require('bcrypt');
const redisClient = require('../lib/redis');
const pool = require('../lib/postgres');
const queries = require('./queries');
const { generateUID } = require('../utils/genUid');
const { generateToken } = require('../utils/auth');
const sanity = require('../lib/sanity');


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
    const isCanceled = false; //default value upon create order

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
        // res.status(201).json(outPut);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

    console.log('create cart');
    const { cartItems } = req.body;
    console.log(cartItems);
    try {
        for (const itemId in cartItems) {
            if (cartItems.hasOwnProperty(itemId)) {
                const items = cartItems[itemId];
                const item = items[0]; // Assuming each key contains an array of items
    
                const itemRef = item._id;
                const quantity = items.length; // Assuming quantity is the length of the array
                const price = item.price;
                const subTotalPrice = quantity * price;
    
                const values = [groupNum, itemRef, quantity, price, subTotalPrice, created_at];
    
                try {
                    const result = await pool.query(queries.createCart, values);
                    const outPut = result.rows[0]; // Assuming you want to return the first inserted row
                    console.log('outPut:', outPut);
                    // You might want to collect all outputs and send them back after the loop completes
                } catch (err) {
                    console.error('Error creating cart item:', err);
                    res.status(500).json({ error: err.message });
                    return; // Exit the function if an error occurs
                }
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
    

// const createCart = async (req, res) => {
//     console.log('create cart');
//     const { groupNum, cartItem, created_at } = req.body;
//     console.log(cartItem);
//     try {
//         for (const items of cartItem) {
//             const item = items[0];
            
//             const itemRef = item._id;
//             const quantity = items.length;
//             const price = item.price;
//             const subTotalPrice = quantity * price;
            
//             const values = [groupNum, itemRef, quantity, price, subTotalPrice, created_at];

//             try {
//                 const result = await pool.query(queries.createCart, values);
//                 const outPut = result.rows[0]; // Assuming you want to return the first inserted row
//                 console.log('outPut: ', outPut);
//                 // You might want to collect all outputs and send them back after the loop completes
//             } catch (err) {
//                 console.error('Error creating cart item:', err);
//                 res.status(500).json({ error: err.message });
//                 return; // Exit the function if an error occurs
//             }
//         }
//         // Send response after all cart items are inserted
//         res.status(201).json({ message: 'Cart items created successfully' });
//     } catch (error) {
//         // Handle errors
//         console.error('Error creating cart item:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };

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
const removePickup = async (req, res) => {
    console.log('remove from pickup');
    const { checkoutid, shopRef } = req.body;
    try {
        // Remove the checkout ID from the pickup queue in Redis
        redisClient.lrem(`pickup:${shopRef}`, 0, checkoutid, (err, result) => {
            if (err) {
                console.error('Error removing item from pickup:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            if (result === 0) {
                console.log('Checkout ID not found in pickup queue');
                res.status(404).json({ error: 'Checkout ID not found in pickup queue' });
                return;
            }
            console.log('Item removed from pickup:', result);
            res.status(200).json({ message: 'Item removed from pickup queue' });
        });
    } catch (error) {
        console.error('Error removing item from pickup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


//buyyer
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

// const getUserQueue = async (req, res) => {
//     console.log('get user queue');
//     const userId = req.params.id; // Fix the variable name
//     try {
//         const unfinishedCheckouts = await pool.query(queries.getUserOrder, [userId]);
//         const queue = [];
//         // console.log(unfinishedCheckouts);
//         for (const data of unfinishedCheckouts.rows) {
//             let index = -1;
//             console.log(data); // Fix the variable name
//             if (data.isspecial) {
//                 const queueKey = `queue:${data.shopref}:special`;
//                 const queueLength = await redisClient.llen(queueKey);
//                 const queueItems = await redisClient.lrange(queueKey, 0, -1);
//                 index = queueItems.findIndex(item => item );
//             } else {
//                 const queueKey = `queue:${data.shopref}`;
//                 const queueLength = await redisClient.llen(queueKey);
//                 const queueItems = await redisClient.lrange(queueKey, 0, -1);
//                 // console.log(queueItems);
//                 index = queueItemsqueueItems.findIndex(item => item );
//             }
//             // console.log(index);
//             if (index !== -1) {
//                 queue.push({ index });
//             } else {
//                 res.status(404).json({ error: 'Checkout ID not found in the queue' });
//                 return; // Return to prevent further execution
//             }
//         }

//         res.status(200).json(queue);
//     } catch (error) {
//         console.error('Error retrieving queue:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };


//buyyer

const getUserQueue = async (req, res) => {
    console.log('get user queue');
    const userId = req.params.id; // Corrected variable name
  
    try {
      const unfinishedCheckouts = await pool.query(queries.getUserOrder, [userId]);
          
      const queue = [];
      const queueSpecial = [];
      const queueClassic = [];
      const queueAll = [];

      for (const checkout of unfinishedCheckouts.rows) {
        //sort queue type 
        if (checkout.isspecial) {
            queueSpecial.push(checkout.checkoutid);    
        } else {
            queueClassic.push(checkout.checkoutid);
        }
      }

      for (const value  of queueSpecial) {queueAll.push(value)}
      for (const value of queueClassic) {queueAll.push(value)}
  
      for (const value of queueAll){
        const checkoutData = unfinishedCheckouts.rows.find(data => data.checkoutid === value);
        console.log(checkoutData);

        const globalQueue = []

        const queueKeySpecial = `queue:${checkoutData.shopref}:special`; // Combine queue key logic
        const queueKey = `queue:${checkoutData.shopref}`;

        const queueItemsSpecial = await redisClient.lrange(queueKeySpecial, 0, -1);
        const queueItems = await redisClient.lrange(queueKey, 0, -1);
        
        for (const value of queueItemsSpecial) {
            globalQueue.push(value);
        }
        for (const value of queueItems) {
            globalQueue.push(value)
        }

        console.log('globalqueue', globalQueue);
        let matchingIndex = -1;

        for (const [index, item] of globalQueue.entries()) {
            if (item === JSON.stringify(value)) {
                matchingIndex = index;
                break;
            }
        }

        if (matchingIndex !== -1) {
            queue.push({ index: matchingIndex, data: checkoutData.checkoutid }); // Include both index and data
        } else {
            res.status(404).json({ error: 'Checkout ID not found in the queue special' });         
            return;
        }
    }
    //   for (const checkout of unfinishedCheckouts.rows) { // Use descriptive name
    //     // console.log(checkout);
    //     const queueKey = `queue:${checkout.shopref}${checkout.isspecial ? ':special' : ''}`; // Combine queue key logic
          
    //     console.log(queueKey);
    //     // const queueLength = await redisClient.llen(queueKey);
    //     const queueItems = await redisClient.lrange(queueKey, 0, -1);
    //     console.log(`all queue ${checkout.isspecial ? ':special' : ''}`,queueItems);
        

    //     let matchingIndex = -1;
        
    //     // Use a for...of loop to iterate over array elements
    //     for (const value of queueAll){
    //         for (const [index, item] of queueItems.entries()) {
    //             if (item === JSON.stringify(value)) {
    //                 matchingIndex = index;
    //                 break;
    //             }
    //         }
    //     }            
        
    //   }
      console.log('classic', queueClassic);
      console.log('special', queueSpecial);
      console.log('all', queueAll);
      
      console.log('res: ',queue);
      res.status(200).json(queue);
    } catch (error) {
      console.error('Error retrieving queue:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  

const checkPaySuccess = async (req, res) => {
    console.log('checking if payment success');
    const id = req.params.id;
    console.log('id: ', id);
  
    try {
      const query = `SELECT * FROM payment WHERE paymentId = $1`;
      const values = [id];
      const result = await pool.query(query, values);
  
      if (result.rows.length === 0) {
        console.error('Payment not found');
        return res.status(404).json({ error: 'Payment not found' });
      }
  
      const paymentData = result.rows[0];
      const isPaymentSuccessful = paymentData.paySuccess;
  
      if (isPaymentSuccessful) {
        console.log('Payment successful');
        return res.status(200).json({ message: 'Payment successful' });
      } else {
        console.log('Payment not successful yet');
        return res.status(202).json({ message: 'Payment not successful yet' });
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
};

// buyyer
const userCheckout = async (req, res) => {
    console.log('user queue');
    const  userId  = req.params.id;
    
    
    // Implement functions to fetch data from Redis or other sources
    async function fetchCartByGroupNum(groupNum) {
        // Fetch cart based on groupNum
        try {
            // SQL query to fetch cart based on groupNum
            const sqlQuery = 'SELECT * FROM "cart" WHERE groupNum = $1';
            // Execute the query
            console.log(groupNum);
            const { rows } = await pool.query(sqlQuery, [groupNum]);      
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching cart:', error);
            throw error; // Rethrow the error for handling elsewhere
        }
    }


    async function fetchItems(itemRefs) {
        console.log('fetching items');
        try {
            const redisItems = await Promise.all(itemRefs.map(itemRef => redisClient.get(itemRef)));
      
            if (redisItems.every(item => item !== null && item !== undefined)) {
              console.log('redis items found');;
              return redisItems
            } else {
              console.log('fetching in sanity');
              const query = `*[_id in [${itemRefs.map(ref => `"${ref}"`).join(',')}]]`;
              const items = await sanity.fetch(query);
        
              if (items && items.length > 0) {
                  await Promise.all(items.map(item => {
                      redisClient.set(item._id, JSON.stringify(item))
                      console.log(`${item._id} added to redis`);
                  }));
                  return items;
              }
            }
            return []; // No items found
        } catch (error) {
            console.error('Error fetching items:', error);
            throw error;
        }
    }
          
    async function fetchShopDetails(shopRef) {
        // Fetch shop details from Redis or Sanity.io based on shopRef
        console.log('fetching shop details');
        try {
            const shopDetails = await redisClient.get(shopRef);
            
            if (!shopDetails) {
                console.log(`shop ${shopRef} not found in redis`);
                const query = `*[_type == 'shop' && _id == '${shopRef}']`;
                // const params = { shopRef };
                const fetchedShopDetails = await sanity.fetch(query);
                if (fetchedShopDetails.length === 1) {
                    await redisClient.set(fetchedShopDetails[0]._id, fetchedShopDetails[0]);
                    console.log('fetching shop successful');
                    return fetchedShopDetails[0];
                } else {
                    console.log('Shop not found in Sanity.io');
                    return null;
                }
            } else {
                console.log('fetching shop successful');
                return shopDetails;
            }
        } catch (error) {
            console.log('connection error', error);
            throw error; // or handle the error as needed
        }
    }
    
    async function fetchUserDetails(userRef) {
        console.log(userRef);
        try {
          // 1. Attempt to fetch from Redis
          const userData = await redisClient.get(`user:${userRef}`);
          if (userData) {
            return JSON.parse(userData);
          }
      
          // 2. Fallback to PostgreSQL if Redis miss
          const query = `SELECT * FROM "user" WHERE userid = $1`; // Adjust query based on your table structure
          const params = [userRef];
          const result = await pool.query(query, params);
      
          if (result.rows.length > 0) {
            const user = result.rows[0];
            // 3. Store data in Redis for future requests (optional)
            await redisClient.set(`user:${userRef}`, JSON.stringify(user));
            return user;
          }
      
          return null; // Indicate data not found
        } catch (error) {
          console.error('Error fetching user details:', error);
          throw error; // Rethrow the error for handling elsewhere
        }
    }

    try {
        // Fetch unfinished checkouts for the given userId
        const unfinishedCheckouts = await pool.query(queries.getUserOrder, [userId]);
        
        // Group data by checkoutId
        const dataByCheckoutId = {};
        
        // Process each checkout
        for (const checkout of unfinishedCheckouts.rows) {
            const { checkoutid, groupnum, shopref, userref } = checkout;
            
            console.log(checkout)
            // Fetch cart based on groupNum
            const cart = await fetchCartByGroupNum(groupnum);
            const itemrefs = await Promise.all(cart.map(cartd => cartd.itemref))
            // Fetch items for each cart
            // console.log(itemrefs);
            const items = await fetchItems(itemrefs) // assuming this works
            // Fetch shop details
            const shopDetails = await fetchShopDetails(shopref);
            
            // Fetch buyer user details
            const buyerDetails = await fetchUserDetails(userref);
            
            // Fetch shop owner details //im not sure if this is important
            const shopOwnerDetails = await fetchUserDetails(shopDetails?.shopowner);
            
            // Construct the data object for the checkout
            const checkoutData = {
                checkout,
                cart,
                items,
                shopDetails,
                buyerDetails,
                shopOwnerDetails
            };
            console.log(checkoutData);
            // Group the data by checkoutId
            dataByCheckoutId[checkoutid] = checkoutData;
        }
        // Return the grouped data
        res.status(200).json(dataByCheckoutId) 
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
      
};

//shop
const shopCheckout = async (req, res) => {
    console.log('shop queue');
    const  shopid  = req.params.id;
    try {
        // Fetch unfinished checkouts for the given userId
        const unfinishedCheckouts = await pool.query('SELECT * FROM "checkout" WHERE shopRef = $1 AND isFinished = false', [shopid]);
        
        // Group data by checkoutId
        const dataByCheckoutId = {};
        
        // Process each checkout
        for (const checkout of unfinishedCheckouts.rows) {
            const { checkOutId, groupnum, shopref, userref } = checkout;
            console.log(checkout);
            // Fetch cart based on groupNum
            const cart = await fetchCartByGroupNum(groupnum);
            const itemRefs = await Promise.all(cart.map(cartd => `"${cartd.itemref}"`))
            // Fetch items for each cart
            const items = await fetchItems(itemRefs) // assuming this works
            // Fetch shop details
            const shopDetails = await fetchShopDetails(shopref);
            
            // Fetch buyer user details
            const buyerDetails = await fetchUserDetails(userref);
            
            // Fetch shop owner details
            const shopOwnerDetails = await fetchUserDetails(shopDetails.shopOwner);
            
            // Construct the data object for the checkout
            const checkoutData = {
                checkout,
                cart,
                items,
                shopDetails,
                buyerDetails,
                shopOwnerDetails
            };
            
            // Group the data by checkoutId
            dataByCheckoutId[checkoutid] = checkoutData;
        }
        // Return the grouped data
        req.status(200).json(dataByCheckoutId) 
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
    
    // Implement functions to fetch data from Redis or other sources
    async function fetchCartByGroupNum(groupNum) {
        // Fetch cart based on groupNum
        try {
            // SQL query to fetch cart based on groupNum
            const sqlQuery = 'SELECT * FROM "cart" WHERE groupNum = $1';
            // Execute the query
            const { rows } = await pool.query(sqlQuery, [groupNum]);      
            return rows; // Return the fetched rows
        } catch (error) {
            console.error('Error fetching cart:', error);
            throw error; // Rethrow the error for handling elsewhere
        }
    }

    async function fetchItems(itemRefs) {
        try {
            const redisItems = await Promise.all(itemRefs.map(itemRef => {redisClient.get(itemRef)}));
            // console.log(redisItems);
            if (redisItems) {
                console.log(redisItems);
                console.log('gonna fetch from sanity');
            } else {
                console.log(redisItems);
                console.log('gonna fetch from redis');
            }
                
            // }
            // if (redisItems.every(item => item !== null || item !== undefined)) {
            //     return redisItems;
            // }
    
            // const query = `*[_id in [${itemRefs}]]`;
            // const items = await sanity.fetch(query, params);
    
            // if (items && items.length > 0) {
            //     await Promise.all(items.map(item => {
            //         redisClient.set(item._id, JSON.stringify(item))
            //         console.log(`${item._id} added to redis`);
            //     }));
            //     return items;
            // } 
    
            return []; // No items found
        } catch (error) {
            console.error('Error fetching items:', error);
            throw error;
        }
    }
    
    async function fetchShopDetails(shopRef) {
        // Fetch shop details from Redis or Sanity.io based on shopRef
        console.log('fetching shop details');
        try {
            const shopDetails = await redisClient.get(shopRef);
            if (!shopDetails) {
                console.log(`shop ${shopRef} not found in redis`);
                const query = `*[_type == 'shop' && _id == '${shopRef}']`;
                const fetchedShopDetails = await sanity.fetch(query);
                if (fetchedShopDetails.length === 1) {
                    await redisClient.set(fetchedShopDetails[0]._id, fetchedShopDetails[0]);
                    console.log('fetching shop successful');
                    return fetchedShopDetails[0];
                } else {
                    console.log('Shop not found in Sanity.io');
                    return null;
                }
            } else {
                console.log('fetching shop successful');
                return shopDetails;
            }
        } catch (error) {
            console.log('connection error', error);
            throw error; // or handle the error as needed
        }
    }
    
    async function fetchUserDetails(userRef) {
        try {
          // 1. Attempt to fetch from Redis
          const userData = await redisClient.get(`user:${userRef}`);
          if (userData) {
            return JSON.parse(userData);
          }
      
          // 2. Fallback to PostgreSQL if Redis miss
          const query = `SELECT * FROM "user" WHERE userid = $1`; // Adjust query based on your table structure
          const params = [userRef];
          const result = await pool.query(query, params);
      
          if (result.rows.length > 0) {
            const user = result.rows[0];
            // 3. Store data in Redis for future requests (optional)
            await redisClient.set(`user:${userRef}`, JSON.stringify(user));
            return user;
          }
      
          return null; // Indicate data not found
        } catch (error) {
          console.error('Error fetching user details:', error);
          throw error; // Rethrow the error for handling elsewhere
        }
    }
      
};

const getUserData = async (userId) => {
    try {
        const unfinishedCheckouts = await pool.query(queries.getUserOrder, [userId]);
        const dataByCheckoutId = {};

        for (const checkout of unfinishedCheckouts.rows) {
            const { checkoutid, groupnum, shopref, userref, isspecial } = checkout;
            const cart = await fetchCartByGroupNum(groupnum);
            const itemRefs = await Promise.all(cart.map(cartItem => cartItem.itemref));
            const items = await fetchItems(itemRefs);
            const shopDetails = await fetchShopDetails(shopref);
            const buyerDetails = await fetchUserDetails(userref);
            const shopOwnerDetails = await fetchUserDetails(shopDetails?.shopowner);

            const queueKey = `queue:${shopref}${isspecial ? ':special' : ''}`;
            const queueItems = await redisClient.lrange(queueKey, 0, -1);
            const matchingIndex = queueItems.findIndex(item => item === checkoutid);

            if (matchingIndex !== -1) {
                const checkoutData = {
                    checkout,
                    cart,
                    items,
                    shopDetails,
                    buyerDetails,
                    shopOwnerDetails,
                    queueIndex: matchingIndex
                };
                dataByCheckoutId[checkoutid] = checkoutData;
            } else {
                throw new Error('Checkout ID not found in the queue');
            }
        }

        return dataByCheckoutId;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
};

const userCheckoutAndQueue = async (req, res) => {
    const userId = req.params.id;

    try {
        const userData = await getUserData(userId);
        res.status(200).json(userData);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};


// const isFinished = async (req, res) => {
//     console.log('order is finished');
//     const {checkoutid, shopRef, userref, isFinished } = req.body;
//     try {
//         const queuePop = await redisClient.
//     } catch (error) {
        
//     }
// }

module.exports = {
    //FETCH
    getOrders,      //data management

    getAllQueue,    //seller
    getUserQueue, //buyyer
    getOrderDetails, //seller
    checkPaySuccess, //buyyer
    userCheckoutAndQueue, //buyyer
    userCheckout,// buyyer
    shopCheckout, //seller

    //CREATE
    createOrder,    //buyyer
    // createCart,     //buyyer

    //UPDATE
    cancelOrder,    //buyyer
    setpickup,       //seller
    //REDIS
    indexQueue,      //buyyer
    pickupListener,  //buyyer
    removePickup,
    
};