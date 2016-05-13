module.exports = function(config) {
	return config.loadConfig('sct-access.json', {
		ttl: {
			doc: 'Amount of time for which a token is valid in minutes',
			format: 'nat',
			default: 15
		},
		tokenLength: {
			doc: 'Length of the access token',
			format: 'nat',
			default: 5
		},
		channel: {
			doc: 'The channel to post messages/files to',
			format: String,
			default: '#asc1'
		},
		url: {
			doc: 'The URL of the front-end (with trailing /)',
			format: 'url',
			default: 'https://sct.supinbot.ovh/'
		},
		port: {
			doc: 'The port on which express will listen on',
			format: 'port',
			default: 9090
		},
		cookie: {
			secret: {
				doc: 'String used to encrypt the cookie',
				format: String,
				default: null
			},
			duration: {
				doc: 'Default amount of time for which a session is valid in minutes',
				format: 'nat',
				default: 60 // 1 hour.
			},
			active_duration: {
				doc: 'if duration < active_duration, the session will be extended by active_duration ms',
				format: 'nat',
				default: 5 * 60 * 1000 // 5 minutes.
			}
		}
	});
};
