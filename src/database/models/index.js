module.exports = {
  load
}

function load(sequelize) {
  let models = {
    CommandPermission: sequelize.import('./CommandPermission'),
    Guild: sequelize.import('./Guild'),
    TaskSubscription: sequelize.import('./TaskSubscription'),
    User: sequelize.import('./User')
  }

  models.Guild.hasMany(models.TaskSubscription, {
    as: 'Tasks',
    onDelete: 'CASCADE'
  });

  models.Guild.hasMany(models.CommandPermission, {
    foreignKey: {
      allowNull: false
    },
    onDelete: 'CASCADE',
    as: 'Permissions'
  });

  models.Guild.belongsToMany(models.User, {through: 'UserGuild'});
  models.User.belongsToMany(models.Guild, {through: 'UserGuild'});

  return models;
}


