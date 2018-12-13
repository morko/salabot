const path = require('path');
const os = require('os');
const modelLoader = require('./models').load;

const Sequelize = require('sequelize');

/**
 * Factory function to create a database object.
 * 
 * @param {object} options
 */
module.exports = class Database {
  constructor(options) {

    options = options || {};
    if (!options.log) {
      throw new Error('Missing required argument: options.log');
    }
    if (!options.client) {
      throw new Error('Missing required argument: options.client');
    }
    this.log = options.log;
    this.client = options.client;

    this.dbOpt = {};
    this.dbOpt.dialect = options.dialect || 'sqlite';
    this.dbOpt.storage = options.storage || ':memory:';
    this.dbOpt.database = options.database || 'database';
    this.dbOpt.username = options.username || 'username';
    this.dbOpt.password = options.password || 'password';


    options.operatorsAliases = false;

    this.sequelize = new Sequelize(
      this.dbOpt.database, this.dbOpt.username, this.dbOpt.password, {
        dialect: this.dbOpt.dialect,
        storage: this.dbOpt.storage,
        logging: (msg) => this.log.debug(msg),
        operatorsAliases: false
    });

    this.models = modelLoader(this.sequelize);
    this.initialized = false;
  }

  /**
   * Synchronizes the database tables.
   */
  async init() {
    try {
      let sync = await this.sequelize.sync();
      this.initialized = true;
      return sync;
    } catch(err) {
      this.log.error(err);
      throw err;
    }
  }

  /**
   * Executes a raw SQL query. Must be called after
   * {@link module:database.connect}.
   * @param {string} query SQL query filled with ? variable placeholders
   * @param {Array} values values that get filled in the ? characters in query
   * @returns {Promise<Array>} result of the query
   */
  async query(query, values) {
    if (!this.initialized) {
      return Promise.reject(new Error(
        'Database is not initialized. Call init() first.'
      ));
    }
    return this.sequelize.query(query, {
      replacements: values,
      type: this.sequelize.QueryTypes.SELECT
    });
  }
  /**
   * Ensures databases integrity by pulling information from discord API
   * and comparing that to entries in database and vice versa.
   */
  async ensureIntegrity() {
    await this.synchronizeGuilds();
  }

  /**
   * Synchronizes guilds in database with the client.
   */
  async synchronizeGuilds() {
    await this.createMissingEntries();
    await this.removeGhostEntries();
  }

  /**
   * Creates all missing entries in database.
   * @returns {Promise} result
   */
  async createMissingEntries() {
    let guilds = this.client.guilds.array();
    // use promise.all when not using sqlite?
    for (let guild of guilds) {
      await this.models.Guild.findOrCreate({
        where: {
          id: guild.id,
          name: guild.name
        }
      });
    }
    return guilds;
  }
  /**
   * Removes entries that the client dont know about anymore.
   * @returns {Promise} result
   */
  async removeGhostEntries() {
    let guilds = await this.models.Guild.findAll();
    for (let guild of guilds) {

      if (!this.client.guilds.has(guild.id)) {
        await guild.destroy();
        continue;
      }

      let permissionsToDestroy = [];
      // check that the roles of permissions exist
      let permissions = await guild.getPermissions();
      for (let permission of permissions) {
        if (!this.client.guilds.get(guild.id).roles.has(permission.roleId)) {
          permissionsToDestroy.push(permission.id);
        }
      }

      if (permissionsToDestroy < 1) continue;

      let queryInterface = this.sequelize.getQueryInterface();
      await queryInterface.bulkDelete('CommandPermissions', {
        where: {
          id: {
            [Sequelize.Op.or]: permissionsToDestroy
          }
        }
      });
    }
  }
}