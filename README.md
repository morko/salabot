# Salabot

**Note that project is still in beta stage and this documentation is not
complete**

## Description

Salabot is a discord bot framework.

With salabot you can easily create your own bot for your needs or just install
ready made plugins. Out of the box salabot supports 3 different kind of plugins
(filters, commands and tasks) and a command permission system that can be
configured in the plugin descriptions and in discord.

Salabot uses the popular [discord.js](https://discord.js.org) Discord library
for node.js as the main driver for communicating with the Discord API.

## Features

* Extensible plugin system
  * Commands, tasks and filters (see Plugin System)
* Role or command based permission system
* Guild specific prefixes for commands
* Database integration for saving permissions and prefixes

## Installation

```
npm install https://github.com/morko/salabot
npm install sqlite3
```

If you want to install additional plugins, check out these repositories:
* https://github.com/morko/salabot-cleverbot

## Quick start

Minimal setup for running the bot. It is highly recommended to further
customize the configuration.

**Replace "Your Discord ID" and "Your Discord bot token"**

```js
const Salabot = require('salabot');
let bot = new Salabot({master: "Your Discord ID"});
bot.init().then(() => bot.start("Your Discord bot token"));
```

## Configuring

Salabot requires a config object as parameter when created. This is an example
of a config with explanations.

```js
let config = {
  // Id of the master of the bot. Master can run every command.
  master: 'Your Discord ID',
  // Global default prefix for executing the commands.
  // Prefix length can be max 1 character.
  prefix: '.',
  // Configuration for database.
  database: {
    // Username for the database.
    username: 'username',
    // Password for the user.
    password: 'password',
    // Database to connect to.
    database: 'database',
    // Database engine to use. Only sqlite is possible at the moment.
    provider: 'sqlite',
    // If provider is "sqlite", this is the path to sqlite database file.
    // If the storage option is omitted, then memory is used and data
    // does not persist if process is restarted.
    storage: '/path/to/where/you/want/the/database.sqlite'
  }
}
```

### Plugin system

Salabots plugin system supports different types of plugins that help you to
implement your own commands and functionality for the bot.

#### Commands

Explanation coming later...

#### Tasks

Explanation coming later...

#### Filters

Explanation coming later...