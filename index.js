'use strict';

const path = require('path');
const fs = require('fs');

const pkg = require('./package.json');
const TokenStore = require('./lib/token-store');

module.exports = function(SupinBot) {
	var config = SupinBot.config.loadConfig(require('./lib/config'));
	module.exports.config = config;
	module.exports.SupinBot = SupinBot;

	var tokenStoreInstance = new TokenStore(config.get('tokenLength'), SupinBot.config.get('redis'), config.get('redisDb'), config.get('ttl'));
	module.exports.tokenStoreInstance = tokenStoreInstance;

	const routes = require('./routes/index');

	SupinBot.WebApp.registerRoute(pkg.name, '/sct', 'SCT Access', routes);

	SupinBot.CommandManager.addCommand('scttoken', function(user, channel, args, argsStr) {
		var token = tokenStoreInstance.createToken(args[0]);
		SupinBot.postMessage(channel.id, `SCT Access Token created: *${token}*`);
	})
	.setDescription('Generates an access token to let SCT post to the chat.')
	.addArgument('Session duration in minutes', 'int', config.get('cookie.duration'))
	.adminOnly();
};
