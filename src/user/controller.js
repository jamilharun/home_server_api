const bcrypt = require('bcrypt');

const pool = require('../lib/postgres');
const queries = require('./queries');
const { generateUID } = require('../utils/genUid');
const { generateToken } = require('../utils/auth');

const getUsers = (req, res ) => {
    console.log('get users');
    pool.query(queries.getUsers, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(200).json(result.rows);
    });
};

const getUserById = async (req, res) => {
    console.log('get user by id');
    pool.query(queries.getUserById, [req.params.id], (err, result) => {
        // if (err) throw err;
        if (err) {
            // debugging:
            console.log(queries.getUserById, [req.params.id]);
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(200).json(result.rows)    
    })
};

const createUser = async (req, res) => {
    const { name, email, password } = req.body;

    const existingUser = await pool.query(queries.getUserByEmail, [email]);
    if (existingUser?.rows?.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const uid = generateUID(email);
  
    // Hash the password before storing it in the database
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
        // console.log('inserting phase');

        const result = await pool.query(queries.createUser,[uid, name, email, passwordHash]);      
        const userId = result.rows[0].userid;
        const token = generateToken(userId);
    
        res.json({ token });
      } catch (err) {
        console.error('Error registering user', err);
        res.status(500).json({ error: 'Internal server error' });
      }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    // Retrieve user information from the database based on the email
    const result = await pool.query(queries.getUserByEmail, [email]);
    const user = result?.rows[0];
  
    // Check if the user exists and the password is correct
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      const token = generateToken(user.userid);
      res.json({ user, token });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
};

// edit user information
// i think this is redundant due to auth0 authentication
// maybe 

const editUser = async (req, res) => {
  const { userid, given_name, family_name, nickname, name, password, phonenumber, roles } = req.body;

  try {
    await pool.query('BEGIN'); // Start a transaction

    if (given_name) {
      await pool.query(queries.editGivenName, [given_name, userid]);
      res.status(200).json({ message: 'Given name updated' });
    }
    if (family_name) {
      await pool.query(queries.editFamilyName, [family_name, userid]);
      res.status(200).json({ message: 'Family name updated' });
    }
    if (nickname) {
      await pool.query(queries.editNickname, [nickname, userid]);
      res.status(200).json({ message: 'Nickname updated' });
    }
    if (name) {
      await pool.query(queries.editName, [name, userid]);
      res.status(200).json({ message: 'Name updated' });
    }
    if (password) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      await pool.query(queries.editPasswordHash, [passwordHash, userid]);
      res.status(200).json({ message: 'Password updated' });
    }
    if (phonenumber) {
      await pool.query(queries.editPhonenumber, [phonenumber, userid]);
      res.status(200).json({ message: 'Phonenumber updated' });
    }

    await pool.query('COMMIT'); // Commit the transaction
  } catch (err) {
    await pool.query('ROLLBACK'); // Rollback the transaction in case of an error
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const insertUser = async (req, res) => {
  console.log('insert User');
  const { userId, given_name, family_name, nickname, name, email, phoneNumber } = req.body;
  try {
    // Execute the SQL query to insert a new user
    const values = [userId, given_name, family_name, nickname, name, email, phoneNumber];
    await pool.query(queries.insertUser, values);

    // Send a success response
    res.status(201).send('User inserted successfully');
  } catch (error) {
    console.error('Error inserting user:', error);
    // Send an error response
    res.status(500).send('Internal Server Error');
  }
};


module.exports = {
    getUsers,
    getUserById,
    createUser,
    loginUser,
    editUser,
    insertUser
}