module.exports = (sequelize, DataTypes) => {
  return sequelize.define('guild', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    prefix: {
      type: DataTypes.STRING(1)
    },
    motd: DataTypes.TEXT
  });
};
