var express = require('express');
var router = express.Router();

var auth = require('../lib/auth');
var googleAuth = require('../lib/google/auth');
var gmail = require('../lib/google/gmail');
var calendar = require('../lib/google/calendar');

var async = require('async');

/* GET home page. */
router.get('/', function(req, res) {
  	
});

/* GET Google Authentication Request Page */
router.get('/login', function(req, res) {
	auth.login(req, res);
});

/* GET start page once the user has authenticated */
router.get('/start', function(req, res) {
	var code = req.param('code');

	// Finish the Google authentication process
	auth.finishLogin(req, res, code, function(err, client) {

		if (err) {
			res.end('There was a problem signing in');
			return;
		}

		res.redirect('/profile');

	});
});

router.get('/profile', isLoggedIn, function(req, res) {

	// Log into gmail
	gmail.login(req.session.client, function(err, gmail) {
		if (err) {
			console.log(err);
			return;
		}

		// Get the user's gmail labels
		gmail.getLabels(function(err, labels) {

			// Get the messages for each label
			async.eachSeries(labels, function(label, callback) {
				if (label.toString().substring(0,1) == '@') {
					gmail.getThreads(label, function(err, threads) {
						if (err) {
							callback(err);
							return;
						}

						console.log(label + ': ' + Object.keys(threads).length + ' threads');
						callback();
						
					}, function(err) {
						if (err) {
							console.log(err);
							return;
						}
					});
				}
			});
		});
	});

	// Get the user's calendars
	calendar.setCredentials({
		access_token: req.session.user.access_token,
		refresh_token: req.session.user.refresh_token
	});
	calendar.getCalendars(function(err, calendars) {
		if (err) {
			console.log(err);
			return;
		}

		console.log(calendars);
	});

	res.end();

});

function isLoggedIn(req, res, next) {
	if (req.session.user) {
		return next();
	}

	res.redirect('/login');
}

module.exports = router;
