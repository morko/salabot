const parse = require('yargs-parser');

class MessageParser {
  constructor(msg, prefix, plugins) {
    this.msg = msg;
    this.prefix = prefix;
    this.plugins = plugins;
    this.tokens = this.toTokens(msg);
    this.arguments = null;
  }
  /**
   * Removes the prefix and chops message into tokens.
   */
  toTokens(msg) {
    // remove the prefix
    let tokensString = msg.content.slice(1).trim();
    // parse the tokens into an array
    let tokens = parse(tokensString)['_'];
    return tokens;
  }
  /**
   * Checks if the given Message is something that the bot should react to.
   * @param {Bot} bot instance of salabot
   * @returns {Promise<boolean>} is the message ment for bot
   */
  async isMentForBot(bot) {
    let prefix = await this.prefix.get(this.msg.guild);

    return (
      this.msg.author.id !== bot.client.user.id
      && !this.msg.author.bot
      && this.msg.content.charAt(0) === prefix
    );
  }

  /**
   * Checks that bot has required permissions to reply to the message.
   * @param {Bot} bot instance of salabot
   */
  botHasPermissionToReply(bot) {
    // if its not sent from guild channel then presume we have permissions
    if (!this.msg.guild) return true;
    // if in guild channel then check the permission flag
    let channelPermissions = this.msg.channel.permissionsFor(bot.client.user);
    if (!channelPermissions.has('SEND_MESSAGES')) return false;
    return true;
  }

  getCommand() {
    return this.plugins.getCommand(this.getCommandName());
  }
  getCommandName() {
    return this.tokens[0];
  }

  getArguments(command) {

    if (!this.arguments) {
      // remove the first element from tokens because its the command name
      this.arguments = this.tokens.slice(1);

      // if command accepts only 1 argument, separation with quotes is not needed
      // therefore we can bundle the arguments together that get separated by the
      // parser function (if there are any arguments in the first place)
      if (
        command.arguments
        && command.arguments.length === 1
        && this.arguments.length !== 0
      ) {
        this.arguments = [this.arguments.join(' ')];
      }
    }

    // check that the argument count matches
    if (!command.argumentsOptional && command.arguments) {
      if (this.arguments.length > command.arguments.length) {
        throw new Error('Too many arguments for the command!');
      } else if (this.arguments.length < command.arguments.length) {
        throw new Error('Too few arguments for the command!');
      }
    }
    return this.arguments;
  }
}
module.exports = MessageParser;