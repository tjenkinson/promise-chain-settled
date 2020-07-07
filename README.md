[![npm version](https://badge.fury.io/js/promise-chain-settled.svg)](https://badge.fury.io/js/promise-chain-settled)

# promise-chain-settled

Provides a way of knowing when a promise chain is settled. Useful for testing.

## Installation

```sh
npm install --save promise-chain-settled
```

or available on JSDelivr at "https://cdn.jsdelivr.net/npm/promise-chain-settled@1".

## API

First you need to wrap the promise with `wrap(promise)`.

This returns an object with the following properties:

### numPending(): number

This returns the number of promises in the chain that are currently pending. It can increase at any time if new items are added.

```ts
const promise = new Promise(() => {});
const wrapped = wrap(promise);
console.log(wrapped.numPending()); // 1
promise.then(() => {});
console.log(wrapped.numPending()); // 2
```

### isChainSettled(): boolean

Returns `true` when `numPending() === 0` meaning everything in the chain is settled. This can change at any time if new items are added.

```ts
const promise = Promise.resolve();
const wrapped = wrap(promise);
console.log(wrapped.isChainSettled()); // false
await promise;
console.log(wrapped.isChainSettled()); // true
promise.then(() => {});
console.log(wrapped.isChainSettled()); // false
```

### whenChainSettled(): Promise<void>

This returns a promise that resolves the next time `isChainSettled()` goes from `false` to `true`.

### onChange(listener: () => void): { remove: () => void }

This lets you add a listener that will be invoked whenever `numPending()` changes.

```ts
const promise = Promise.resolve();
const wrapped = wrap(promise);
wrapped.onChange(() => {
  // first call: new numPending() 2
  // second call: new numPending() 1
  // third call: new numPending() 0
  console.log('new numPending()', wrapped.numPending());
});
promise.then(() => {});
```

## Example

```ts
import { wrap } from 'promise-chain-settled';

const promise = Promise.resolve();

// modify the promise so that we can keep track of everything in the chain
const wrapped = wrap(promise);

promise
  .then(() => {
    return somethingAsync();
  })
  .then(() => {
    return somethingElseAsync();
  })
  .then((something) => {
    console.log('Done');
  });

wrapped.whenChainSettled().then(() => {
  console.log('Chain settled');
});
```

would log

```
Done
Chain settled
```
