'use strict';

module.exports = {
	ttl: {
		doc: 'Amount of time for which a token is valid in seconds',
		format: 'nat',
		default: 600,
		env: 'SUPINBOT_SCT_TOKEN_TTL'
	},
	tokenLength: {
		doc: 'Length of the access token',
		format: 'nat',
		default: 5,
		env: 'SUPINBOT_SCT_TOKEN_LENGTH'
	},
	redisDb: {
		doc: 'The ID of the redis DB to use',
		format: 'nat',
		default: 5,
		env: 'SUPINBOT_SCT_REDIS_DB'
	},
	channel: {
		doc: 'The channel to post messages/files to',
		format: String,
		default: '#asc1',
		env: 'SUPINBOT_SCT_CHANNEL'
	},
	rate_limit: {
		max: {
			doc: 'Maximum amount of login requests',
			format: 'nat',
			default: 15,
			env: 'SUPINBOT_SCT_RATE_MAX'
		},
		window: {
			doc: 'Time frame in ms',
			format: 'nat',
			default: 15 * 60 * 1000,
			env: 'SUPINBOT_SCT_RATE_WINDOW'
		},
		delay: {
			doc: 'Delay for subsequent requests in ms',
			format: 'nat',
			default: 0,
			env: 'SUPINBOT_SCT_RATE_DELAY'
		},
		redisDb: {
			doc: 'The ID of the redis DB to use for rate limiting',
			format: 'nat',
			default: 4,
			env: 'SUPINBOT_SCT_RATE_REDIS_DB'
		}
	},
	cookie: {
		secret: {
			doc: 'String used to encrypt the cookie',
			format: String,
			default: null,
			env: 'SUPINBOT_SCT_COOKIE_SECRET'
		},
		duration: {
			doc: 'Maximum amount of time for which a session is valid in minutes',
			format: 'nat',
			default: 1440, // 24 hour.
			env: 'SUPINBOT_SCT_COOKIE_DURATION'
		},
		active_duration: {
			doc: 'if duration < active_duration, the session will be extended by active_duration ms',
			format: 'nat',
			default: 5 * 60 * 1000, // 5 minutes.
			env: 'SUPINBOT_SCT_COOKIE_ACTIVE_DURATION'
		}
	},
	default_duration: {
		doc: 'Default amount of time for which a token can be used in minutes',
		format: 'nat',
		default: 60,
		env: 'SUPINBOT_SCT_DURATION'
	}
};
