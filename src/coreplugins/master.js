module.exports = {
  guilds: {
    type: 'command',
    name: 'guilds',
    category: 'master',
    description: "Lists all the guilds the bot is connected to.",
    allowDM: true,
    permission: 'master',
    run: guilds
  },
  broadcastmsg: {
    type: 'command',
    name: 'broadcastmsg',
    aliases: ['bmsg'],
    arguments: ['msg to broadcast'],
    category: 'master',
    description: "Broadcast a message to system channel of all the guilds bot has joined.",
    allowDM: true,
    permission: 'master',
    run: broadcastMsg
  }
}

async function guilds(msg, bot) {
  let mcb = bot.utils.format.mcb;
  let title = 'I am currently in following guilds.'
  let text = '';
  for (let guild of bot.client.guilds.array()) {
    text += guild.name + ' - members: ' + guild.memberCount 
        + ' - region: ' + guild.region + '\n';
  }
  return msg.reply(title + mcb(text));
}


async function broadcastMsg(msg, bot, bmsg) {

  let b = bot.utils.format.b;
  let guilds = bot.client.guilds;
  for (let g of guilds.values()) {
    bot.log.info(g)
    g.systemChannel.send(bmsg)
  }
  return msg.reply('Broadcasting message: ' + b(bmsg));
}