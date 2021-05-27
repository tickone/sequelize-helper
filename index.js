const { Op } = require('sequelize');

function parseOperator(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value.constructor.name === 'Array') {
    return value.map(this.parseOperator);
  }

  if (value.constructor.name !== 'object') {
    return value;
  }

  const operators = {
    gte: Op.gte,
    gt: Op.gt,
    lte: Op.lte,
    lt: Op.lt,
    eq: Op.eq,
    ne: Op.ne,
    in: Op.in,
    $gte: Op.gte,
    $gt: Op.gt,
    $lte: Op.lte,
    $lt: Op.lt,
    $eq: Op.eq,
    $ne: Op.ne,
    $in: Op.in,
  };

  return Object
    .keys(value)
    .reduce((obj, key) => {
      if (operators[key]) {
        return {
          [operators[key]]: this.parseOperator(value[key]),
        };
      }

      if (value[key]?.constructor?.name === 'object') {
        return {
          ...obj,
          [key]: this.parseOperator(value[key]),
        };
      }

      return {
        ...obj,
        [key]: value[key],
      };
    }, {});
}

function parseDate(key, value, timezone = 0) {
  const [, year, month, day] = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const startedAt = new Date(Date.UTC(year, Number(month) - 1, Number(day), 0, 0, 0, 0));
  const endedAt = new Date(Date.UTC(year, Number(month) - 1, Number(day), 23, 59, 59, 999));

  const getTime = (time) => {
    const milliseconds = time.getTime() - (this.timezone ?? timezone) * 3600000;

    return new Date(milliseconds);
  };

  return {
    [key]: {
      [Op.gte]: getTime(startedAt).toISOString(),
      [Op.lte]: getTime(endedAt).toISOString(),
    },
  };
}

class SequelizeHelper {
  constructor({ timezone = 8 } = {}) {
    this.timezone = timezone;
  }
}

SequelizeHelper.parseOperator = parseOperator;
SequelizeHelper.parseDate = parseDate;

SequelizeHelper.prototype.parseOperator = parseOperator;
SequelizeHelper.prototype.parseDate = parseDate;

module.exports = SequelizeHelper;