const Plugin = require('./Plugin');
/**
 * Class representing a command.
 * 
 * Every object that a plugin exports gets injected to the constructor of this
 * class.
 * 
 * @param {object} options - Options for a command.
 * @param {object} options.run - The function that will get called when the
 *    command gets executed. This command will get the original Message object
 *    and instance of salabot along with the given arguments (if any) injected to
 *    it. The signature of the function should be
 *    run(msg, bot, arg1, arg2, arg3...)
 * @param {array.<string>} [options.arguments] - Arguments that the command accepts.
 *    Each array element should contain an explanation of what the argument is for.
 * @param {boolean} [options.argumentsOptional=false] - Are the arguments required or
 *    optional? This will only have affect if options.arguments is set.
 * @param {string} [options.permission='role'] - <p>Possible options are "everyone",
 *    "admin", "master" or "role".</p>
 *    <p>If permission is "master", then only the mastor of the bot has permission to
 *    run the command.</p>
 *    <p>If permission is "admin", then only the users with administrative priviledges
 *    are allowed to run the command.</p>
 *    <p>If permission is "everyone", then everyone is allowed to execute the command.</p>
 *    <p>If permission is "role", then only roles that have the required permission flag
 *    are allowed to run the command.</p>
 * @param {boolean} [options.allowDM=false] - Is it possible to execute this
 *    command through a Direct Message?
 * @param {string} [options.aliases=null] - Alternative names for the command.
 * 
 */

module.exports = class Command extends Plugin {
  constructor(options) {

    super(options);
    options = options || {};

    // Required arguments

    if (!options.name) {
      throw new Error('Missing required argument: options.name');
    }
    if (!options.description) {
      throw new Error('Missing required argument: options.description');
    }
    if (!options.run) {
      throw new Error('Missing required argument: options.run');
    }
    this.name = options.name;
    this.description = options.description;
    this.run = options.run;

    // Optional arguments

    if (options.arguments) {
      if (options.arguments.length == 0) {
        throw new Error('Do not specify arguments if there are none');
      }
      this.argumentsOptional = options.argumentsOptional;
      this.arguments = options.arguments;
    }

    this.aliases = options.aliases || null;
    this.allowDM = options.allowDM || false;
    this.permission = options.permission || 'role';
    this.category = options.category || 'uncategorized';
  }

  /**
   * Returns a Promise that executes the commands run function.
   *
   * The function assumes that all the required parsing and permission
   * checking are done beforehand.
   */
  async execute(msg, bot, args) {
    let execTime = new Date().getTime();
    try {
      await this.run(msg, bot, ...args);
      return new Date().getTime() - execTime;
    } catch(err) {
      bot.log.error(err.stack);
      msg.reply('Uhhuh... You are screwed. I hope you have a screwdriver.');
      return null;
    }
  }

  async usage(msg) {
    let prefix = await this.prefix.get(msg.guild);
    let mcb = this.utils.format.mcb;
    let cb = this.utils.format.cb;
    let b = this.utils.format.b;

    let usage = ['Type: ' + cb(this.type)];
    usage.push('Name: ' + cb(prefix + this.name));
    if (this.aliases) {
      usage.push(
        "Aliases: " + cb(this.aliases.reduce((p, n) => prefix + n + ', '), '')
      );
    }
    usage.push('Description:\n' + cb(this.description));

    let argsUsage = prefix + this.name;
    if (this.arguments && this.arguments.length > 0) {
      argsUsage += this.arguments.reduce((p, n) => p + ' [' + n + '] ', '');
    }

    usage.push('Usage: ');
    if (this.arguments && this.argumentsOptional) {
      usage.push(cb(prefix + this.name));
      usage.push('OR (with arguments)');
    }
    usage.push(cb(argsUsage));

    return usage;
  }

}
