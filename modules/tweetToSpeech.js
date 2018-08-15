'use strict';

let tweetToSpeech = {};

const aws = require('aws-sdk'), // used for making aws-polly call(voice synthesization)
	twitter = require('twitter'), // used for making twitter api call
	fs = require('fs'), // used for writing to the filesystem
	polly = new aws.Polly({
		// I know better
		accessKeyId: '', 
		secretAccessKey: '',
		signatureVersion: 'v4',
		region: 'us-east-1'
	}),
	twitterClient = new twitter({
		// I know better again
		consumer_key: '',
		consumer_secret: '',
		access_token_key: '',
		access_token_secret: '' 
	});

	//used for mp3 file naming
let tweetCount = 0;

// the meat and potatoes of my app
tweetToSpeech.subscribeToStream = function(trackString, eventBus) {
	// create a stream of tweets with defined filter
	let stream = twitterClient.stream('statuses/filter', {track: trackString});

	// when I tweet is sent, get the text from it and send it to amazon to be synthesized to speech
	stream.on('data', function(tweet) {
		// I added this because occasionally for long tweets twitter will put some of the text in the text
		// field and the url to tweet, instead of the full text
		let text = '',
			user = tweet.user.screen_name;
		if (tweet.extended_tweet){
			text = tweet.extended_tweet.full_text;
		} else {
			text = tweet.text;
		}
		// this is where amazon comes in
		polly.synthesizeSpeech({
			'Text': `${tweet.user.screen_name} tweeted: ${text}`,
			'OutputFormat': 'mp3',
			'VoiceId': 'Matthew'
		}, function (err, data) {
			//if there's an error I don't handle it very well
			if (err) {
				console.log('AWS error:\n' + err);
			// otherwise write the mp3 to a file and create a tweet event
			} else if (data) {
				if (data.AudioStream instanceof Buffer) {
					tweetCount++; // bump tweetCount for naming purposes
					//write file and create tweet event on the defined bus
					fs.writeFile(`./public/mp3/${tweet.user.screen_name}_${tweetCount}.mp3`, data.AudioStream, function (err2) {
						if (err2) {
							console.log('file writing error:\n' + err2);
						}
						eventBus.emit('tweet', {
							text: text,
							screen_name: user,
							mp3Path: `./mp3/${tweet.user.screen_name}_${tweetCount}.mp3`,
							profile_image_url: tweet.user.profile_image_url
						});
					});
				}
			}
		});
	});
	// More often then I would like twitter sends an error on the stream, while testing it was often '420: enhance your calm'
	// which I think means I'm making too many request to the api??? This error completely breaks my app and I have to restart
	// I was unable to test this as a fix
	stream.on('error', function(error) {
		console.log('Stream error:\n' + error);
		console.log('\nWaiting 1.5 seconds and retrying\n');
		setTimeout(tweetToSpeech.subscribeToStream, 1500, trackString, eventBus);
	});
};

module.exports = tweetToSpeech;