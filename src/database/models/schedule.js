const { Model, Op } = require('sequelize');
const { dateAsString, today } = require('Utils/date');

module.exports = (sequelize, DataTypes) => {
  class Schedule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  Schedule.init(
    {
      userId: DataTypes.INTEGER,
      institutionId: DataTypes.INTEGER,
      courseId: DataTypes.INTEGER,
      intakeId: DataTypes.INTEGER,
      closingDate: DataTypes.DATEONLY,
      nextOpenDate: DataTypes.DATEONLY,
      cancelledDate: DataTypes.DATEONLY,
    },
    {
      sequelize,
      modelName: 'Schedule',
      scopes: {
        // Scope where schedules are have not ended or cancelled
        notExpired: {
          where: {
            nextOpenDate: {
              [Op.or]: {
                [Op.is]: null,
                [Op.gt]: dateAsString(today()),
              },
            },
            cancelledDate: {
              [Op.is]: null,
            },
          },
        },
        // Scope where schedules are have not cancelled
        notCancelled: {
          where: {
            cancelledDate: {
              [Op.is]: null,
            },
          },
        },

        // Scope to filter out / remove course level schedules
        notCourseLevel: {
          where: {
            intakeId: {
              [Op.not]: null,
            },
          },
        },

        // Scope to filter out / remove intake level schedules
        notIntakeLevel: {
          where: {
            intakeId: {
              [Op.is]: null,
            },
          },
        },
      },
      // Use 'and' merge strategy so that multiple scopes do not overwrite each other
      // https://sequelize.org/docs/v6/other-topics/scopes/#merging
      whereMergeStrategy: 'and',
    }
  );
  return Schedule;
};
