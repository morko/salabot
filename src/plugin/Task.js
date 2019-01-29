const Command = require('./Command');
const cron = require('node-cron');

module.exports = class Task extends Command {
  constructor(options) {
    super(options);

    options = options || {};
    if (!options.cron) {
      throw new Error(
        'Plugin ' + options.name + 
        ' missing required argument: options.cron'
      );
    }
    if (!cron.validate(options.cron)) {
      throw new Error(
        'Plugin ' + options.name +
        ' has invalid cron syntax: '+ options.cron
      );
    }
    this.cron = options.cron;
    this.args = ['start|stop'];
    this.allowDM = false;

    this._subscriptions = new Map();
    this._cronJob = null;
  }

  /**
   * Overrides the Command execute method to be able to start and stop tasks.
   * 
   * @param {Message} msg - discord.js Message
   * @param {object} args - Arguments for the task.
   */
  async execute(msg, bot, args) {
    let execTime = new Date().getTime();
    try {
      if (args[0] === 'start') {
        await this._addSubscription(bot, msg.guild.id, msg.channel.id, args.slice(1));
      } else if (args[0] === 'stop') {
        await this._removeSubscription(msg.guild.id);
      }
      return new Date().getTime() - execTime;
    } catch(err) {
      bot.log.error(err.stack);
      msg.reply('There is a problem with your internet connection, please search our website for solution.');
      return null;
    }
  }

  /**
   * Starts running the task if the task has subscribers.
   * @returns {Promise} - Was the task started or not?
   */
  async start(bot) {
    if (this._subscriptions.size === 0) {
      return false;
    }
    return await this._startCronJob(bot);
  }

  async isStarted() {
    return this._cronJob ? true : false;
  }

  async _addSubscription(bot, guildId, channelId, args) {
    if (this._subscriptions.has(guildId)) return;

    // TODO: what if no database?
    let TaskSubscription = bot.database.models.TaskSubscription;
    let subscription = TaskSubscription.build({
        name: this.name,
        guildId: guildId,
        channelId: channelId,
        args: args ? JSON.stringify(args) : null
    });
    await subscription.save();
    this._subscriptions.set(guildId, subscription);

    if (!this._cronJob) this.start(bot);
  }

  async _removeSubscription(guildId) {
    if (!this._subscriptions.has(guildId)) return;
    // TODO: what if no database?
    let subscription = this._subscriptions.get(guildId);
    this._subscriptions.delete(guildId);
    await subscription.destroy()

    if (this._subscriptions.size === 0) {
      this._stopCronJob();
    }
  }

  async _startCronJob(bot) {
    if (this._subscriptions.size === 0) {
      return false;
    }
    if (this._cronJob) {
      return true;
    }
    this._cronJob = cron.schedule(this.cron, () => this._execTask(bot));
    return true;
  }

  async _stopCronJob() {
    this._cronJob.stop();
    this._cronJob = null;
  }
  /**
   * This is the method that the cron job calls periodically.
   */
  async _execTask(bot) {
    if (this._subscriptions.size === 0) {
      this._stopCronJob();
    }
    bot.log.verbose('Executing task: ' + this.name);
    let result = await this.run(bot);
    await this._onExecTaskComplete(result, bot);
  }

  async _onExecTaskComplete(result, bot) {

    let channels = bot.client.channels;

    for (let [guildId, subscription] of this._subscriptions) {

      let channel = channels.get(subscription.channelId);
      if (!channel) {
        this._removeSubscription(guildId);
        continue;
      }
      try {
        await channel.send(result);
      } catch(err) {
        bot.log.error('Failed to send task results (' + this.name + ') for guild ' + guildId + ': ' + err.stack);
        this._removeSubscription(guildId);
      }
    }
  }

  isStarted(msg) {
    return this._subscriptions.has(msg.guild.id);
  }

  /**
   * Loads the subscriptions for this task from the database.
   */
  async fetchSubscriptions(database) {
    if (!database) {
      throw new Error('Missing required argument: database');
    }
    let TaskSubscription = database.models.TaskSubscription;
    let subscriptions = await TaskSubscription.findAll({
      where: {
        name: this.name
      }
    });
    for (let subscription of subscriptions) {
      if (subscription.args) {
        subscription.args = JSON.parse(subscription.args);
      }
      this._subscriptions.set(subscription.guildId, subscription);
    }
    return subscriptions;
  }
};
