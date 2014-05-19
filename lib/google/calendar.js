var googleapis = require('googleapis'),
    OAuth2 = googleapis.auth.OAuth2;
var googleAuth = require('./auth');

// @constructor
function GoogleCalendar() {

	this.client = new OAuth2(googleAuth.clientId, googleAuth.clientSecret, googleAuth.redirectUrl);

}

// Get a list of the user's calendars
GoogleCalendar.prototype.getCalendars = function (callback) {
	var _this = this;
    googleapis
    	.discover('calendar', 'v3')
    	.execute(function(err, client) {
    		if (err) {
    			callback(err, null);
    			return;
    		}

    		client.calendar.calendarList.list().withAuthClient(_this.client).execute(function(err, list) {
    			if (err) {
	    			callback(err, null);
	    			return;
	    		}

    			callback(null, list);
    		});

	});
};

// Set the appropriate Google credentials
GoogleCalendar.prototype.setCredentials = function(credentials) {
    this.client.credentials = credentials;
}

module.exports = new GoogleCalendar();