var express = require('express');
var router = express.Router();

var googleAuth = require('../lib/google/auth');
var gmail = require('../lib/google/gmail');

var async = require('async');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

/* GET Google Authentication Request Page */
router.get('/auth', function(req, res) {

	// Redirect to the Google consent page
	// console.log(google.getAuthUrl())
	res.redirect(301, googleAuth.getAuthUrl());
});

/* GET start page once the user has authenticated */
router.get('/start', function(req, res) {
	var code = req.param('code');

	// Finish the Google authentication process
	googleAuth.finish(code, function(err, client) {
		
		// Log into gmail
		gmail.login(client, function(err, gmail) {

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
				})
				res.end();
			});
		});
	});
});

module.exports = router;
