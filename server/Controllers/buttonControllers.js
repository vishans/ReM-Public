const Button = require('../Models/Button');
const Appliance = require('../Models/Appliance');
const { appliances } = require('../Appliance/Appliance');

function ownsAppliance(applianceId, owner) {
  return Appliance.exists({ id: applianceId, owner });
}

exports.selectButton = async (req, res) => {
  console.log(req.body);
  const { applianceId, selectedButton } = req.body;

  if (!ownsAppliance(applianceId, req.user.username)) {
    return res.status(403).send('You do not own this appliance');
  }

  try {
    // check if appliance is still connected
    // to add to memeroy stored appliance obj
    // put esp32 into receive mode if all ok
    if (!appliances[applianceId]) {
      return res.status(400).send('Appliance not connected');
    }

    // console.log(Date.now() / 1000 - appliances[applianceId].lastSeen);
    // if (Date.now() / 1000 - appliances[applianceId].lastSeen > 1.5) {
    //   return res.status(400).send('Appliance not connected');
    // }

    appliances[applianceId].selectedButton = selectedButton;
    appliances[applianceId].receivedSignal = null;

    console.log(appliances[applianceId]);
    appliances[applianceId].setReceiveState();

    res.status(200).json('OK');
  } catch (error) {
    console.log(error);
    res.status(500).send('Error selecting button');
  }
};

exports.unselectButton = async (req, res) => {
  // set selectedButton on the object to null
  // when user backs out of map button
  console.log('unselecting button');
  console.log(req.params);
  const { id } = req.params;
  const applianceId = id;

  if (!ownsAppliance(applianceId, req.user.username)) {
    return res.status(403).send('You do not own this appliance');
  }

  try {
    if (!appliances[applianceId]) {
      return res.status(400).send('Appliance not connected');
    }

    appliances[applianceId].selectedButton = null;
    appliances[applianceId].receivedSignal = null;

    appliances[applianceId].setSendState();
    res.status(200).json('OK');
  } catch (error) {
    console.log(error);
    res.status(500).send('Error unselecting button');
  }
};

exports.getSignalStatus = async (req, res) => {
  const { id } = req.params;
  const appliance = appliances[id];

  if (!ownsAppliance(id, req.user.username)) {
    return res.status(403).send('You do not own this appliance');
  }

  if (!appliance) {
    return res.status(400).send('Appliance not connected');
  }

  if (appliance.receivedSignal === null) {
    return res.status(200).send('Wait');
  } else {
    if (appliance.receivedSignal.protocol < 0) {
      return res.status(200).send('Try again');
    } else {
      res.status(200).send('OK');
      // appliance.setSendState();
    }
  }
};

exports.saveButton = async (req, res) => {
  console.log('saving button');
  const { id } = req.params;
  const applianceId = id;

  if (!ownsAppliance(applianceId, req.user.username)) {
    return res.status(403).send('You do not own this appliance');
  }

  const appliance = appliances[applianceId];

  if (
    appliance.receivedSignal === null ||
    appliance.selectedButton === null ||
    appliance.receivedSignal.protocol < 0
  ) {
    return res.status(400).send('Invalid signal or button');
  }

  const { protocol, value, bits } = appliance.receivedSignal;
  const { name, remoteIndex } = appliance.selectedButton;

  try {
    // Check if a button with the same remoteIndex exists
    const existingButton = await Button.findOne({applianceId, remoteIndex });

    if (existingButton) {
      // Update the existing button
      existingButton.applianceId = applianceId;
      existingButton.protocol = protocol;
      existingButton.value = value;
      existingButton.bits = bits;
      existingButton.name = name;
      await existingButton.save();
      console.log('Button updated successfully');
      res.status(200).send('Button updated successfully');
    } else {
      // Create a new button
      const newButton = new Button({
        applianceId,
        protocol,
        value,
        bits,
        name,
        remoteIndex,
      });
      await newButton.save();
      console.log('Button created successfully');
      res.status(200).send('Button created successfully');
    }
  } catch (error) {
    console.error('Error saving button:', error);
    res.status(500).send('Error saving button');
  }
};

exports.getButtonList = async (req, res) => {
  console.log('getting buttons');
  const { id } = req.params;
  const applianceId = id;

  if (!ownsAppliance(applianceId, req.user.username)) {
    return res.status(403).send('You do not own this appliance');
  }

  try {
    // Query the database to find all buttons with the specified applianceId
    const buttons = await Button.find({ applianceId }, 'remoteIndex name -_id');

    if (buttons.length > 0) {
      console.log('Buttons retrieved successfully');
      res.status(200).json(buttons);
    } else {
      console.log('No buttons found for this appliance');
      res.status(404).send('No buttons found for this appliance');
    }
  } catch (error) {
    console.error('Error retrieving buttons:', error);
    res.status(500).send('Error retrieving buttons');
  }
};

exports.clickButton = async (req, res) => {
  const { id, remoteIndex } = req.body;

  if (!appliances[id]) {
    return res.status(400).send('Appliance not connected');
  }

  if (!ownsAppliance(id, req.user.username)) {
    return res.status(403).send('You do not own this appliance');
  }

  try {
    const button = await Button.findOne({ applianceId: id, remoteIndex });

    if (!button) {
      return res.status(404).send('Button not found');
    }

    const signal = {
      value: button.value,
      bits: button.bits,
      protocol: button.protocol,
    };
    const message = { command: 'send', signal };
    const time = Math.floor(Date.now() / 1000);
    appliances[id].addToDispatch(time, message);
    console.log(message);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error fetching button:', error);
    res.status(500).send('Error fetching button');
  }
};

exports.deleteButton = async (req, res) => {
  const { applianceId, remoteIndex } = req.params;

  if (!ownsAppliance(applianceId, req.user.username)) {
    return res.status(403).send('You do not own this appliance');
  }

  try {
    const result = await Button.findOneAndDelete({
      applianceId,
      remoteIndex,
    });

    if (!result) {
      return res.status(404).send('Button not found');
    }

    res.status(200).send('Button deleted successfully');
  } catch (error) {
    console.error('Error deleting button:', error);
    res.status(500).send('Error deleting button');
  }
};
