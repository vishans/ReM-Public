const User = require('../Models/User');
const Appliance = require('../Models/Appliance');
const Button = require('../Models/Button');
const jwt = require('jsonwebtoken');
const {
  generateUrlSafeKey,
  keyLength,
} = require('../utils/generateUrlSafeKey');

const secretKey = process.env.JWT_SECRET || 'your_secret_key';

exports.registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(500).send('Error registering user');
  }
};

exports.loginUser = async (req, res) => {
  console.log('here');
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        loginTokenVersion: user.loginTokenVersion,
      },
      secretKey,
      { expiresIn: process.env.JWT_EXPIRATION || '1h' }
    );
    res.status(200).json({ token });
    console.log(`User ${user.username} logged in successfully`);
  } catch (error) {
    console.log(error);
    res.status(500).send('Error logging in user');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findOneAndDelete({ username: req.user.username });

    // Find all appliances owned by the user
    const appliances = await Appliance.find({ owner: req.user.username });

    // Delete all appliances owned by the user
    await Appliance.deleteMany({ owner: req.user.username });

    // Delete all the buttons associated with the appliances
    for (const appliance of appliances) {
      await Button.deleteMany({ applianceId: appliance.id });
    }

    res.status(200).send('User deleted successfully');
  } catch (error) {
    res.status(500).send('Error deleting user');
  }
};

exports.changePassword = async (req, res) => {
  console.log(req.body);

  try {
    const user = await User.findOne({ username: req.user.username });

    if (!user) {
      return res.status(404).send('User not found');
    } else {
      const { currentPassword, newPassword, revokeAPIKeys } = req.body;
      console.log(req.body);
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).send('Invalid password');
      }

      user.password = newPassword;
      user.loginTokenVersion += 1;
      await user.save();

      // revoke all api keys if necessary
      if (revokeAPIKeys) {
        const appliances = await Appliance.find({ owner: req.user.username });
        for (const appliance of appliances) {
          appliance.apiKey = generateUrlSafeKey(keyLength);
          await appliance.save();
        }
      }
      res.status(200).send('Password changed successfully');
    }
  } catch (error) {
    res.status(500).send('Error changing password');
  }
};
