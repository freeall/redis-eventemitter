var redis = require('redis');
var events = require('events');

module.exports = function(options) {
	options = options || {};

	var pub = options.pub;
	var sub = options.sub;

	if (!options.pub) {
		if (options.auth) options.auth_pass = options.auth;

		var port = options.port || 6379;
		var host = options.host || '127.0.0.1';
		pub = redis.createClient(port, host, options);
		sub = redis.createClient(port, host, options);
	}

	var prefix = options.prefix || '';
	var that = new events.EventEmitter();
	var emit = events.EventEmitter.prototype.emit;
	var removeListener = events.EventEmitter.prototype.removeListener;

	var pending = 0;
	var queue = [];

	var onflush = function() {
		if (--pending) return;
		while (queue.length) queue.shift()();
	};
	var callback = function() {
		pending++;
		return onflush;
	};
	var onerror = function(err) {
		if (!that.listeners('error').length) return;
		emit.apply(that, Array.prototype.concat.apply(['error'], arguments));
	};
	sub.on('error', onerror);
	pub.on('error', onerror);
	sub.on('pmessage', function(pattern, channel, messages) {
		pattern = pattern.slice(prefix.length);
		channel = channel.slice(prefix.length);
		try {
			emit.apply(that, [pattern, channel].concat(JSON.parse(messages)));
		}
		catch(err) {
			process.nextTick(emit.bind(that, 'error', err));
		}
	});

	that.on('newListener', function(pattern, listener) {
		if (pattern === 'error') return;

		pattern = prefix + pattern;
		if (that.listeners(pattern).length) return;
		sub.psubscribe(pattern, callback());
	});
	that.emit = function(channel, messages) {
		if (channel in {newListener:1, error:1}) return emit.apply(this, arguments);

		var cb = callback();
		messages = Array.prototype.slice.call(arguments, 1);
		if (typeof messages[messages.length - 1] === 'function') {
			var onflush = callback();
			var realCb = messages.pop();
			cb = function() {
				realCb.apply(null, arguments);
				onflush();
			}
		}

		pub.publish(prefix + channel, JSON.stringify(messages), cb);
	};
	that.removeListener = function(pattern, listener) {
		if (pattern in {newListener:1, error:1}) return removeListener.apply(that, arguments);

		removeListener.apply(that, arguments);
		if (that.listeners(pattern).length) return that;
		sub.punsubscribe(prefix+pattern, callback());
		return that;
	};
	that.removeAllListeners = function(pattern) {
		that.listeners(pattern).forEach(function(listener) {
			that.removeListener(pattern, listener);
		});
		return that;
	};
	that.close = function() {
		pub.quit();
		pub.unref();
		sub.quit();
		sub.unref();
	};
	that.flush = function(fn) {
		if (!fn) return;
		if (!pending) return process.nextTick(fn);
		queue.push(fn);
	};

	return that;
};
