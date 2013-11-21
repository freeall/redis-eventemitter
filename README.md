# redis-eventemitter

Use redis as pubsub using a simple eventemitter.

## API

### .emit(channel, messages...) [publish]

``` js
var pubsub = require('redis-eventemitter')(6379, 'localhost', options);
pubsub.emit('myservice:newuser', { id:'a1b2c3' });
```

### .on(pattern, function(channel, messages...) { ... }) [subscribe]

``` js
var pubsub = require('redis-eventemitter')(6379, 'localhost', options);
pubsub.on('*:newuser', function(channel, message) {
	console.log(channel); // myservice:newuser
	console.log(message); // { id:'a1b2c3' }
});
```

### .removeListener(pattern, listener)

Removes listener.

### .removeAllListeners(pattern)

Removes all listeners.