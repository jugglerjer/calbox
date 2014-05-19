var googleAuth = require('./google/auth');

var REFRESH_TOKEN = '1/w9BYWp_6ghhrjjlP5z3ZNAIy7fdF_0yy4BePSkbsub0';

function Auth() {

}

Auth.prototype.login = function(req, res) {

	// Is the user already signed in?
	if (req.session.user) {

		// Set up the Google authentication object
		googleAuth.configureAuth(req.session.user.access_token, req.session.user.refresh_token);
		googleAuth.email = req.session.user.email;
		req.session.client = googleAuth;
		res.redirect('/profile');

	} else {

		// Redirect to the Google auth page
		res.redirect(302, googleAuth.getAuthUrl());

	}
};

Auth.prototype.finishLogin = function(req, res, code, callback) {
	googleAuth.finish(code, function(err, client) {
		if (err) {
			callback(err, null);
			return;
		}

		// Save the Google info to the user object
		var db = req.db;
		
		var email = client.email;
		var access_token = client.access_token;
		var refresh_token = client.refresh_token;
		console.log(refresh_token);
		var collection = db.get('usercollection');

		// Does the user exist?
		collection.findOne({email: email}, function(err, doc) {
			if (err) {
				console.log('Trouble quering for the user in the database');
				return;
			}

			if (doc) {
				doc.access_token = client.access_token
				if (refresh_token) {
					doc.refresh_token = refresh_token
				}
				collection.update(doc, function(err, doc) {
					if (err) {
						console.log('Trouble updating user in the database');
						return;
					}

					refresh_token = doc.refresh_token;
					console.log(doc.email + ' successfully updated');
				});
			} else {
				collection.insert({
					'email' : email,
					'access_token' : access_token,
					'refresh_token' : refresh_token
				}, function(err, doc) {
					if (err) {
						console.log('Trouble adding user to the database');
						return;
					}

					refresh_token = doc.refresh_token;
					console.log(doc.email + ' successfully added');
				});
			}
		});

		// Add the user to the session
		req.session.user = {
			'email' : email,
			'access_token' : access_token,
			'refresh_token' : refresh_token
		};

		req.session.client = client;

		callback(null, client);
	});
};

module.exports = new Auth();



