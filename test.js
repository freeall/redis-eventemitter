var redis = require('./index');
var assert = require('assert');

var hub = redis();
var hubScope = redis({
	scope: 'tests'
});

var tests = 0;

hub.on('test1', function(channel, msg) {
	assert(msg === 'ok1');
	tests++;
});
hub.on('*:test2', function(channel, msg) {
	assert(msg === 'ok2');
	tests++;
});
hub.on('test3:*', function(channel, msg) {
	assert(msg === 'ok3');
	tests++;
});
hub.once('test4', function() {
	tests++;
});
hub.on('test5', function(channel, msg1, msg2) {
	assert(msg1 === 'ok5a');
	assert(msg2 === 'ok5b');
	tests++;
});
hub.on('test6', function(channel, json) {
	assert(json.msg === 'ok6');
	tests++;
});
hub.on('test7', function(channel, msg) {
	assert(channel === 'test7');
	tests++;
});
hub.on('test8:*', function(channel, msg) {
	assert(channel === 'test8:foo');
	tests++;
});
hub.on('testscope', function(channel, msg) {
	assert(msg === 'testscope1');
	tests++;
});
hubScope.on('testscope', function(channel, msg) {
	assert(msg === 'testscope2');
	tests++;
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
}, 500);

setTimeout(function() {
	assert(tests === 10);
	hub.close();
	hubScope.close();
}, 2000);

setTimeout(function() {
	// Check to see if .close() works
	process.exit(1);
}, 5000).unref();
