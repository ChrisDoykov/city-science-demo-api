export default (sequelize, Sequelize) => {
  const Record = sequelize.define("record", {
    key: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    url: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });
  return Record;
};
