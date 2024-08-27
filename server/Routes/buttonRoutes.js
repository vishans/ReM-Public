const express = require('express');
const buttonController = require('../Controllers/buttonControllers');
const router = express.Router();

router.post('/select', buttonController.selectButton);
router.post('/unselect/:id', buttonController.unselectButton);
router.get('/signalStatus/:id', buttonController.getSignalStatus);
router.post('/save/:id', buttonController.saveButton);
router.get('/list/:id', buttonController.getButtonList);

router.post('/click/', buttonController.clickButton);

router.delete('/:applianceId/:remoteIndex', buttonController.deleteButton);

module.exports = router;
