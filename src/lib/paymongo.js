const axios = require('axios');
const { Router } = require("express");
const pool = require('../lib/postgres');

router = Router();

require('dotenv').config({path: '.env.paymongo'});
// (process.env.NODE_ENV_PAYMONGO_SECRET);
const serverurl = 'http://localhost:3000/api/paymongo/confirmPayment';

router.post('/initializePay', async (req, res)=>{
  console.log('initialize pay');
  const {_id, amount, name, email, phone, method, created_at} = req.body;
  
  if (_id === '42662a99-47b5-490d-915b-597b2f8cdbf9') {
    envdata =  {
      public: process.env.NODE_ENV_PAYMONGO_PUBLIC_jamil,
      secret: process.env.NODE_ENV_PAYMONGO_SECRET_jamil
    };
    console.log(envdata);
  } if (_id === '7d66bd84-ca24-454d-8b5b-b317146c339c') {
    envdata =  {
      public: process.env.NODE_ENV_PAYMONGO_PUBLIC_shaina,
      secret: process.env.NODE_ENV_PAYMONGO_SECRET_shaina
    };
  } else {
    console.log('keys not available');
  }
  const base64TestSecretKey = Buffer.from(envdata.secret).toString('base64');

  try {
    // Creating a payment intent
    const createPayIntent = await axios.post('https://api.paymongo.com/v1/payment_intents', {
      data: {
        attributes: {
          amount: amount,
          payment_method_allowed: ['paymaya', 'gcash', 'grab_pay'],
          payment_method_options: {card: {request_three_d_secure: 'any'}},
          currency: 'PHP',
          capture_type: 'automatic',
          description: 'e-wallet only'
        }
      }
    }, {
      headers: {
        'Authorization': `Basic ${base64TestSecretKey}`
      }
    });

    // Creating a payment method
    const createPayMethod = await axios.post('https://api.paymongo.com/v1/payment_methods', {
      data: {
        attributes: {
          billing: {name: name, email: email, phone: phone},
          type: method
        }
      }
    }, {
      headers: {
        'Authorization': `Basic ${base64TestSecretKey}`
      }
    });

    // Attaching payment method to payment intent
    const attachPayIntent = await axios.post(`https://api.paymongo.com/v1/payment_intents/${createPayIntent.data.data.id}/attach`, {
      data: {
        attributes: {
          payment_method: createPayMethod.data.data.id,
          return_url: serverurl
        }
      }
    }, {
      headers: {
        'Authorization': `Basic ${base64TestSecretKey}`
      }
    });

    // Sending response
    // console.log({
    //   crePayInt: createPayIntent.data,
    //   crePayMet: createPayMethod.data,
    //   attPayInt: attachPayIntent.data
    // });
    const query = `INSERT INTO payment (paymentInt, paymentMet, created_at) VALUES ($1, $2, $3) RETURNING *;`;  
    const result = await pool.query(query, [createPayIntent.data.data.id, createPayMethod.data.data.id, created_at]);

    res.json({
      result: result.rows[0],
      createPayIntent: createPayIntent.data,
      createPayMethod: createPayMethod.data,
      attachPayIntent: attachPayIntent.data,
    });
  } catch (error) {
    console.log('payment initializing error: ', error);
    res.status(400).json({error: error.message || error});
  }
});

// nasama na pla to sa initialize pay
router.post('/addPayment', async (req, res) => {
  console.log('record payment');
  const { createPayIntent, createPayMethod, created_at } = req.body;
  try {
    // Insert payment information into the database
    const queryText = 'INSERT INTO payment (paymentInt, paymentMet, created_at) VALUES ($1, $2, $3)';
    const values = [createPayIntent, createPayMethod, created_at];
    await pool.query(queryText, values);
    
    res.status(200).json({ success: true, message: 'Payment information recorded successfully' });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// buyyer callback
router.get('/confirmPayment', async (req, res) => {
  console.log('confirm Payment');
  // const id = req.params.payment_intent_id;
  const id = req.query.payment_intent_id;
  console.log(req.query);
  try {
    // Query the database to check if the ID exists
    const result = await pool.query('SELECT COUNT(*) FROM payment WHERE paymentInt = $1', [id]);
    const count = parseInt(result.rows[0].count);
    if (count > 0) {
      const isTrue = true;
      // ID exists in the database
      const update = await pool.query('UPDATE payment SET paySuccess = $1 WHERE paymentInt = $2', [isTrue, id])
      // res.json({ exists: true });
    } else {
      // ID does not exist in the database
      console.log(req);
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking payment ID or it doenst exist');
    res.status(500).json({ error: 'Error checking payment ID or it doenst exist' });
  }
});

module.exports = router;
