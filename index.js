var redis = require('redis');
var events = require('events');

module.exports = function(options) {
	options = options || {};
	var port = options.port || 6379;
	var host = options.host || '127.0.0.1';
	var pub = redis.createClient(port, host, options);
	var sub = redis.createClient(port, host, options);
	var scope = (options.scope || '') + ':';
	var that = new events.EventEmitter();
	var emit = events.EventEmitter.prototype.emit;
	var removeListener = events.EventEmitter.prototype.removeListener;

	var onerror = function(err) {
		if (!that.listeners('error').length) return;
		emit.apply(that, Array.prototype.concat.apply(['error'], arguments));
	};
	sub.on('error', onerror);
	pub.on('error', onerror);
	sub.on('pmessage', function(pattern, channel, messages) {
		pattern = pattern.slice(scope.length);
		emit.apply(that, [pattern].concat(JSON.parse(messages)));
	});

	that.on('newListener', function(pattern, listener) {
		if (pattern === 'error') return;

		pattern = scope + pattern;
		if (that.listeners(pattern).length) return;
		sub.psubscribe(pattern);
	});
	that.emit = function(channel, messages) {
		if (channel in {newListener:1, error:1}) return emit.apply(this, arguments);

		messages = Array.prototype.slice.call(arguments);
		pub.publish(scope + channel, JSON.stringify(messages));
	};
	that.removeListener = function(pattern, listener) {
		if (pattern in {newListener:1, error:1}) return removeListener.apply(that, arguments);

		removeListener.apply(that, arguments);
		if (that.listeners(pattern).length) return that;
		sub.punsubscribe(scope+pattern);
		return that;
	};
	that.removeAllListeners = function(pattern) {
		that.listeners(pattern).forEach(function(listener) {
			that.removeListener(pattern, listener);
		});
		return that;
	};
	that.close = function() {
		pub.unref();
		sub.unref();
	};

	return that;
};