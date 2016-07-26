'use strict';

const tokenGen = require('rand-token').generate;
const bluebird = require('bluebird');
const redis = require('redis');
const co = require('co');

const TOKEN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

class TokenStore {
	constructor(tokenLength, redisUri, redisDb, tokenTtl) {
		this.redisClient = redis.createClient(redisUri, {db: redisDb});

		var self = this;
		process.on('SHUTDOWN', () => {
			if (!self.redisClient.closing) self.redisClient.close();
		});

		this.tokenLength = tokenLength;
		this.tokenTtl = tokenTtl;
	}

	createToken(duration) {
		var self = this;
		return co(function*() {
			var token;
			do {
				token = self.generate();
			} while (yield self.getToken(token));

			yield self.redisClient.setAsync(token, duration);
			yield self.redisClient.EXPIREAsync(token, self.tokenTtl);

			return token;
		});
	}

	getToken(token) {
		return this.redisClient.getAsync(token);
	}

	useToken(token) {
		return this.redisClient.DELAsync(token);
	}

	generate() {
		return tokenGen(this.tokenLength, TOKEN_CHARS);
	}
}

module.exports = TokenStore;
