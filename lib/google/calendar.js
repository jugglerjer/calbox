var googleapis = require('googleapis');

// @constructor
function GoogleCalendar() {

	this.client;

}

// Get a list of the user's calendars
GoogleCalendar.prototype.getCalendars = function (authClient, callback) {
	googleapis
    	.discover('calendar', 'v3')
    	.execute(function(err, client) {
    		if (err) {
    			callback(err, null);
    			return;
    		}

    		console.log(authClient);
    		client.calendar.calendarList.list().withAuthClient(authClient.oauth2Client).execute(function(err, list) {
    			if (err) {
	    			callback(err, null);
	    			return;
	    		}

    			callback(null, list);
    		});

	});
};

module.exports = new GoogleCalendar();