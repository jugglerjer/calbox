var googleapis = require('googleapis'),
	OAuth2 = googleapis.auth.OAuth2;

// Client ID and client secret are available at
// https://code.google.com/apis/console
var GOOGLE_CLIENT_ID = '239102671406-8big71ieknpr7b07odmpm22f212n3egj.apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET = 'bP1T-LciJd9TvPW7hLNQ1tIe';
var GOOGLE_REDIRECT_URL = 'http://localhost:3000/start';

// @constructor
function GoogleAuthClient() {

	this.clientId = GOOGLE_CLIENT_ID;
	this.clientSecret = GOOGLE_CLIENT_SECRET;
	this.redirectUrl = GOOGLE_REDIRECT_URL

	// Set the necessary authentication parameters for the app
	this.access_type = 'offline';
	this.scopes = [
		'profile',
		'email',
		'https://www.googleapis.com/auth/calendar',
		'https://mail.google.com/'
	];

	this.oauth2Client =
		new OAuth2(this.clientId, this.clientSecret, this.redirectUrl);

	this.access_token;
	this.refresh_token;
	this.email;
}

// Gets the start url for authenticating app users
// with the right scope
GoogleAuthClient.prototype.getAuthUrl = function() {
	return this.oauth2Client.generateAuthUrl({
		access_type: this.access_type,
		scope: this.scopes.join(" ")
	});
};

// Finish the authentication process
// by trading the auth code for a token
// and parsing the user_id information
// @param {string} the authentication code returned by the Google consent page
GoogleAuthClient.prototype.finish = function(code, callback) {
	var _this = this;
	var _oauth2Client = this.oauth2Client;
	this.oauth2Client.getToken(code, function(err, tokens) {

		if (err) {
			callback(err, null);
			return;
		}

		// set tokens to the client
		// TODO: tokens should be set by OAuth2 client.
		_oauth2Client.setCredentials(tokens);
		_this.access_token = tokens.access_token;
		_this.refresh_token = tokens.refresh_token;

		// Parse the identity information
		_oauth2Client.verifyIdToken(tokens.id_token, null, function(err, login) {
			if (err) {
				callback(err, null);
				return;
			}
			_this.email = login.getPayload().email;

			callback(null, _this);
		});
	});
};

// Set up the authentication object for a user who is already signed in
// @param {string} access_token
// @param {string} refresh_token
GoogleAuthClient.prototype.configureAuth = function(access_token, refresh_token) {
	this.oauth2Client.setCredentials({
		access_token: access_token,
		refresh_token: refresh_token
	});
};

module.exports = new GoogleAuthClient();