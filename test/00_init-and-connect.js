require('./setup');
const { expect } = require('chai');
const { Bot } = require('..');

let defaultConfig = {
  master: 1
}

describe('Initialize Bot and connect to Discord API', function() {

  describe('new Bot()', function() {
    it('should create Bot without errors', function() {
      let bot = new Bot(defaultConfig);
      expect(bot.initialized).to.equal(false);
    });
  });

  describe('Bot#init()', function() {
    it('should initialize Bot without errors', async function() {
      let bot = new Bot(defaultConfig);
      await bot.init();
      expect(bot.initialized).to.equal(true);
    });
  });

  describe('Bot#start()', function() {
    it('should connect to Discord API without errors', async function() {
      let bot = new Bot(defaultConfig);
      await bot.init();
      let token = await bot.start(process.env.BOT_TOKEN);
      expect(token).to.equal(process.env.BOT_TOKEN);
      // stop the client or process will hang
      bot.client.destroy();
    });
  });
  
});