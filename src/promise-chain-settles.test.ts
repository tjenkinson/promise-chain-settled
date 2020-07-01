import { wrap } from './promise-chain-settled';

const wait = () => new Promise((resolve) => setTimeout(() => resolve(), 0));

describe('wrap()', () => {
  it('returns false from isChainSettled() when it is not', async () => {
    const promise = new Promise(() => {});
    const wrapped = wrap(promise);
    await wait();
    expect(wrapped.isChainSettled()).toBe(false);
  });

  it('returns true from isChainSettled() when it is', async () => {
    const promise = Promise.resolve();
    const wrapped = wrap(promise);
    await wait();
    expect(wrapped.isChainSettled()).toBe(true);
  });

  it('resolves whenChainSettled() when chain is next settled', async (done) => {
    let settled = false;
    const promise = new Promise(async (resolve) => {
      try {
        await wait();
        expect(settled).toBe(false);
        resolve();
        await wait();
        expect(settled).toBe(true);
        done();
      } catch (e) {
        done.fail(e);
      }
    });
    const wrapped = wrap(promise);
    await wrapped.whenChainSettled();
    settled = true;
  });

  it('resolves whenChainSettled() when chain is next settled second time', async (done) => {
    let settledAgain = false;
    const promise = Promise.resolve();
    const wrapped = wrap(promise);
    (async () => {
      await wait();
      promise.then(() => {
        return new Promise(async (resolve) => {
          try {
            await wait();
            expect(settledAgain).toBe(false);
            resolve();
            await wait();
            expect(settledAgain).toBe(true);
            done();
          } catch (e) {
            done.fail(e);
          }
        });
      });
    })();
    await wrapped.whenChainSettled();
    await wrapped.whenChainSettled();
    settledAgain = true;
  });

  it('handles an already resolved promise', async () => {
    const promise = Promise.resolve();
    const wrapped = wrap(promise);
    const onChange = jest.fn();
    wrapped.onChange(onChange);
    expect(wrapped.numPending()).toBe(1);
    await wait();
    expect(onChange).toBeCalledTimes(1);
    expect(wrapped.numPending()).toBe(0);
  });

  it('handles an already rejected promise', async () => {
    const promise = Promise.reject();
    const wrapped = wrap(promise);
    const onChange = jest.fn();
    wrapped.onChange(onChange);
    expect(wrapped.numPending()).toBe(1);
    await wait();
    expect(onChange).toBeCalledTimes(1);
    expect(wrapped.numPending()).toBe(0);
  });

  it('handles a pending promise', async (done) => {
    const promise = new Promise(async (resolve) => {
      try {
        await wait();
        expect(onChange).toBeCalledTimes(0);
        expect(wrapped.numPending()).toBe(1);
        resolve();
        await wait();
        expect(onChange).toBeCalledTimes(1);
        expect(wrapped.numPending()).toBe(0);
        done();
      } catch (e) {
        done.fail(e);
      }
    });
    const wrapped = wrap(promise);
    const onChange = jest.fn();
    wrapped.onChange(onChange);
  });

  it('handles a promise chain', async (done) => {
    const promise = Promise.resolve();
    const wrapped = wrap(promise);
    const onChange = jest.fn();
    wrapped.onChange(onChange);
    promise.then(() => {
      return new Promise(async (resolve) => {
        try {
          expect(onChange).toBeCalledTimes(2);
          expect(wrapped.numPending()).toBe(1);
          await wait();
          expect(onChange).toBeCalledTimes(2);
          expect(wrapped.numPending()).toBe(1);
          resolve();
          await wait();
          expect(onChange).toBeCalledTimes(3);
          expect(wrapped.numPending()).toBe(0);
          done();
        } catch (e) {
          done.fail(e);
        }
      });
    });
  });

  it('handles a long promise chain', async (done) => {
    const promise = Promise.resolve();
    const wrapped = wrap(promise);
    const onChange = jest.fn();
    wrapped.onChange(onChange);
    (promise
      .then(() => {
        try {
          expect(wrapped.numPending()).toBe(3);
        } catch (e) {
          done.fail(e);
        }
        return Promise.reject();
      })
      .catch(() => {
        try {
          expect(wrapped.numPending()).toBe(2);
        } catch (e) {
          done.fail(e);
        }
      }) as any).finally(() => {
      return new Promise(async (resolve) => {
        try {
          await wait();
          expect(wrapped.numPending()).toBe(1);
          resolve();
          await wait();
          expect(wrapped.numPending()).toBe(0);
          done();
        } catch (e) {
          done.fail(e);
        }
      });
    });
  });

  it('removes an onChange listener on remove() call', async () => {
    const promise = Promise.resolve();
    const wrapped = wrap(promise);
    const onChange = jest.fn();
    const { remove } = wrapped.onChange(onChange);
    await wait();
    expect(onChange).toHaveBeenCalledTimes(1);
    remove();
    promise.then(() => Promise.resolve());
    await wait();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
