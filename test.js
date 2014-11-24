var redis = require('./index');
var assert = require('assert');

var testsMissing = 0;
var expectCall = function(f) {
	testsMissing++;

	var count = 1;
	return function() {
		testsMissing--;
		assert(count-- >= 0);
		f.apply(null, arguments);
	};
};
var hub = redis();
var hubPrefix = redis({
	prefix: 'foo:'
});


/* Standard tests */
hub.on('testSimple', expectCall(function(channel, msg) {
	assert(channel == 'testSimple');
	assert(msg === 'ok');
}));
hub.on('*:testGlobBefore', expectCall(function(channel, msg) {
	assert(channel === 'foo:testGlobBefore');
}));
hub.on('testGlobAfter:*', expectCall(function(channel, msg) {
	assert(channel === 'testGlobAfter:foo');
}));
hub.once('testOnce', expectCall(function() { }));
hub.on('testSeveralArgs', expectCall(function(channel, msg1, msg2) {
	assert(msg1 === 'okA');
	assert(msg2 === 'okB');
}));
hub.on('testJson', expectCall(function(channel, json) {
	assert(json.msg === 'ok');
}));
hub.on('testTwoListeners', expectCall(function() { }));
hub.on('testTwoListeners', expectCall(function() { }));


/* Test prefix */
hub.on('*testPrefixed', expectCall(function(channel, msg) {
	assert(channel === 'foo:testPrefixed');
}));
hubPrefix.on('testPrefixed', expectCall(function(channel, msg) {
	assert(channel === 'testPrefixed');
}));

/* Test callback */
hub.on('testCallbackNoArgs', expectCall(function(channel, msg) {
	assert(channel === 'testCallbackNoArgs');
	assert(!msg);
}));
hub.on('testCallbackAndArgs', expectCall(function(channel, msg) {
	assert(channel === 'testCallbackAndArgs');
	assert(msg === 'testArg');
}));

/* Test error handling */
hub.on('anerror', expectCall(function() {
	throw new Error('an error');
}));
process.once('uncaughtException', function(err) {
	if (err.message !== 'an error') return console.log(err.message, err.stack);
	assert(err.message === 'an error');
});


hub.flush(function() {
	hub.emit('testSimple', 'ok');
	hub.emit('foo:testGlobBefore', 'ok');
	hub.emit('testGlobAfter:foo', 'ok');
	hub.emit('testOnce', 'ok');
	hub.emit('testOnce', 'ok');
	hub.emit('testSeveralArgs', 'okA', 'okB')
	hub.emit('testJson', {msg:'ok'});
	hub.emit('testTwoListeners');

	hubPrefix.emit('testPrefixed', 'ok');

	hub.emit('anerror');

	hub.emit('testCallbackNoArgs', expectCall(function(err, num) {
		assert(!err);
		assert(num === 1);
	}));
	hub.emit('testCallbackAndArgs', 'testArg', expectCall(function(err, num) {
		assert(!err);
		assert(num === 1);
	}));
	hub.emit('testCallbackNoSub', expectCall(function(err, num) {
		assert(!err);
		assert(num === 0);
	}));
});

setTimeout(function() {
	assert(!testsMissing);
	hub.close();
	hubPrefix.close();
}, 2000);

setTimeout(function() {
	// Check to see if .close() works
	process.exit(1);
}, 5000).unref();
