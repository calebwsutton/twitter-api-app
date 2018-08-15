'use strict';

const express = require('express'),
	events = require('events'), // used to push tweets to the client
	cookieParser = require('cookie-parser'),
	expressSession = require('express-session'),
	passport = require('passport'),
	facebookStrategy = require('passport-facebook'),
	app = express(),
	tweetToSpeech = require('./modules/tweetToSpeech.js');



// Boilerplate express setup
//
//
app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.static('resources'));

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Setup Cookie Parser to parse our cookies, we won't really be using cookies,
// but we will be using a cookie for login
app.use(cookieParser());

// Setup session handling
// Always do express-session config first
app.use(expressSession({
	secret: 'youshallnotpass',
	resave: false,
	saveUninitialized: false
}));

// Setup Passport
app.use(passport.initialize());
// Make sure express-session was already configured
app.use(passport.session());






// User login with facebook using passport
//
//
passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

// Use the FacebookStrategy within Passport.
passport.use(new facebookStrategy({
	clientID: '189842831593475',
	clientSecret: '1f341567107f0206b2cfd77f9ce755f7',
	callbackURL: 'http://localhost:8728/auth/facebook/callback'
}, function(accessToken, refreshToken, profile, done) {
	process.nextTick(function () {
		return done(null, profile);
	});
}));

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect: '/home',
		failureRedirect: '/login'
	}),
	function (req, res) {
		res.redirect('/home');
	});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/login');
});

let ensureAuthenticated = function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/login');
};




// Twitter module call and routing for api call
//
//
let	tweetBus = new events.EventEmitter();
tweetBus.setMaxListeners(500);
tweetToSpeech.subscribeToStream('#csc365', tweetBus); // Call to my module, basically starts listening for tweets

app.get('/api/subscribe/tweets', function (req, res) {
	// when the module recieves a tweet it will emit a tweet event that we can listen for
	tweetBus.once('tweet', function (data) {
		// once the tweet is ready send it to the client/user
		res.json(data);
	});
});

// Basic Routing
//
//
app.get('/', ensureAuthenticated, function (req, res) {
	res.redirect('home', {
		user: req.user 
	});
});

app.get('/login', function (req, res) {
	res.render('login');
});

app.get('/home', ensureAuthenticated, function (req, res) {
	res.render('home', {
		user: req.user 
	});
});

app.get('/about', ensureAuthenticated, function (req, res) {
	res.render('about', {
		user: req.user 
	});
});

const server = app.listen('8728', function () {
	console.log(`Server started on port ${server.address().port}`);
});


