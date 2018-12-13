module.exports = (sequelize, DataTypes) => {
  return sequelize.define('taskSubscription', {
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    args: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });
};
