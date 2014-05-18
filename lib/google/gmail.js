var Imap = require('imap'),
	inspect = require('util').inspect;

var xoauth2 = require("xoauth2"),
    xoauth2gen;

// @constructor
function Gmail() {

	this.imap;

}

// Authenticate a new gmail user
// @param {GoogleAuthClient} client Contains all the info necessary to generate a login token
Gmail.prototype.login = function(client, callback) {

	var _this = this;

	// Generate a gmail access token
	xoauth2gen = xoauth2.createXOAuth2Generator({
		user: client.user.email,
		clientId: client.clientId,
		clientSecret: client.clientSecret,
		refresToken: client.refresh_token,
		accessToken: client.access_token
	});

	xoauth2gen.getToken(function(err, token) {
		if (err) {
			callback(err, null);
			return;
		}

		// Set up the gmail connection
		_this.imap = new Imap({
			xoauth2: token,
			host: 'imap.gmail.com',
  			port: 993,
  			tls: true
		});

		_this.imap.once('ready', function() {
			callback(null, _this);
		});

		_this.imap.once('error', function(err) {
			callback(err, null);
		});

		// imap.once('end', function() {
		// 	console.log('Connection ended');
		// });

		// Open the gmail connection
		_this.imap.connect();
	});
};

// Get list of gmail labels
// @param {function=} callback Callback
Gmail.prototype.getLabels = function(callback) {
	this.imap.getBoxes(function(err, boxes) {
		if (err) {
			callback(err, null);
			return;
		}

		callback(null, Object.keys(boxes));

		// for(var box in boxes) {
		// 	if (box.toString().substring(0,1) == '@') {
		// 		res.write(box + '\n');
		// 	}
		// }
	});
};

// Get list of emails for a given label
// @param {string} label The name of the label
// @return {array} all of the threads
Gmail.prototype.getThreads = function(label, callback) {
	var _this = this;
	this.imap.openBox(label, true, function(err, box) {
		if (err) {
			callback(err, null)
			return;
		}

		// If there are any messages, get them
		var f = _this.imap.fetch('1:' + (box.messages.total - 1).toString(), {
			bodies: '',
			struct: true
		});

		var threads = {};
		f.on('message', function(msg, seqno) {
			var message = {
				attrs: [],
				body: ''
			};

			msg.on('body', function(stream, info) {
				var body = '';
				stream.on('data', function(chunk) {
					body += chunk.toString('utf8');
				});
				stream.once('end', function() {
					message.body = body;
				});
			});

			msg.once('attributes', function(attrs) {
				message.attrs = attrs;
			});

			msg.once('end', function() {
				var threadID = message.attrs['x-gm-thrid'];
				if (threads.threadID) {
					threads.threadID.push(message);
				} else {
					threads[threadID] = [message];
				}
			});
		});

		f.once('error', function(err) {
			console.log(err);
		});

		f.once('end', function() {
			callback(null, threads);
		});
	});
};


module.exports = new Gmail();