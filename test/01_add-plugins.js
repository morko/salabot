require('./setup');
const { expect } = require('chai');
const { Bot } = require('..');

let defaultConfig = {
  master: "1"
};

function createPluginModule() {
  return {
    filter: {
      type: 'filter',
      hook: 'preParse',
      run: () => {}
    },

    command: {
      type: 'command',
      category: 'test',
      name: 'testcommand',
      description: 'test',
      aliases: ['tc', 'teco', 'tescom'],
      arguments: ['test'],
      argumentsOptional: false,
      allowDM: false,
      permission: 'everyone',
      run: () => {}
    },

    task: {
      type: 'task',
      category: 'test',
      name: 'testtask',
      description: 'test',
      aliases: ['tt', 'teta', 'testas'],
      cron: '*/5 * * * * *',
      permission: 'role',
      run: () => {}
    }
  }
}

// plugin module with overlapping names
let overlappingPluginModule = {
  command: {
    type: 'command',
    category: 'test',
    name: 'overlap',
    description: 'test',
    run: () => {}
  },

  task: {
    type: 'task',
    category: 'test',
    name: 'overlap',
    description: 'test',
    cron: '*/5 * * * * *',
    run: () => {}
  }
}

async function createBot(config) {
  let bot = new Bot(config);
  await bot.init();
  //await bot.start(process.env.BOT_TOKEN);
  return bot;
}

describe('Adding different kind of plugins to Bot', function() {

  describe('Bot#add(filter)', function() {
    it('should add a filter plugin without errors', async function() {
      let bot = await createBot(defaultConfig);
      await bot.add(createPluginModule().filter);
    });
  });

  describe('Bot#add(command)', function() {
    it('should add a command plugin without errors', async function() {
      let bot = await createBot(defaultConfig);
      await bot.add(createPluginModule().command);
    });
  });

  describe('Bot#add(task)', function() {
    it('should add a task plugin without errors', async function() {
      let bot = await createBot(defaultConfig);
      await bot.add(createPluginModule().task);
    });
  });

  describe('Bot#addModule(pluginModule)', function() {
    it('should add a plugin module without errors', async function() {
      let bot = await createBot(defaultConfig);
      await bot.addModule(createPluginModule());
    });
  });

  describe('Bot#add(pluginModuleWithOverlappingIdentifiers)', function() {
    it('should throw if plugin names are same', async function() {
      let bot = await createBot(defaultConfig);
      let pluginModule = createPluginModule();
      pluginModule.command.name = 'overlap';
      pluginModule.task.name = 'overlap';
      await bot.add(pluginModule.command);
      return expect(bot.add(pluginModule.task))
        .to.be.rejectedWith(Error);
    });

    it('should throw if plugin aliases are same', async function() {
      let bot = await createBot(defaultConfig);
      let pluginModule = createPluginModule();
      pluginModule.command.aliases = ['bla', 'overlap'];
      pluginModule.task.aliases = ['overlap'];
      await bot.add(pluginModule.command);
      return expect(bot.add(pluginModule.task))
        .to.be.rejectedWith(Error);
    });

    it('should throw if plugin aliases overlaps name', async function() {
      let bot = await createBot(defaultConfig);
      let pluginModule = createPluginModule();
      pluginModule.command.name = 'overlap';
      pluginModule.task.aliases = ['overlap'];
      await bot.add(pluginModule.command);
      return expect(bot.add(pluginModule.task))
        .to.be.rejectedWith(Error);
    });

    it('should throw if plugin name overlaps aliases', async function() {
      let bot = await createBot(defaultConfig);
      let pluginModule = createPluginModule();
      pluginModule.command.aliases = ['overlap'];
      pluginModule.task.name = 'overlap';
      await bot.add(pluginModule.command);
      return expect(bot.add(pluginModule.task))
        .to.be.rejectedWith(Error);
    });

    it('should throw if plugin has same name and category', async function() {
      let bot = await createBot(defaultConfig);
      let pluginModule = createPluginModule();
      pluginModule.command.name = 'overlap';
      pluginModule.command.category = 'overlap';
      return expect(bot.add(pluginModule.command))
        .to.be.rejectedWith(Error);
    });

    it('should throw if plugin category overlaps name in different plugin', async function() {
      let bot = await createBot(defaultConfig);
      let pluginModule = createPluginModule();
      pluginModule.command.name = 'overlap';
      pluginModule.task.category = 'overlap';
      await bot.add(pluginModule.command);
      return expect(bot.add(pluginModule.task))
        .to.be.rejectedWith(Error);
    });

    it('should throw if plugin name overlaps category in different plugin', async function() {
      let bot = await createBot(defaultConfig);
      let pluginModule = createPluginModule();
      pluginModule.command.category = 'overlap';
      pluginModule.task.name = 'overlap';
      await bot.add(pluginModule.command);
      return expect(bot.add(pluginModule.task))
        .to.be.rejectedWith(Error);
    });

    it('should throw if plugin aliases overlaps category', async function() {
      let bot = await createBot(defaultConfig);
      let pluginModule = createPluginModule();
      pluginModule.command.category = 'overlap';
      pluginModule.task.aliases = ['overlap'];
      await bot.add(pluginModule.command);
      return expect(bot.add(pluginModule.task))
        .to.be.rejectedWith(Error);
    });

    it('should throw if plugin category overlaps aliases', async function() {
      let bot = await createBot(defaultConfig);
      let pluginModule = createPluginModule();
      pluginModule.command.aliases = ['overlap'];
      pluginModule.task.category = 'overlap';
      await bot.add(pluginModule.command);
      return expect(bot.add(pluginModule.task))
        .to.be.rejectedWith(Error);
    });
  });
});