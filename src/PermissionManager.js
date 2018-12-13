
class PermissionManager {
  constructor(options) {
    options = options || {};
    if (!options.config) {
      throw new Error('Missing required argument: options.config');
    }
    this.config = options.config;
    this.database = options.database || null;
  }
  /**
   * Checks that author of msg has permission to run the command.
   * 
   * @returns {boolean} true if author has permission to run the command
   */
  async checkPermissions(msg, command) {
    // master of the bot is allowed to do anything
    if (msg.author.id === this.config.master) return true;

    // if message is direct message and command doesnt allow that
    if (!msg.guild && !command.allowDM) return false;
    
    // if the command is allowed for everyone
    if (command.permission === 'everyone') return true; 

    // if the command is ment for only the bot master then stop
    if (command.permission === 'master') return false; 

    // if member is an administrator in the guild
    if (msg.member.hasPermission('ADMINISTRATOR')) return true;

    // if command is ment for only guild admins then stop
    if (command.permission === 'admin') return false;

    // if nothing else matched, then we do the role based check
    if (!this.database) return true;
    let hasRequiredRole = await this.checkRoleBasedPermissions(msg, command.name);
    return hasRequiredRole;
  }

  /**
   * Checks that the author of the message has the required
   * role to be able to use the command in the guild.
   * 
   * @param {Message} msg - discord.js Message object
   * @param {Command} command - Command object
   * @returns {boolean} true if had permission
   */
  async checkRoleBasedPermissions(msg, commandName) {
    if (!this.database) throw new Error('Database is not running?')
    // stop if its a DM
    if (!msg.member) return false;

    let models = this.database.models;
    let permissions = await models.CommandPermission.findAll({
      where: {
        guildId: msg.guild.id,
        command: commandName
      }
    });

    for (let perm of permissions) {
      if (msg.member.roles.has(perm.roleId)) return true;
    }
    return false;
  }

  async setPermission(commandName, guild, role) {
    if (!this.database) throw new Error('Database is not running?')
    let models = this.database.models;
    let permission = await models.CommandPermission.findOrCreate({
      where: {
        roleId: role.id,
        guildId: guild.id,
        command: commandName
      },
    });
    return permission[0];
  }

  async removePermission(commandName, guild, role) {
    if (!this.database) throw new Error('Database is not running?')
    let models = this.database.models;
    let permission = await models.CommandPermission.findOne({
      where: {
        roleId: role.id,
        guildId: guild.id,
        command: commandName
      }
    });

    if (!permission) return false;
    return await permission.destroy();
  }

  async getPermissions(guildId) {
    if (!this.database) throw new Error('Database is not running?')
    let CommandPermission = this.database.models.CommandPermission;
    let permissions = await CommandPermission.findAll({
      where: {
        guildId: guildId
      }
    });
    return permissions;
  }
}
module.exports = PermissionManager;