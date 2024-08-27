const express = require('express');
const applianceController = require('../Controllers/applianceControllers');
const router = express.Router();
const authMiddleware = require('../authMiddleware');

// Define the routes
router.post('/:id/poll', applianceController.poll);
router.post('/receive/:id', applianceController.receive);

router.use(authMiddleware);
router.get('/list', applianceController.getAppliances);
router.post('/add', applianceController.addAppliance);
router.delete('/', applianceController.deleteAppliance);

router.post('/setSendState/:id', applianceController.setSendState);

module.exports = router;
