const Appliance = require('../Models/Appliance');
const Button = require('../Models/Button');
const { appliances, IR_Appliance } = require('../Appliance/Appliance'); // Import the in-memory storage
const {
  generateUrlSafeKey,
  keyLength,
} = require('../utils/generateUrlSafeKey');

function ownsAppliance(applianceId, owner) {
  return Appliance.exists({ id: applianceId, owner });
}

exports.poll = async (req, res) => {
  // console.log('polling');
  const { id } = req.params;
  const { message, state } = req.body; // Assuming message and state are sent in the request body
  if (!appliances[id]) {
    //   const applianceData = await Appliance.findOne({ id });
    //   if (!applianceData) {
    //     return res.status(404).send('Appliance not found');
    //   }

    appliances[id] = new IR_Appliance(id);
  }

  const appliance = appliances[id];
  const time = Math.floor(Date.now() / 1000);
  appliance.addToReceive(time, message);
  appliance.state = state;
  appliance.updateLastSeen();

  const nextCommand = appliance.getNextCommand();
  // await Appliance.updateOne({ id }, { lastSeen: appliance.lastSeen });
  // console.log(nextCommand);
  res.json(nextCommand);
  // res.json({m: 'hello'})
  // console.log(appliances[id]);
};

exports.addAppliance = async (req, res) => {
  console.log('enteed');
  const { id, nickname } = req.body;
  const owner = req.user.username;

  if (!appliances[id]) {
    console.log(`Appliance with ID ${id} not found`);
    return res
      .status(400)
      .send(
        `Appliance not found. Make sure you've got the right ID and the appliance is connected to the internet and powered on.`
      );
  }

  // in case the cleanup has not kicked in yet
  // 1s might be too long but if appliance remains not connected user will
  // get an error message in the next menu to map button
  //(as of right now, esp32 polls every 250ms)
  // console.log(Date.now()/1000 - appliances[id].lastSeen)
  // if(Date.now()/1000 - appliances[id].lastSeen > 3){
  //   return res.status(400).send('Appliance not connected');
  // }

  const result = await Appliance.findOne({ id });
  if (result) {
    if (result.owner !== owner) {
      return res
        .status(400)
        .send('Appliance is already being used by another user. ');
    }
    return res.status(400).send('Appliance already added.');
  }

  try {
    console.log(nickname);
    const apiKey = generateUrlSafeKey(keyLength);
    const appliance = new Appliance({ id, nickname, owner, apiKey });
    await appliance.save();
  } catch (error) {
    console.error(error);

    // Check if the error is a validation error from Mongoose
    if (error.name === 'ValidationError') {
      // Extract the error messages from the Mongoose validation error
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).send(messages.join(', '));
    }

    return res.status(500).send('Error adding appliance');
  }

  //appliances[id] = new IR_Appliance(id);
  res.status(201).send('Appliance added successfully');

  //res.status(201).json(appliance);
};

exports.getAppliances = async (req, res) => {
  console.log('entered get appliances');
  const owner = req.user.username;

  try {
    const appliances_ = await Appliance.find({ owner }).select(
      'id nickname lastSeen -_id'
    );

    const result = appliances_.map((appliance) => {
      const id = appliance.id;
      let lastSeen = appliance.lastSeen;
      if (appliances[id]) {
        console.log('entered if');
        lastSeen = appliances[id].lastSeen;
      }
      return { id, nickname: appliance.nickname, lastSeen };
    });

    console.log(result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching appliances:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while fetching appliances' });
  }
};

exports.deleteAppliance = async (req, res) => {
  try {
    const { id } = req.body;
    const owner = req.user.username;

    if (!id) {
      return res.status(400).json({ error: 'Appliance ID is required' });
    }

    const result = await Appliance.findOneAndDelete({ id, owner });

    if (!result) {
      return res.status(404).json({
        error:
          'Appliance not found or you do not have permission to delete this appliance',
      });
    }
    const applianceId = id;
    await Button.deleteMany({ applianceId });

    res.status(200).json({ message: 'Appliance deleted successfully' });
  } catch (error) {
    console.error('Error deleting appliance:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while deleting the appliance' });
  }
};

exports.receive = async (req, res) => {
  const { id } = req.params;
  const { protocol, value, bits } = req.body;

  console.log(`Received IR code from appliance ${id}`);
  console.log(`Protocol: ${protocol}, Value: ${value}, Bits: ${bits}`);

  // Process the received IR code here
  if (appliances[id].state === 'receive') {
    appliances[id].addToReceive(Math.floor(Date.now() / 1000), {
      protocol,
      value,
      bits,
    });
  }
  res.json({ status: 'success', message: 'IR code received' });
};

exports.setSendState = async (req, res) => {
  const { id } = req.params;

  if (!ownsAppliance(id, req.user.username)) {
    return res.status(403).send('You do not own this appliance');
  }

  if (!appliances[id]) {
    return res.status(400).send('Appliance not connected');
  }

  appliances[id].setSendState();
  res.json({ status: 'success', message: 'Send state set' });
};
