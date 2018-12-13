module.exports = {
  uptime: {
    type: 'command',
    name: 'uptime',
    category: 'core',
    description: "Tells you the uptime of the bot.",
    permission: 'everyone',
    run: uptime,
  },

  help: {
    type: 'command',
    name: 'help',
    category: 'core',
    description: "Displays you some helpful information.",
    aliases: ['info'],
    arguments: ["command you would like more help with"],
    argumentsOptional: true,
    permission: 'everyone',
    run: help,
  },

  invite: {
    type: 'command',
    name: 'invite',
    category: 'core',
    description: "Generates invite link.",
    permission: 'everyone',
    run: invite
  },

  sbprefix: {
    type: 'command',
    name: 'sbprefix',
    category: 'core',
    description: "Sets the prefix.",
    arguments: ["prefix"],
    permission: 'admin',
    run: sbprefix
  },
}

function uptime(msg) {

  let d = Math.floor(process.uptime() / 86400);
  let hrs = Math.floor((process.uptime() % 86400) / 3600);
  let min = Math.floor(((process.uptime() % 86400) % 3600) / 60);
  let sec = Math.floor(((process.uptime() % 86400) % 3600) % 60);

  let uptime;

  if (d === 0 && hrs !== 0) {
    uptime =  `${hrs} hrs, ${min} mins, ${sec} seconds`;
  } else if (d === 0 && hrs === 0 && min !== 0) {
    uptime =  `${min} mins, ${sec} seconds`;
  } else if (d === 0 && hrs === 0 && min === 0) {
    uptime =  `${sec} seconds`;
  } else {
    uptime =  `${d} days, ${hrs} hrs, ${min} mins, ${sec} seconds`;
  }
  return msg.reply('I have been suffering for ' + uptime);
}

async function help(msg, bot, cmdName) {
  const prefix = await bot.prefix.get(msg.guild);
  const mcb = bot.utils.format.mcb;
  let help;

  if (cmdName) {
    let command = bot.plugins.getCommand(cmdName);
    if (command) {
      help = await command.usage(msg);
    } else {
      return msg.channel.send("Invalid command");
    }
  } else {
    let helpText = prefix + "commands (or " + prefix + "com) - List command categories\n" + prefix + "commands [category] - List commands in given category\n" + prefix + "help [command] - Information about specific command";
    return msg.channel.send(mcb(helpText));
  }
  return msg.channel.send(help);
}

async function invite(msg, bot) {
  let link = await bot.client.generateInvite([
    'SEND_MESSAGES',
    'MENTION_EVERYONE'
  ]);
  return msg.reply('invite here: ' + link);
}

async function sbprefix(msg, bot, newPrefix) {
  if (newPrefix.length !== 1) {
    return msg.reply('Prefix cant be longer than one character.');
  }
  try {
    bot.prefix.set(msg.guild.id, newPrefix);
  } catch(err) {
    bot.log.error(err.stack);
    return msg.channel.send('Sorry, but I could not set the prefix.')
  }
  return msg.channel.send('Prefix set to "' + newPrefix + '"');
}
