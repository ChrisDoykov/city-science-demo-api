export default (sequelize, Sequelize) => {
  const Record = sequelize.define("record", {
    key: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    data: {
      type: Sequelize.STRING,
    },
  });
  return Record;
};
