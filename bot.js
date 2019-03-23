const Twit = require('twit'),
	TwitterBot = require('node-twitterbot').TwitterBot;

const Bot = new TwitterBot({
	consumer_key: process.env.BOT_CONSUMER_KEY,
	consumer_secret: process.env.BOT_CONSUMER_SECRET,
	access_token: process.env.BOT_ACCESS_TOKEN,
	access_token_secret: process.env.BOT_ACCESS_TOKEN_SECRET
});

const phraseArray = [ "hello",
			"rid dit did did doo!",
			"tweet da dee la dee!"
];

function chooseRandom(phrases) {
	return phrases[Math.floor(Math.random() * myArray.length)];
}

const phrase = chooseRandom(phrases);

Bot.tweet(phrase);
