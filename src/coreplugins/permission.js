module.exports = {
  allow: {
    type: 'command',
    name: 'allow',
    category: 'security',
    description: 'Adds role a permission to run some'
        + ' command/category of commands.',
    arguments: ["role", "command/category"],
    useDatabase: true,
    run: allow
  },

  deny: {
    type: 'command',
    name: 'deny',
    category: 'security',
    description: 'Removes role a permission to run some'
        + ' command/category of commands.',
    arguments: ["role", "command/category"],
    useDatabase: true,
    run: deny
  },

  permission: {
    type: 'command',
    name: 'permissions',
    category: 'security',
    description: 'Lists all existing permissions for a guild.',
    useDatabase: true,
    run: permissions
  }
}

async function allow(msg, bot, roleName, cmdOrCategoryName) {
  const aliases = bot.plugins.taskAliases;
  const b = bot.utils.format.b;

  let role = msg.guild.roles.find((role) => {
    return role.name === roleName;
  });

  if (!role) {
    return msg.reply('Role ' + b(roleName) + ' not found.');
  }

  let pm = bot.permissions;

  // if its a command
  if (bot.plugins.commands.has(cmdOrCategoryName)) {
    let permission = await pm.setPermission(
        cmdOrCategoryName, msg.guild, role);
    return msg.channel.send('Permissions for command ' + b(cmdOrCategoryName)
        + ' added for role ' + b(roleName));

  // if its a category
  } else if (bot.plugins.categories.has(cmdOrCategoryName)) {
    let category = bot.plugins.categories.get(cmdOrCategoryName);

    for (let commandName of category) {
      await pm.setPermission(commandName, msg.guild, role);
    }
    return msg.channel.send('Permissions for category ' + b(cmdOrCategoryName)
        + ' added for role ' + b(roleName));

  // if its not command or category
  } else {
    return msg.channel.send('Category/command ' + b(cmdOrCategoryName) + ' not found.');
  }

}

async function deny(msg, bot, roleName, cmdOrCategoryName) {
  const aliases = bot.plugins.taskAliases;
  const b = bot.utils.format.b;

  let role = msg.guild.roles.find((role) => {
    return role.name === roleName;
  });
  if (!role) {
    return msg.channel.send('Role ' + b(roleName) + ' not found.');
  }

  let pm = bot.permissions;

  // if its a command
  if (bot.plugins.commands.has(cmdOrCategoryName)) {
    let permission = await pm.removePermission(
      cmdOrCategoryName, msg.guild, role
    );
    return msg.channel.send('Permissions for command ' + b(cmdOrCategoryName)
        + ' removed from role ' + b(roleName));

  // if its a category
  } else if (bot.plugins.categories.has(cmdOrCategoryName)) {
    let category = bot.plugins.categories.get(cmdOrCategoryName);

    for (let commandName of category) {
      await pm.removePermission(commandName, msg.guild, role);
    } 
    return msg.channel.send('Permissions for category ' + b(cmdOrCategoryName)
        + ' removed from role ' + b(roleName));

  // if no command or category was found
  } else {
    return msg.channel.send('Category/command ' + b(cmdOrCategoryName) + ' not found.');
  }

}

async function permissions(msg, bot) {
  let pm = bot.permissions;
  let permissions = await pm.getPermissions(msg.guild.id);
  let mcb = bot.utils.format.mcb;
  let b = bot.utils.format.b;
  let title = 'Currently set permissions:'

  let roleMap = new Map();
  for (let perm of permissions) {
    let role = bot.client.guilds.get(perm.guildId).roles.get(perm.roleId);
    if (!roleMap.has(role.name)) {
      roleMap.set(role.name, [perm]);
    } else {
      roleMap.get(role.name).push(perm);
    }
  }

  let text = '';
  for (let [roleName, perms] of roleMap) {
    text += 'Role ' + b(roleName) + '\n';
    let permsText = ''
    for (let perm of perms) {
      permsText += perm.command + '\n';
    }
    text += mcb(permsText);
  }
   
  if (!text) text = 'No permission flags set.'
  msg.channel.send(text);
}