# redis-eventemitter

Use redis as pubsub using a simple eventemitter.

Uses an optional `scope` property which can be used as a namespace.

If `scope` set to `false`, then you can listen to all events, e.g., `pubsub = redis({scope:false}); pubsub.on('production:*', ...)`

## Usage

```js
var redis = require('redis-eventemitter');

var pubsub = redis({port:6379, host:'localhost', scope:'production'});
pubsub.on('*:newuser', function(channel, user) {
	console.log('New user', user);
});
pubsub.emit('myservice:newuser', { id:'a1b2c3', email:'foo@example.com' });
```

## API

### .emit(channel, messages...) [publish]

``` js
var redis = require('redis-eventemitter');

var pubsub = redis({port:6379, host:'localhost', scope:'production'});
pubsub.emit('myservice:newuser', { id:'a1b2c3' });
```

### .on(pattern, function(channel, messages...) { ... }) [subscribe]

``` js
var redis = require('redis-eventemitter');

var pubsub = redis({port:6379, host:'localhost', scope:'production'});
pubsub.on('*:newuser', function(channel, message) {
	console.log(channel); // myservice:newuser
	console.log(message); // { id:'a1b2c3' }
});
```

### .on('error', function(err) { ... }) [error handling]

To be able to handle errors (like when the redis server is down) `.on('error', ...)` should be used.

Note that this means that you can't listen for messages on the `error` channel.

### .removeListener(pattern, listener)

Removes listener.

### .removeAllListeners(pattern)

Removes all listeners.
