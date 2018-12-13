const Command = require('./Command');
const Task = require('./Task');
const Plugin = require('./Plugin');
const Filter = require('./Filter');

const fs = require('fs');
const path = require('path');

/**
 * Finds and loads all the commands, tasks and their aliases.
 */
module.exports = class PluginManager {
  constructor(options) {
    options = options || {};
    if (!options.log) {
      throw new Error('Missing required argument: options.log');
    }
    if (!options.prefix) {
      throw new Error('Missing required argument: options.prefix');
    }
    if (!options.utils) {
      throw new Error('Missing required argument: options.utils');
    }
    this.log = options.log;
    this.prefix = options.prefix;
    this.utils = options.utils;
    this.database = options.database || null;

    /** Key: category name, Value: array of Plugin objects */
    this.categories = new Map();
    /** Key: plugin name, Value: Plugin object */
    this.plugins = new Map();
    /** Key: command name, Value: Command object */
    this.commands = new Map();
    /** Key: task name, Value: Task object */
    this.tasks = new Map();
    /** Key: alias name, Value: Command object */
    this.aliases = new Map();
    /** Key: hook name, Value: array of Filter objects */
    this.filters = new Map();

    /** Has init() been called */
    this.initialized = false;
  }

  async init(options) {
    await this.loadPluginModule(require('../coreplugins/basic'));
    await this.loadPluginModule(require('../coreplugins/command'));
    await this.loadPluginModule(require('../coreplugins/permission'));
    await this.loadPluginModule(require('../coreplugins/master'));
    this.initialized = true;
  }

  getCommand(cmdName) {
    let command = this.commands.get(cmdName);
    if (!command) {
      command = this.aliases.get(cmdName);
    }
    return command;
  }

  /**
   * @private
   * @param {object} pluginModule - module that contains multiple plugins
   */
  async loadPluginModule(pluginModule) {

    for (let i in pluginModule) {
      try {
        await this.loadPlugin(pluginModule[i]);
      } catch(err) {
        this.log.error('Plugin ' + pluginModule[i].name + ': ' + err.stack);
      }
    }
  }

  async loadPlugin(pluginDefinition) {
    if (!pluginDefinition.type) {
      throw new Error('Missing type.')
    }
    if (pluginDefinition.useDatabase && !this.database.initialized) {
      this.log.warn('Plugin ' + pluginDefinition.name + ' not loaded because'
          + ' database was not initialized.');
      return;
    }

    let args = {
      prefix: this.prefix,
      utils: this.utils,
      ...pluginDefinition
    }

    let plugin;
    let type = pluginDefinition.type;

    if (type === 'command') {
      await this.loadCommand(new Command(args));

    } else if (type === 'task') {
      await this.loadCommand(new Task(args));

    } else if (type === 'filter') {
      await this.loadFilter(new Filter(args));

    } else {
      throw new Error('Type "' + type + '" not supported.')
    }

  }

  /**
   * Checks that the plugin name does not clash with any other plugins or
   * category names.
   */
  pluginNameUnique(p) {
    return !(p.name === p.category
        || this.plugins.has(p.name)
        || this.categories.has(p.name));
  }

  async loadCommand(cmd) {
    if (!this.pluginNameUnique(cmd)) {
      throw new Error('Conflicting plugin name: ' + cmd.name);
    }

    // add to category map
    if (!this.categories.has(cmd.category)) {
      this.categories.set(cmd.category, [cmd.name]);
    } else {
      this.categories.get(cmd.category).push(cmd.name);
    }

    this.plugins.set(cmd.name, cmd);
    this.commands.set(cmd.name, cmd);

    // if the command is task then do something extra
    if (cmd.type === 'task') {
      this.tasks.set(cmd.name, cmd);
      // load the task subscriptions from the database
      await cmd.fetchSubscriptions(this.database);
    }
    this.loadAliases(cmd);
  }

  async loadFilter(f) {
    if (this.filters.has(f.hook)) {
      this.filters.get(f.hook).push(f);
    } else {
      this.filters.set(f.hook, [f]);
    }

    this.plugins.set(f.name, f);

  }

  /**
   * @private
   * @param {string} pluginDirectory - Path to directory that contains
   *    plugin module directories.
   */
  async loadPluginPackages(pluginDirectory) {
    var files = fs.readdirSync(pluginDirectory);

    let promises = [];
    for (let directoryName of files) {
      let directoryPath = path.join(pluginDirectory, directoryName);
      // don't care about files in plugins root
      if (!fs.statSync(directoryPath).isDirectory()) return;
      promises.push(this.loadPlugins(require(directoryPath)));
    }

    return Promise.all(promises);
  }

  /**
   * @private
   * @param {Command} cmd - Command object
   */
  loadAliases(cmd) {
    if (cmd.aliases) {

      for (let aliasName of cmd.aliases) {
        if (this.aliases.has(aliasName)) {
          throw new Error('Conflicting alias: ' + aliasName);
        }
        if (this.plugins.has(aliasName)) {
          throw new Error('Alias conflicting with command name: ' + aliasName);
        }
        this.aliases.set(aliasName, cmd);
      }
    }
  }
}