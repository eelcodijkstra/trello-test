## Notes on promises

Current browser implementations support the concept of *promises*, like it is proposed for the new version of Javascript. (Almost all browsers support this natively; for a few other browsers, a simple polyfill is available.)

The main reason for the introduction of this concept is that is simplified asynchronous programming. Asynchronous programming plays an important role in Javascript. It is the standard way of the interaction with the unpredictable outside, especially web servers, databases, and users.

The standard way of asynchronous programming is to use a callback function. For example, for an AJAX request:

```js
ajax.get(url, success, failure);
```

where `success` and `failure` both are callback-functions that will be called when the interaction with the server has completed - succesfully or erroneously.

For a single request, this approach is acceptable. But when we need a *composition* of such requests, this method becomes quite cumbersome. Consider for example the following:

* get a trello board
* then, get the lists of the trello board
* then, display the trello board and its lists

Or, a step further: repeat this for all trello boards of a user.

> I don't know of an easy method to iterate over all lists, and then perform a next action. I expect that this requires a recursive callback.


## Empty promises and singletons

The template for a singleton promise is:

```js
var promise = new Promise(function(resolve, reject) {
  // do a thing, possibly async, then…

  if (/* everything turned out fine */) {
    resolve("Stuff worked!");
  }
  else {
    reject(Error("It broke"));
  }
});
```

In this way, we convert a *function with callbacks* (`resolve`, `reject`) into a promise.

Example:

```
function get(url) {
  return new Promise(function (resolve, reject) {
    ajax.get(url, resolve, reject);
  });
})
```

We can now use this to make simple promises:

### synchronous promise

(This is just for demonstration purposes.)



## Chaining (composition)

There are several kinds of composition:

* sequencing
    * this may also be used for iteration: dynamically construct a sequence 
* parallelism (array of promises)

Sequencing: `p0.then(p1)` - where `p0` and `p1` are promises.
Or, `p0.then(t1)` - where `p0` is a promise, and `t1` is a transformer.

Parallelism: `p0.all(pa1)` - where `pa1` is an array of promises. The result is a promise that "finishes" (fulfills) when all elements of `pa1` are finished. (It *rejects* as soon as one the elements *rejects*.)

See: [Promises API summary](http://www.html5rocks.com/en/tutorials/es6/promises/#toc-api)

### Chaining simple functions (transformers)

A simple (constant) value promise:

```js
function promiseValue(val) {
  return new Promise(function (resolve, reject) {
    resolve(val);
  });
}
```

(This function can also be used as a null transformation in a chain.)

A transformer is a function with a single argument and a single result. For example:

```js
function double(x) {
  console.log(x);
  return x + x;
}
```

We can use such functions directly in the chain:

```
promise("abc").then(double).then(double).then(function (x) {
  console.log(x);
});
```
  
### Chaining asynchronous functions

We can transform an asynchronous function, e.g. `get`,  into a promise:

```js
function promiseGet(url) {
  return new Promise(function (resolve, reject) {
    get(url, resolve, reject);
  });
}
```

### Communication of values

In a sequence of operations, we usually want some information of the preceding step(s) to use in the current step. For this, we have the following solutions:

* use global variables. 
* use parameters.


### Iteration

A special problem with asynchrounous programming is iteration. E.g., we want to do a number of http requests, say for all lists of a trello board. And after this has been completed, we may want to continue with other actions.

One solution is to build a sequence of promises.

```js
var sequence = Promise.resolve;   // zero-element

myBoard.lists.forEach(function (list) {
  sequence = sequence.then(function (){
    return promiseGet(list.url).then(function(listData) {
      myBoard.lists[list.pos] = listData;
    });
  })
});
```

> Wat doen we met het resultaat van de get? In het normale geval gebruiken we de function
`resolve` om dit resultaat te verwerken.

We may now add an action at the end:

```js
sequence = sequence.then(function () {
  
});

```

#### Parallelism

Browsers and servers are very good at handling a set of requests in parallel. 