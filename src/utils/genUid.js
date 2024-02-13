const crypto = require('crypto');

function generateUID(email) {
    
    // Hashing the email to ensure consistency
    const hashedEmail = crypto.createHash('md5').update(email).digest('hex');
    
    // Combine the hash with the UUID to form a unique ID
    const uid = `cb-${hashedEmail}`;
  
    return uid;
}

module.exports = {generateUID};
  
  // Example usage
//   const customUID = generateUID();
//   console.log(customUID);
  