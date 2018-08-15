'use strict';

let q = [],
	playSingle = true;

// function that continuously polls the server for new tweets
let tweetPoll = function () {
	let tweetSub = new XMLHttpRequest();

	tweetSub.open('GET', 'http://localhost:8728/api/subscribe/tweets');

	tweetSub.addEventListener('load', function () {
		let tweet = JSON.parse(tweetSub.response);
		q.push(tweet);
		tweetPoll();
	});

	tweetSub.addEventListener('timeout', function () {
		tweetPoll();
	});

	tweetSub.addEventListener('error', function () {
		tweetPoll();
	});

	tweetSub.timeout = 120 * 1000;

	tweetSub.send();
};

// function that will display/play all tweets as soon as they are receieved on the queue
// kind of like Bruce Almighty listening to the prayers
let playTweetsTogether = function () {
	// switch playback style if button has been pressed
	if (playSingle == true) {
		playTweetsSingle();
	// if there are not tweets, wait a half secoind and then try again
	} else if (q.length == 0) {
		setTimeout(playTweetsTogether, 500);
	// otherwise add the tweet, and audio element
	} else {
		let tweet = q.pop(),
			tweetNode = document.createElement('li'),
			textNode = document.createElement('p'),
			userNode = document.createElement('h2'),
			userImg = document.createElement('img');

		textNode.innerText = tweet.text;
		userNode.innerText = tweet.screen_name  + ':';
		userImg.setAttribute('src', tweet.profile_image_url);
		userImg.setAttribute('class', 'profile_img');
		tweetNode.appendChild(userImg);
		tweetNode.appendChild(userNode);
		tweetNode.appendChild(textNode);

		tweetNode.setAttribute('class', 'list-group-item playing');
		document.getElementById('tweetList').appendChild(tweetNode);

		let audioNode = document.createElement('audio');
		audioNode.setAttribute('src', tweet.mp3Path);
		audioNode.setAttribute('autoplay', 'true');
		document.getElementById('audioHolder').appendChild(audioNode);

		// once the audio payback has finished remove the audio element
		audioNode.addEventListener('ended', function () {
			document.getElementById('audioHolder').removeChild(audioNode);
			tweetNode.setAttribute('class', 'list-group-item notPlaying');
		});

		// get the next tweet
		playTweetsTogether();
	}	
};

// same as playTweetsTogether except it will only play one tweet at a time 
// for if you actually want to listen to each tweet
let playTweetsSingle = function () {
	if (playSingle == false) {
		playTweetsTogether();
	} else if (q.length == 0) {
		setTimeout(playTweetsSingle, 500); 
	} else {
		let tweet = q.pop(),
			tweetNode = document.createElement('li'),
			textNode = document.createElement('p'),
			userNode = document.createElement('h2'),
			userImg = document.createElement('img');

		textNode.innerText = tweet.text;
		userNode.innerText = tweet.screen_name + ':';
		userImg.setAttribute('src', tweet.profile_image_url);
		userImg.setAttribute('class', 'profile_img');
		tweetNode.appendChild(userImg);
		tweetNode.appendChild(userNode);
		tweetNode.appendChild(textNode);

		tweetNode.setAttribute('class', 'list-group-item playing');
		document.getElementById('tweetList').appendChild(tweetNode);

		let audioNode = document.createElement('audio');
		audioNode.setAttribute('src', tweet.mp3Path);
		audioNode.setAttribute('autoplay', 'true');
		document.getElementById('audioHolder').appendChild(audioNode);

		audioNode.addEventListener('ended', function () {
			document.getElementById('audioHolder').removeChild(audioNode);
			tweetNode.setAttribute('class', 'list-group-item notPlaying');
			setTimeout(playTweetsSingle, 500); // this adds a slight pause in between each tweet
		});
	}
};

// flip the text of the button after it's pressed
document.getElementById('switchPlayback').addEventListener('click', function () {
	if (playSingle === true) {
		playSingle = false;
		document.getElementById('switchText').innerText = 'Play 1 Tweet at a Time';
	} else {
		playSingle = true;
		document.getElementById('switchText').innerText = 'Play Tweets at the Same Time';
	}

});

// call the functions required to operate the page
tweetPoll();
playTweetsSingle();
