
// require('dotenv').config();
// const paymongo = require('paymongo-node')(process.env.NODE_ENV_PAYMONGO_SECRET);

// const createPayIntent = (amount) => {
//     paymongo.paymentIntents.create({
//       amount: amount,
//       payment_method_allowed: ['paymaya', 'gcash'],
//       payment_method_options: {card: {request_three_d_secure: 'any'}},
//       currency: 'PHP',
//       capture_type: 'automatic',
//       description: 'gcash and paymaya only'
  
//     })
//       .then(function(resource) {
//         console.log(resource);
//         return resource;
//       })
//       .catch(function(e) {
//         if (e.type === "AuthenticationError") {
//           // Handle authentication error
//         } else if (e.type === "InvalidRequestError") {
//           // Handle validation errors
//           e.errors.forEach(function (error) {
//             console.log(error.code);
//             console.log(error.detail);
//           })
//         }
//         return e;
//       });
// }
/* 
sample payment intent:
sk_test_JJinNnvdVnC5DqKxVdsMhREe  //gcash n paymaya only //used
pi_KKdkwyaxzg6euGPz1bXHZB9X
*/

// const createPayMethod = (name, email, phone, method) => {
//   paymongo.paymentMethods.create({
//     billing: {name: name, email: email, phone: phone},
//     type: method
//   })
//   .then(({ data }) => {
//     console.log(data)
//     return data;
//   })
//   .catch(err => {
//     console.error(err)
//     return err;
//   });
// }
/* 
samole payment method:
pm_44fS7EqURKYWDZ7M8yWGyNnC
pm_zNGCATDawdnpRunavigation.goBack()navigation.goBack()bRYi8cVZNw
*/

// const attachPayIntent = (payIntId, payMetId) => {
//   paymongo.paymentIntents.attach({
//     payment_method: payMetId,
//     return_url: 'https://www.paymongo.com/academy/the-paymongo-dashboard'
//   },{id: payIntId})
//   .then(({ data }) => {
//     console.log(data)
//     return data;
//   })
//   .catch(err => {
//     console.error(err)
//     return err;
//   });
// }

// const pay = async (req, res) => {
//   const {amount, name, email, phone, method} = req.body;
//   try {
//     const payInt = await createPayIntent(amount);
    

//     const payMet = await createPayMethod(name, email, phone, method);
//     if (payMet.errors) {
//       console.log('error', payMet.errors);
//       res.status(400).json({ message: payMet.errors})
//     } 

    // let payIntId = payInt.data.id;
    // let payMetId = payMet.data.id;
    // const attPay = await attachPayIntent(payIntId, payMetId)
    // if (attPay.errors) {
    //   console.log('error', attPay.errors);
    //   res.status(400).json({ message: attPay.errors})
    // }

    // res.status(200).json(attPay);
//   } catch (error) {
//     console.log(error);
//     res.status(400).json({ message: error})
//   }
// }

module.exports = {
  createPayIntent,
  createPayMethod,
  attachPayIntent,
  pay
}

/*
{
  create payment intent output:
  "data": {
    "id": "pi_5h8zVAw6t7Xy8bssTqh9bPC1",
    "type": "payment_intent",
    "attributes": {
      "amount": 2000,
      "capture_type": "automatic",
      "client_key": "pi_5h8zVAw6t7Xy8bssTqh9bPC1_client_D5d9N5qLw2ZrD21VKmCiXFRE",
      "currency": "PHP",
      "description": null,
      "livemode": false,
      "statement_descriptor": "CampusBytes",
      "status": "awaiting_payment_method",
      "last_payment_error": null,
      "payment_method_allowed": [
        "billease",
        "card",
        "paymaya",
        "gcash",
        "grab_pay",
        "dob",
        "atome"
      ],
      "payments": [],
      "next_action": null,
      "payment_method_options": {
        "card": {
          "request_three_d_secure": "any"
        }
      },
      "metadata": null,
      "setup_future_usage": null,
      "created_at": 1710826442,
      "updated_at": 1710826442
    }
  }
}

  create payment method output:
  {
  "data": {
    "id": "pm_hfhCuxM2jENSKxcWP6YVsrdq",
    "type": "payment_method",
    "attributes": {
      "livemode": false,
      "type": "gcash",
      "billing": {
        "address": {
          "city": null,
          "country": null,
          "line1": null,
          "line2": null,
          "postal_code": null,
          "state": null
        },
        "email": "e@asd.asd",
        "name": "name",
        "phone": "09123456789"
      },
      "created_at": 1710827752,
      "updated_at": 1710827752,
      "details": null,
      "metadata": null
    }
  }
}

  attach payment method output:
  {
  "data": {
    "id": "pi_5h8zVAw6t7Xy8bssTqh9bPC1",
    "type": "payment_intent",
    "attributes": {
      "amount": 2000,
      "capture_type": "automatic",
      "client_key": "pi_5h8zVAw6t7Xy8bssTqh9bPC1_client_D5d9N5qLw2ZrD21VKmCiXFRE",
      "currency": "PHP",
      "description": null,
      "livemode": false,
      "statement_descriptor": "CampusBytes",
      "status": "awaiting_next_action",
      "last_payment_error": null,
      "payment_method_allowed": [
        "billease",
        "card",
        "paymaya",
        "gcash",
        "grab_pay",
        "dob",
        "atome"
      ],
      "payments": [],
      "next_action": {
        "type": "redirect",
        "redirect": {
          "url": "https://test-sources.paymongo.com/sources?id=src_5g6dFf1AtXs9iXJA1vhF7Hvj",
          "return_url": "https://www.paymongo.com/academy/the-paymongo-dashboard?payment_intent_id=pi_5h8zVAw6t7Xy8bssTqh9bPC1"
        }
      },
      "payment_method_options": {
        "card": {
          "request_three_d_secure": "any"
        }
      },
      "metadata": null,
      "setup_future_usage": null,
      "created_at": 1710826442,
      "updated_at": 1710828070
    }
  }
}
*/