const Appliance = require('../Models/Appliance');
const appliances = {};

class IR_Appliance {
  constructor(id) {
    this.id = id;
    this.state = undefined; // str: send or receive
    this.dispatch = [];
    this.receive = [];
    this.lastSeen = null;

    this.selectedButton = null;
    this.receivedSignal = null;
  }

  addToDispatch(time, message) {
    this.dispatch.push({ time, message });
  }

  addToReceive(time, message) {
    if (message === 'polling') return;

    console.log(message);
    if (message.hasOwnProperty('protocol')) {
      if (this.receivedSignal === null || this.receivedSignal.protocol < 0) {
        this.receivedSignal = message;
        console.log(`Received signal from appliance ${this.id}:`, message);
      }
      return;
    }
    this.receive.push({ time, message });
  }

  updateLastSeen() {
    this.lastSeen = Math.floor(Date.now() / 1000); // Unix time in seconds
  }

  getNextCommand() {
    return this.dispatch.length > 0 ? this.dispatch.shift() : null;
  }

  toJSON() {
    return {
      id: this.id,
      state: this.state,
      dispatch: this.dispatch,
      receive: this.receive,
      lastSeen: this.lastSeen,
    };
  }

  setReceiveState() {
    const time = Math.floor(Date.now() / 1000);
    const message = { command: 'receive' };
    this.state = 'receive';
    this.addToDispatch(time, message);
    console.log(
      `Added receive state change command to dispatch for appliance ${this.id}`
    );
  }

  setSendState() {
    const time = Math.floor(Date.now() / 1000);
    const message = { command: 'send', protocol: -1 };
    this.state = 'send';
    this.addToDispatch(time, message);
    console.log(
      `Added send state change command to dispatch for appliance ${this.id}`
    );
  }
}

async function removeOutdatedAppliances() {
  const now = Math.floor(Date.now() / 1000);
  const oneMinuteAgo = now - 60;

  for (const [id, appliance] of Object.entries(appliances)) {
    if (appliance.lastSeen && appliance.lastSeen < oneMinuteAgo) {
      console.log(`Removing appliance ${id} due to inactivity.`);
      delete appliances[id];
      try {
        await Appliance.updateOne({ id }, { lastSeen: appliance.lastSeen });
      } catch (error) {
        console.error(error);
      }
    }
  }
}

// Run the cleanup function every half minute (default)
setInterval(removeOutdatedAppliances, eval(process.env.CLEANUP_INTERVAL)||0.5 * 60 * 1000);

module.exports = {
  appliances,
  IR_Appliance,
};
