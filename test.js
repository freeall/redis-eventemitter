var redis = require('./index');
var assert = require('assert');

var hub = redis();
var hubScope = redis({
	scope: 'tests'
});
var hubNoScope = redis({
	scope: false
});

var testsMissing = 0;
var expectCalls = function(count, f) {
	testsMissing += count;
	return function() {
		console.log(arguments)
		f.apply(null, arguments);
		testsMissing--;
		assert(count-- >= 0);
	}
};
var expectCall = function(f) {
	return expectCalls(1, f);
};

hub.on('test1', expectCall(function(channel, msg) {
	assert(msg === 'ok1');
}));
hub.on('*:test2', expectCall(function(channel, msg) {
	assert(msg === 'ok2');
}));
hub.on('test3:*', expectCall(function(channel, msg) {
	assert(msg === 'ok3');
}));
hub.once('test4', expectCall(function() { }));
hub.on('test5', expectCall(function(channel, msg1, msg2) {
	assert(msg1 === 'ok5a');
	assert(msg2 === 'ok5b');
}));
hub.on('test6', expectCall(function(channel, json) {
	assert(json.msg === 'ok6');
}));
hub.on('test7', expectCall(function(channel, msg) {
	assert(channel === 'test7');
}));
hub.on('test8:*', expectCall(function(channel, msg) {
	assert(channel === 'test8:foo');
}));
hub.on('testscope', expectCall(function(channel, msg) {
	assert(msg === 'testscope1');
}));
hubScope.on('testscope', expectCall(function(channel, msg) {
	assert(msg === 'testscope2');
}));
hubNoScope.on('test9:*', expectCall(function(channel, msg) {
	assert(channel === 'test9:foo');
	assert(msg === 'ok9');
}));
hub.on('test10same', expectCall(function() { }));
hub.on('test10same', expectCall(function() { }));
hubNoScope.on('*', expectCalls(14, function() { }));
hub.on('anerror', expectCall(function() {
	throw new Error('an error');
}));

process.once('uncaughtException', function(err) {
	assert(err.message === 'an error');
});

setTimeout(function() {
	hub.emit('test1', 'ok1');
	hub.emit('foo:test2', 'ok2');
	hub.emit('test3:foo', 'ok3');
	hub.emit('test4', 'ok4');
	hub.emit('test4', 'ok4');
	hub.emit('test4', 'ok4');
	hub.emit('test5', 'ok5a', 'ok5b')
	hub.emit('test6', {msg:'ok6'});
	hub.emit('test7', 'ok7');
	hub.emit('test8:foo', 'ok8');
	hub.emit('testscope', 'testscope1');
	hubScope.emit('testscope', 'testscope2');
	hubNoScope.emit('test9:foo', 'ok9');
	hub.emit('test10same');
	hub.emit('anerror');
}, 500);

setTimeout(function() {
	assert(!testsMissing);
	hub.close();
	hubScope.close();
	hubNoScope.close();
}, 2000);

setTimeout(function() {
	// Check to see if .close() works
	process.exit(1);
}, 5000).unref();
