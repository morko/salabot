module.exports = (sequelize, DataTypes) => {
  return sequelize.define('commandPermission', {
    command: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    roleId: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  });
};
