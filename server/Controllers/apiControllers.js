const Appliance = require('../Models/Appliance');
const Button = require('../Models/Button');
const { appliances, IR_Appliance } = require('../Appliance/Appliance'); // Import the in-memory storage
const { generateUrlSafeKey, keyLength } = require('../utils/generateUrlSafeKey');

function ownsAppliance(applianceId, owner) {
  return Appliance.exists({ id: applianceId, owner });
}

exports.pressButton = async (req, res) => {
  const { apiKey, remoteIndex } = req.params;

  const applianceDB = await Appliance.findOne({ apiKey });
  console.log(applianceDB);
  if (!applianceDB) {
    return res.status(400).send('Invalid key.');
  }

  const appliance = appliances[applianceDB.id];

  if (!appliance) {
    return res.status(400).send('Appliance not connected');
  }

  // button press

  try {
    const button = await Button.findOne({
      applianceId: appliance.id,
      remoteIndex,
    });

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
    appliances[appliance.id].addToDispatch(time, message);
    console.log(message);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error fetching button:', error);
    res.status(500).send('Error fetching button');
  }
};

exports.getAPIKey = async (req, res) => {
  const { id } = req.params;

  if (!ownsAppliance(id, req.user.username)) {
    return res.status(403).send('You do not own this appliance');
  }

  const applianceDB = await Appliance.findOne({ id });
  if (!applianceDB) {
    return res.status(400).send('Appliance does not exist');
  }
  console.log(applianceDB.apiKey);
  res.json({ apiKey: applianceDB.apiKey });
};

exports.newKey = async (req, res) => {
  const { id } = req.params;

  if (!ownsAppliance(id, req.user.username)) {
    return res.status(403).send('You do not own this appliance');
  }

  try {
    const result = await Appliance.updateOne({id}, {apiKey: generateUrlSafeKey(keyLength)});
    console.log('Update Result:', result);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error updating document:', error);
  }
};
