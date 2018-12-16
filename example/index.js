require('dotenv').config()
const path = require('path');
const { Bot } = require('../');
const pluginExamples = require('./plugin-examples');

(async function bootstrap() {

  let config = {
    // Set the MASTER_ID environment variable to your discord id.
    master: process.env.MASTER_ID,
    prefix: '.',
    database: {
      username: 'username',
      password: 'password',
      database: 'database',
      provider: 'sqlite',
      storage: path.join(__dirname, 'storage.sqlite')
    }
  }

  let bot = new Bot(config);
  // Set the BOT_TOKEN environment variable to your bot token.
  try {
    await bot.init();
    await bot.addModule(pluginExamples);
    await bot.start(process.env.BOT_TOKEN);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
})();
