module.exports = {
  commands: {
    type: 'command',
    name: 'commands',
    category: 'core',
    description: "Shows you list of commands arranged in categories.",
    aliases: ['com'],
    arguments: ["category of commands"],
    argumentsOptional: true,
    permission: 'everyone',
    run: commands
  },

  tasks: {
    type: 'command',
    name: 'tasks',
    category: 'core',
    description: 'Shows you list of all available tasks and if they' 
        + ' are running or not.',
    permission: 'everyone',
    run: tasks
  },
}

async function getCommandsInCategory(categoryName, bot, msg) {
  let category = bot.plugins.categories.get(categoryName);
  let pm = bot.permissions;
  let commands = [];
  for (let cmdName of category) {
    let cmd = bot.plugins.getCommand(cmdName);
    // only add commands that the users have permissions to run
    let hasPermission = await pm.checkPermissions(msg, cmd);
    if (!hasPermission) continue; 
    commands.push(cmd);
  }
  return commands;
}

async function commands(msg, bot, categoryName) {
  const categories = bot.plugins.categories;
  const prefix = await bot.prefix.get(msg.guild);

  let mcb = bot.utils.format.mcb;
  let b = bot.utils.format.b;

  // if user wanted commands in some category
  if (categoryName) {

    if (!categories.has(categoryName)) {
      return msg.reply('Invalid category!')
    }

    let title = 'Commands in category ' + b(categoryName) + '\n' + b(prefix + 'help [command]') + ' for more info.';

    let text = '';
    let commands = await getCommandsInCategory(categoryName, bot, msg);
    for (let cmd of commands) {

      let aliases = ' ';
      if (cmd.aliases) {
        aliases += '(';
        aliases += cmd.aliases.map(alias => prefix + alias).join(', ');
        aliases += ')';
      }
      text += '\n' + prefix + cmd.name + aliases + ' - ' + cmd.description;
    }
    return msg.channel.send(title + mcb(text));
  }

  // if user wanted help for all the commands
  let title = 'Type one of following to see commands in that category.';

  let text = '';
  for (let [categoryName, commandNames] of categories) {
    let commands = await getCommandsInCategory(categoryName, bot, msg);
    if (!commands || commands.length < 1) continue;

    text += `\n${prefix}com ${categoryName}`;
  }
  return msg.channel.send(title + mcb(text));
}

async function tasks(msg, bot) {
  const tasks = bot.plugins.tasks;
  const permissions = bot.permissions;
  let prefix = await bot.prefix.get(msg.guild);
  let b = bot.utils.format.b;
  let mcb = bot.utils.format.mcb;

  let title = b(prefix + 'help [task]') + ' for more info.';

  let text = '';
  for (let t of tasks.values()) {
    // only add tasks that the users have permissions to run
    let hasPermission = await permissions.checkPermissions(msg, t);
    if (!hasPermission) continue; 
    text += "\n" + t.name + (t.isStarted(msg) ? " - (started)" : "");
  }
  if (text === '') text += 'There are no runnable task plugins.'
  return msg.channel.send(title + mcb(text));
}