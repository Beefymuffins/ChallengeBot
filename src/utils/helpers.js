// eslint-disable-next-line no-shadow
module.exports = function addMonths(numOfMonths, date = new Date()) {
  date.setMonth(date.getMonth() + numOfMonths);

  return date;
};

module.exports = function percentage(percent, total) {
  return (percent / 100) * total;
};
