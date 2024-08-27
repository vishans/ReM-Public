const express = require('express');
const apiController = require('../Controllers/apiControllers');
const authMiddleware = require('../authMiddleware');
const router = express.Router();

router.post('/press/:apiKey/:remoteIndex', apiController.pressButton);
router.use(authMiddleware)
router.get('/APIKey/:id' , apiController.getAPIKey);
router.get('/newKey/:id', apiController.newKey);

module.exports = router;
