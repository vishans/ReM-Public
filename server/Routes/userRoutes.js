const express = require('express');
const userController = require('../Controllers/userControllers');
const authMiddleware = require('../authMiddleware');
const router = express.Router();

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.delete('/', authMiddleware,userController.deleteUser);
router.post('/changePassword', authMiddleware, userController.changePassword);

module.exports = router;
