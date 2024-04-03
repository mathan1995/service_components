const { Schedule } = require('Database/models');
const { dateAsString, today } = require('Utils/date');
const { Op } = require('sequelize');

class ScheduleRepository {
  constructor({ scope = [] } = {}) {
    this.schedule = Schedule.scope(scope);
  }

  /**
   * Create a new schedule in database.
   *
   * @param {Object} payload - The payload for control schedule.
   * @returns {Schedule}
   */
  async create(payload) {
    return this.schedule.create(payload);
  }

  /**
   * Show Course Schedules by Course ID
   *
   * @param {*} id
   * @param {*} paginate
   * @param {*} sort
   * @returns {Schedule}
   */
  async findAllByCourseId(id, paginate = [], sort = []) {
    const params = {
      where: {
        courseId: id,
      },
    };

    const offset = paginate?.offset ?? 0;
    const limit = paginate?.limit ?? 0;

    if (offset > 0) params.offset = offset;
    if (limit > 0) params.limit = limit;

    if (sort && sort.fieldName) {
      params.order = [[sort.fieldName, sort.order]];
    }

    const data = await this.schedule.findAll(params);

    const total = await this.schedule.count({
      where: params.where,
    });

    return {
      data,
      offset,
      limit,
      total,
    };
  }

  getOverlapsByCourseId(id, closingDate, nextOpenDate) {
    const params = {
      where: {
        courseId: id,
        cancelledDate: null,
        intakeId: null,
        [Op.and]: [
          {
            closingDate: {
              [Op.lt]: nextOpenDate,
            },
          },
          {
            nextOpenDate: {
              [Op.gt]: closingDate,
            },
          },
        ],
      },
    };

    return this.schedule.findAll(params);
  }

  // for intake level overlapped schedules
  getOverlapsByIntakeLevel(id, intakeId, closingDate, nextOpenDate) {
    let params = {};

    if (!nextOpenDate) {
      params = {
        where: {
          courseId: id,
          intakeId,
          cancelledDate: null,
          [Op.or]: [
            {
              nextOpenDate: { [Op.gt]: closingDate },
            },
            {
              nextOpenDate: null,
            },
          ],
        },
      };
    } else {
      params = {
        where: {
          courseId: id,
          intakeId,
          cancelledDate: null,
          [Op.or]: [
            {
              [Op.and]: [
                {
                  closingDate: {
                    [Op.lt]: nextOpenDate,
                  },
                },
                {
                  nextOpenDate: {
                    [Op.gt]: closingDate,
                  },
                },
              ],
            },
            {
              [Op.and]: [
                {
                  closingDate: {
                    [Op.lt]: nextOpenDate,
                  },
                },
                {
                  nextOpenDate: null,
                },
              ],
            },
          ],
        },
      };
    }

    return this.schedule.findAll(params);
  }

  async getScheduleById(id) {
    return this.schedule.findOne({
      where: {
        id,
      },
    });
  }

  async cancelSchedule(id) {
    await this.schedule.update(
      {
        cancelledDate: dateAsString(today()),
      },
      { where: { id } }
    );
    return this.schedule.findByPk(id);
  }

  /**
   * Find schedules by closing date.
   *
   * @param {Date} closingDate
   *
   * @returns {{data: array}}
   */
  async findAllByClosingDate(closingDate) {
    const params = {
      where: {
        closingDate,
      },
    };

    const data = await this.schedule.findAll(params);
    return { data };
  }

  /**
   * Find schedules by next open date.
   *
   * @param {Date} nextOpenDate
   *
   * @returns {{data: array}}
   */
  async findAllByNextOpenDate(nextOpenDate) {
    const params = {
      where: {
        nextOpenDate,
      },
    };

    const data = await this.schedule.findAll(params);
    return { data };
  }

  /**
   * Find all active Schedules by Course IDs
   *
   * @param {*} ids
   *
   * @returns {{data: array}}
   */
  async findAllActiveByCourseIds(ids) {
    const data = await this.schedule.findAll({
      where: {
        courseId: { [Op.in]: ids },
        closingDate: {
          [Op.lte]: dateAsString(today()),
        },
        nextOpenDate: {
          [Op.or]: [null, { [Op.gt]: dateAsString(today()) }],
        },
        cancelledDate: {
          [Op.is]: null,
        },
      },
    });

    return { data };
  }
}

module.exports = ScheduleRepository;
