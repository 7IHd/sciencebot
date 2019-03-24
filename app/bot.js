const fs = require('fs'),
  util = require('util'),
  TwitterBot = require('node-twitterbot').TwitterBot,
  path = require('path'),
  axios = require('axios'),
  argv = require('minimist')(process.argv.slice(2)),
  mapObjIndexed = require('ramda/src/mapObjIndexed'),
  values = require('ramda/src/values'),
  omit = require('ramda/src/omit'),
  randomwords = require('random-words'),
  schedule = require('node-schedule');

const readFile = util.promisify(fs.readFile);
// const writeFile = util.promisify(fs.writeFile);

const _getConfig = async () => {
  try {
    const configPath = path.join(__dirname, 'conf/config.json');

    const config = JSON.parse(await readFile(configPath, 'utf8'));
    return {
      BOT_CONSUMER_KEY: config['BOT_CONSUMER_KEY'],
      BOT_CONSUMER_SECRET: config['BOT_CONSUMER_SECRET'],
      BOT_ACCESS_TOKEN: config['BOT_ACCESS_TOKEN'],
      BOT_ACCESS_TOKEN_SECRET: config['BOT_ACCESS_TOKEN_SECRET'],
    };
  } catch (err) {
    return {
      BOT_CONSUMER_KEY: undefined,
      BOT_CONSUMER_SECRET: undefined,
      BOT_ACCESS_TOKEN: undefined,
      BOT_ACCESS_TOKEN_SECRET: undefined,
    };
  }
};

const _buildConfig = async () => {
  const {
    BOT_CONSUMER_KEY,
    BOT_CONSUMER_SECRET,
    BOT_ACCESS_TOKEN,
    BOT_ACCESS_TOKEN_SECRET,
  } = await _getConfig();

  return {
    consumer_key: BOT_CONSUMER_KEY || process.env.BOT_CONSUMER_KEY,
    consumer_secret: BOT_CONSUMER_SECRET || process.env.BOT_CONSUMER_SECRET,
    access_token: BOT_ACCESS_TOKEN || process.env.BOT_ACCESS_TOKEN,
    access_token_secret:
      BOT_ACCESS_TOKEN_SECRET || process.env.BOT_ACCESS_TOKEN_SECRET,
  };
};

_buildParam = (value, key) => {
  return `${key}=${value}`;
};

const _buildQuery = async () => {
  return values(mapObjIndexed(_buildParam, omit('_', argv))).join('&');
};

function _getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

const _validateAwards = awards => {
  if (awards.length === 0) {
    console.log('Invalid award results; it must not be zero.');
    return false;
  }

  return true;
};

const _validateAward = award => {
  if (award.awardeeName === undefined) {
    console.log('Invalid awardeeName; it must not be undefined.');
    return false;
  }

  if (award.title === undefined) {
    console.log('Invalid title; it must not be undefined.');
    return false;
  }

  if (award.date === undefined) {
    console.log('Invalid date; it must not be undefined.');
    return false;
  }

  return true;
};

const _getAwardOfTheDay = async () => {
  const url = `http://api.nsf.gov/services/v1/awards.json?keyword=${randomwords()}`;
  console.log(url);
  const nsfResponse = await axios(url);
  const awards = nsfResponse.data.response.award;

  if (!_validateAwards(awards)) {
    await setTimeout(async () => {
      await _getAwardOfTheDay();
    }, 100);

    return;
  }

  const award = nsfResponse.data.response.award[_getRandomInt(awards.length)];

  if (!_validateAward(award)) {
    await setTimeout(async () => {
      await _getAwardOfTheDay();
    }, 100);

    return;
  }

  return `On ${award.date}, ${award.agency} awarded ${
    award.awardeeName
  } $${parseInt(award.fundsObligatedAmt, 10).toLocaleString()} for ${
    award.title
  }.`;
};

const _run = async () => {
  try {
    const config = await _buildConfig();
    const ScienceBot = new TwitterBot(config);
    const query = await _buildQuery();
    const award = await _getAwardOfTheDay();
    console.log(award);
    console.log(award.length);
    const twitterResponse = await ScienceBot.tweet(award);
  } catch (err) {
    console.log(err);
  }
};

schedule.scheduleJob('58 * * * *', function () {
  _run();
});