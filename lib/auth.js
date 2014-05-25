var googleAuth = require('./google/auth');

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
		var collection = db.get('usercollection');

		var newUser = {
			$set: {
				email: client.email,
				access_token: client.access_token
			}
		};
		if (client.refresh_token) {
			console.log('Refresh token: ' + client.refresh_token);
			newUser.$set.refresh_token = client.refresh_token
		}
		console.log(newUser);

		// Update the user if they exist, otherwise create a new user
		collection.findAndModify(
			{email: client.email},
			newUser,
			{upsert: true},
			function(err, doc) {

				if (err) {
					console.log('Trouble querying for the user in the database');
					return;
				}

				console.log('User added / updated:');
				console.log(doc);

				// Add the user to the session
				req.session.user = doc;
				req.session.client = client;
				callback(null, client);
			}
		);
	});
};

module.exports = new Auth();



