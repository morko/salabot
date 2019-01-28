const logger = require('./logging');
const Database = require('./database').Database;
const createUtils = require('./utils');
const PluginManager = require('./plugin/PluginManager');
const MessageParser = require('./MessageParser');
const PermissionManager = require('./PermissionManager');
const Prefix = require('./Prefix');
const Discord = require('discord.js');

module.exports = class Bot {
  constructor(config) {
    this.config = this._parseConfig(config);
    /** Winston logger. */
    this.log = logger;
    /** Discord.js Client  */
    this.client = new Discord.Client();
    /** Database object. */ 
    this.database = null;
    /** Object containing miscancelous utilities. Created in bot.init(). */ 
    this.utils = null;
    /** Plugin loader/manager. Created in bot.init(). */
    this.plugins = null;
    /** Manager for command permissions. Created in bot.init() */
    this.permissions = null;
    /** Utility object to manage command prefixes. Created in bot.init() */
    this.prefix = null;
    /** Tells if init() has been run? */
    this.initialized = false;
  }

  /**
   * Connects the bot to discord.
   */
  async start(token) {
    if (!this.initialized) {
      throw new Error('You must call init() before starting the bot!');
    }
 
    return new Promise((resolve, reject) => {
      this.client.on('ready', async () => {
        try {
          // ensure that the database matches reality
          if (this.database) {
            await this.database.ensureIntegrity();
          }
 
          // start all tasks
          let p = [];
          for (let task of this.plugins.tasks.values()) {
            p.push(task.start(this));
          }
          await Promise.all(p);
 
          // sets the presence status for each guild with right prefix
          await this.prefix.init();
 
          this.log.info('Connected as: ' + this.client.user.tag);
          return resolve(token);
 
        } catch(err) {
          this.log.error('onReady failed: ' + err.stack);
          return reject(err);
        }
      });
 
      this.client.login(token).catch(err => {
        this.log.error('Starting the bot failed: ' + err.stack);
        return reject(err);
      });
    });
  }

  /**
   * Adds a plugin to the bot.
   */
  async add(plugin) {
    if (!this.initialized) {
      throw new Error('You must call init() before adding plugins!');
    }
    try {
      await this.plugins.loadPlugin(plugin);
    } catch(err) {
      this.log.error('Could not load plugin: ' + err.stack);
      throw err;
    }
  }
  /**
   * Adds a plugin module to the bot.
   */
  async addModule(plugin) {
    if (!this.initialized) {
      throw new Error('You must call init() before adding plugins!');
    }
    try {
      await this.plugins.loadPluginModule(plugin);
    } catch(err) {
      this.log.error('Could not load plugin module: ' + err.stack);
      throw err;
    }
  }
  /**
   * Initializes the asynchronous parts of the bot instance.
   */
  async init() {
    this.log.verbose('Initializing the bot...');

    try {
      // initialize the database 
      this.database = new Database({
        log: this.log,
        client: this.client,
        ...this.config.database
      });
      await this.database.init();
    } catch(err) {
      this.log.error('Database not initialized. ' + err.stack);
      process.exit(1);
    }

    try {
      // register listeners
      this._registerListeners();
      // create the prefix manager
      this.prefix = new Prefix({
        log: this.log,
        database: this.database,
        config: this.config,
        client: this.client
      });
      // create the utils
      this.utils = createUtils({ prefix: this.prefix });
      // create the permission manager
      this.permissions = new PermissionManager({
        database: this.database,
        config: this.config
      });
      // load all the plugins
      this.plugins = new PluginManager({
        log: this.log,
        prefix: this.prefix,
        utils: this.utils,
        database: this.database
      })
      await this.plugins.init(this.utils);

      this.initialized = true;
    } catch(err) {
      this.log.error('Bot initialization failed: ' + err.stack);
      throw err;
    }
  }

  /**
   * Checks the Bot config for missing arguments and fills in the default
   * arguments for optional arguments.
   * 
   * @private
   * @param {object} conf - options for Bot constructor
   */
  _parseConfig(conf) {
    if (!conf.master) {
      throw new Error('Missing required argument: config.master');
    }

    if (conf.database) {
      conf.database.dialect = conf.database.dialect || 'sqlite';
      if (conf.database.dialect === 'sqlite' && !conf.database.storage) {
        throw new Error('Missing required argument: config.database.storage');
      }
      conf.database.username = conf.database.username || 'username';
      conf.database.password = conf.database.password || 'password';
      conf.database.database = conf.database.database || 'database';
    }

    conf.prefix = conf.prefix || '.';
    return conf;
  }

  /**
   * Registers listeners that handle the discord.js Client events.
   * @private
   */
  _registerListeners() {
    this.log.verbose('Registering the event handlers.');

    this.client.on('guildCreate', this._onGuildCreate.bind(this));
    this.client.on('guildDelete', this._onGuildDelete.bind(this));
    this.client.on('message', this._onMessage.bind(this));
  }
  /**
   * Handles guild creation in database when the bot gets invited to a guild.
   * @private
   * @param {Guild} guild discord.js Guild
   */
  async _onGuildCreate(guild) {
    if (!this.database) return;
    this.log.verbose('Bot joined a guild. Adding it to the database.');
    let Guild = this.database.models.Guild;
    return Guild.findOrCreate({
      where: {
        id: guild.id,
        name: guild.name
      }
    });
  }
  /**
   * Handles guild deletion from database when bot leaves a guild.
   * @param {Guild} guild discord.js Guild
   */
  async _onGuildDelete(guild) {
    if (!this.database) return;
    this.log.verbose('Guild was deleted. Removing it from database.');
    let Guild = this.database.models.Guild;
    return Guild.destroy({
      where: {
        id: guild.id
      }
    });
  }

  async _runHook(hookName, msg) {
    if (this.plugins.filters.has(hookName)) {
      let result;
      for (let filter of this.plugins.filters.get(hookName)) {
        try {
          result = await filter.run(msg, this);
          if (result === false) return false;
        } catch(err) {
          this.log.error(err.stack)
        }
      }
    }
    return true;
  }

  /**
   * Handles parsing, validation and execution of Message.
   * @param {Message} msg discord.js Message
   */
  async _onMessage(msg) {
    this._runHook('preParse', msg);

    // parse the message
    let parser;
    let command;
    let hasPermissions;

    try {
      parser = new MessageParser(msg, this.prefix, this.plugins);
      let forBot = await parser.isMentForBot(this);
      if (!forBot || !parser.botHasPermissionToReply(this)) return;
      // search for the command
      command = parser.getCommand();
      if (!command) return;
      // check that the msg author has permissions to run the command
      hasPermissions = await this.permissions.checkPermissions(msg, command);
      if (!hasPermissions) return;
    } catch(err) {
      this.log.error(err.stack);
      msg.reply('Keyboard not responding. Press any key to continue.');
      return;
    }

    // get the command arguments from the parsed Message
    let args;
    try {
      args = parser.getArguments(command);
    } catch(err) {
      return msg.reply('Ehh uhh... ' + err.message);
    }

    // execute the command
    try {
      let executionTime = await command.execute(msg, this, args);
      if (executionTime) {
        this.log.verbose('Command ' + command.name + ' executed in '
            + executionTime + 'ms');
      }
    } catch(err) {
      this.log.error('Execution error: ' + command.name + ': ' + err.stack);
    }

  }
}