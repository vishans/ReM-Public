// authMiddleware.js
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET ||'your_secret_key';
const User = require('./Models/User');

const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).send('Access denied. No token provided.');
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], secretKey); // Assuming Bearer token format
    const user = await User.findOne({ username: decoded.username });
    
    if(user.loginTokenVersion !== decoded.loginTokenVersion) {
      throw new Error('Invalid token');
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send('Invalid token.');
  }
};

module.exports = authMiddleware;
