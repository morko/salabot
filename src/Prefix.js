module.exports = class Prefix {
  constructor(options) {
    options = options || {};
    if (!options.config) {
      throw new Error('Missing required argument: options.config');
    }
    if (!options.log) {
      throw new Error('Missing required argument: options.log');
    }
    if (!options.client) {
      throw new Error('Missing required argument: options.client');
    }

    this.client = options.client;
    this.log = options.log;
    this.config = options.config;
    this.database = options.database || null;

    // map of guild id to prefix
    this._prefixes = new Map();
  }

  async get(guild) {
    if (!guild || !this.database) {
      return this.config.prefix;
    }

    // if in memory then return from there
    if (this._prefixes.has(guild.id)) {
      return this._prefixes.get(guild.id);
    }

    // otherwise fetch prefix from database and save to memory
    let guildFromDB;
    try {
      guildFromDB = await this.database.models.Guild.findOne({
        where: { id: guild.id }
      });
    } catch(err) {
      this.log.error(err.stack);
      return this.config.prefix;
    }
    guildFromDB.prefix = guildFromDB.prefix || this.config.prefix;
    this._prefixes.set(guild.id, guildFromDB.prefix);
    return guildFromDB.prefix;
  }

  async set(guildId, newPrefix) {
    if (!guildId) {
      throw new Error('Missing required argument: guildId');
    }
    if (!newPrefix) {
      throw new Error('Missing required argument: newPrefix');
    }
    if (!this.database) {
      throw new Error('Database is not running?');
    }

    await this.database.models.Guild.update({
      prefix: newPrefix
    }, {
      where: { id: guildId }
    });
    await this.client.user.setPresence({
      status: 'online',
      game: {
        name: newPrefix + 'help'
      }
    });

    this._prefixes.set(guildId, newPrefix);
  }

  async init() {
    if (!this.database) return;
    let guilds = await this.database.models.Guild.findAll();
    for (let guild of guilds) {
      this.set(guild.id, guild.prefix || this.config.prefix);
    }
  }
}