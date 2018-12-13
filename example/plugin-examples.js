module.exports = {

  filterExample: {
    type: 'filter',
    hook: 'preParse',
    run: (msg, bot) => {
      if (bot.client.user !== msg.author && msg.content.includes('pizza')) {
        return msg.channel.send('Mmm... Did someone say pizza?');
      }
    }
  },
  commandExample: {
    type: 'command',
    category: 'pizza',
    name: 'food',
    aliases: ['f', 'foo'],
    arguments: ['food you want information about'],
    argumentsOptional: false,
    description: 'Tells you information about given food.',
    allowDM: true,
    permission: 'everyone',
    run: food

  },
  taskExample: {
    type: 'task',
    category: 'pizza',
    name: 'pizzatask',
    aliases: ['pt'],
    description: 'Spams that you should eat pizza every 5 seconds.',
    permission: 'role',
    cron: '*/5 * * * * *',
    runWhenStarted: true,
    run: bot => 'Eat pizza!'
  }
}

async function food(msg, bot, food) {
  return msg.channel.send(`I know nothing about ${food}, but I recommend you eat pizza.`);
}