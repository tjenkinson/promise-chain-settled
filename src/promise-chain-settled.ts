import { deferException } from './defer-exception';

export type Wrapped = {
  onChange(listener: () => void): { remove: () => void };
  numPending(): number;
  isChainSettled(): boolean;
  whenChainSettled(): Promise<void>;
};

export function wrap<T>(promise: Promise<T>): Wrapped {
  const onChangeListeners: Array<() => void> = [];
  const onSettledListeners: Array<() => void> = [];
  const originalThen = promise.then;
  let pendingSettles = 0;
  const wrappedReturnedPromises: Array<Wrapped> = [];

  function update(): void {
    if (isChainSettled()) {
      onSettledListeners
        .splice(0, onSettledListeners.length)
        .forEach((listener) => listener());
    }
    onChangeListeners.slice().forEach((listener) => {
      deferException(() => listener());
    });
  }

  const onSettle = () => {
    pendingSettles--;
    update();
  };

  const onNew = () => {
    pendingSettles++;
    update();
  };

  onNew();
  promise.then(onSettle, onSettle);

  promise.then = ((onFulfilled, onRejected) => {
    const returnPromise = originalThen.call(promise, onFulfilled, onRejected);
    const wrappedReturnedPromise = wrap(returnPromise);
    wrappedReturnedPromises.push(wrappedReturnedPromise);
    wrappedReturnedPromise.onChange(() => update());
    update();
    return returnPromise;
  }) as Promise<T>['then'];

  function onChange(listener: () => void) {
    onChangeListeners.push(listener);
    let removed = false;
    return {
      remove: () => {
        if (!removed) {
          removed = true;
          onChangeListeners.splice(onChangeListeners.indexOf(listener), 1);
        }
      },
    };
  }

  function numPending(): number {
    return (
      pendingSettles +
      wrappedReturnedPromises.reduce((acc, a) => acc + a.numPending(), 0)
    );
  }

  function isChainSettled(): boolean {
    return numPending() === 0;
  }

  function whenChainSettled(): Promise<void> {
    return new Promise((resolve) => {
      onSettledListeners.push(() => resolve());
    });
  }

  return {
    onChange,
    numPending,
    isChainSettled,
    whenChainSettled,
  };
}
