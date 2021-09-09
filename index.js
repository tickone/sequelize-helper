const { Op } = require('sequelize');

function parseOperator(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value.constructor.name === 'Array') {
    return value.map(this.parseOperator ?? parseOperator);
  }

  if (value.constructor.name !== 'Object') {
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
          ...obj,
          [operators[key]]: (this.parseOperator ?? parseOperator)(value[key]),
        };
      }

      if (value[key]?.constructor?.name === 'Object') {
        return {
          ...obj,
          [key]: (this.parseOperator ?? parseOperator)(value[key]),
        };
      }

      return {
        ...obj,
        [key]: value[key],
      };
    }, {});
}

function parseSQLLiteral(value, col = '') {
  if (value === undefined) {
    return undefined;
  }

  if (value.constructor.name !== 'Object') {
    return value;
  }

  const operators = {
    gte: '>=',
    gt: '>',
    lte: '<=',
    lt: '<',
    eq: '=',
    ne: '!=',
    $gte: '>=',
    $gt: '>',
    $lte: '<=',
    $lt: '<',
    $eq: '=',
    $ne: '!=',
  };

  return Object
    .keys(value)
    .reduce((values, key) => {
      if (operators[key]) {
        return [
          ...values,
          `${col} ${operators[key]} ${value[key]}`,
        ];
      }

      return [
        ...values,
        ...(this.parseSQLLiteral ?? parseSQLLiteral)(value[key], key),
      ];
    }, []);
}

function parseDate(value, timezone = 0) {
  const [, year, month, day] = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const startedAt = new Date(Date.UTC(year, Number(month) - 1, Number(day), 0, 0, 0, 0));
  const endedAt = new Date(Date.UTC(year, Number(month) - 1, Number(day), 23, 59, 59, 999));

  const getTime = (time) => {
    const milliseconds = time.getTime() - (this.timezone ?? timezone) * 3600000;

    return new Date(milliseconds);
  };

  return {
    [Op.gte]: getTime(startedAt).toISOString(),
    [Op.lte]: getTime(endedAt).toISOString(),
  };
}

function parseBulkCreate(values, keys = ['id']) {
  const duplicated = [];

  return values
    .reverse()
    .reduce((a, b) => {
      const key = keys.map((k) => b[k]).join(':');

      if (duplicated.includes(key)) {
        return a;
      }

      duplicated.push(key);

      return [
        ...a,
        b,
      ];
    }, []);
}

class SequelizeHelper {
  constructor({ timezone = 8 } = {}) {
    this.timezone = timezone;
  }
}

SequelizeHelper.parseOperator = parseOperator;
SequelizeHelper.parseDate = parseDate;
SequelizeHelper.parseBulkCreate = parseBulkCreate;
SequelizeHelper.parseSQLLiteral = parseSQLLiteral;

SequelizeHelper.prototype.parseOperator = parseOperator;
SequelizeHelper.prototype.parseDate = parseDate;
SequelizeHelper.prototype.parseBulkCreate = parseBulkCreate;
SequelizeHelper.prototype.parseSQLLiteral = parseSQLLiteral;

module.exports = SequelizeHelper;
