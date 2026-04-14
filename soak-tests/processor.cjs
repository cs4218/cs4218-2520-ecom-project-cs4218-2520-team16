/**
 * Artillery Processor for Soak Testing (CommonJS — required by Artillery workers)
 * Author: Aum Yogeshbhai Chotaliya (A0285229M)
 */

const searchTerms = [
  'shoe', 'laptop', 'phone', 'watch', 'bag',
  'shirt', 'dress', 'book', 'toy', 'camera',
];

const responseTimes = [];
const testStartTime = Date.now();

function setSearchTerm(requestParams, context, ee, next) {
  const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  context.vars.searchTerm = randomTerm;
  return next();
}

function captureResponseTime(requestParams, response, context, ee, next) {
  const elapsedSinceStart = Math.floor((Date.now() - testStartTime) / 1000);
  const responseTime = response.timings ? response.timings.phases.total : 0;

  responseTimes.push({
    timestamp: elapsedSinceStart,
    responseTime,
    endpoint: requestParams.url,
  });

  ee.emit('customStat', {
    stat: 'response_time_with_timestamp',
    value: responseTime,
    timestamp: elapsedSinceStart,
  });

  return next();
}

function afterScenario(context, ee, next) {
  return next();
}

module.exports = {
  setSearchTerm,
  captureResponseTime,
  afterScenario,
};
