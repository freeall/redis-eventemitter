var redis = require('redis');
var events = require('events');

module.exports = function(port, host, options) {
	var pub = redis.createClient(port, host, options);
	var sub = redis.createClient(port, host, options);
	var that = new events.EventEmitter();
	var emit = events.EventEmitter.prototype.emit;

	sub.on('error', function(err) {
		emit.apply(that, Array.prototype.concat.apply(['error'], arguments));
	});
	pub.on('error', function(err) {
		emit.apply(that, Array.prototype.concat.apply(['error'], arguments));
	});
	sub.on('pmessage', function(pattern, channel, messages) {
		emit.apply(that, [pattern].concat(JSON.parse(messages)));
	});

	that.on('newListener', function(pattern, listener) {
		if (that.listeners(pattern).length) return;
		sub.psubscribe(pattern);
	});
	that.emit = function(channel, messages) {
		if (channel === 'newListener') return emit.apply(this, arguments);
		messages = Array.prototype.slice.call(arguments, 1);
		pub.publish(channel, JSON.stringify(messages));
	};
	that.removeListener = function(pattern, listener) {
		events.EventEmitter.prototype.removeListener.apply(that, arguments);

		if (that.listeners(pattern).length) return;
		sub.punsubscribe(pattern);
		return that;
	};
	that.removeAllListeners = function(pattern) {
		that.listeners(pattern).forEach(function(listener) {
			that.removeListener(pattern, listener);
		});
		return that;
	};

	return that;
};