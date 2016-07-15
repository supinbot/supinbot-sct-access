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
		this.redisClient = redis.createClient(redisUri);
		this.redisClient.select(redisDb);

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

			yield self.redisClient.set(token, duration);
			yield self.redisClient.EXPIRE(token, self.tokenTtl);

			return token;
		});
	}

	getToken(token) {
		return co(function*() {
			return yield this.redisClient.get(token);
		});
	}

	useToken(token) {
		return co(function*() {
			return yield this.redisClient.DEL(token);
		});
	}

	generate() {
		return tokenGen(this.tokenLength, TOKEN_CHARS);
	}
}

module.exports = Token;
