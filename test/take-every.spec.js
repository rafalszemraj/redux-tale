import { createStore, applyMiddleware } from 'redux';
import mockPromiseHelper from './mocks/mock-promise-helper';
import createSagaMiddleware from '../src';
import { takeEvery } from '../src/effects';

describe('take-every', () => {

    mockPromiseHelper.use();

    let sagaMiddleware;
    let store;
    let newState;
    let onerror;

    beforeEach(() => {
        sagaMiddleware = createSagaMiddleware();
        newState = {};
        store = createStore(
            () => newState,
            applyMiddleware(sagaMiddleware)
        );
        onerror = jest.fn();
        window.onerror = onerror;
    });

    afterEach(() => {
        window.onerror = null;
    });

    it('gets an action first argument', () => {
        const order = [];

        function *every(action) {
            order.push(action);
        }

        sagaMiddleware.run(takeEvery(1, every));
        const action = {
            type: 1,
            extra: true,
        };
        store.dispatch(action);
        expect(order).toEqual([action]);
        expect(onerror).not.toHaveBeenCalled();
    });

    it('works resolving at end', () => {
        const order = [];

        function *every(action, ...args) {
            yield Promise.resolve();
            order.push(args);
        }

        sagaMiddleware.run(takeEvery(1, every, 2, 3));
        store.dispatch({
            type: 1,
        });
        store.dispatch({
            type: 2,
        });
        store.dispatch({
            type: 1,
        });
        mockPromiseHelper.tick();
        expect(order).toEqual([[2, 3], [2, 3]]);
        expect(onerror).not.toHaveBeenCalled();
    });

    it('works resolving as it goes', () => {
        const order = [];

        function *every(action, ...args) {
            yield Promise.resolve();
            order.push(args);
        }

        sagaMiddleware.run(takeEvery(1, every, 2, 3));
        store.dispatch({
            type: 1,
        });
        store.dispatch({
            type: 2,
        });
        mockPromiseHelper.tick();
        store.dispatch({
            type: 1,
        });
        mockPromiseHelper.tick();
        expect(order).toEqual([[2, 3], [2, 3]]);
        expect(onerror).not.toHaveBeenCalled();
    });

    it('works sync', () => {
        const order = [];

        function *every(action, ...args) {
            order.push(args);
        }

        sagaMiddleware.run(takeEvery(1, every, 2, 3));
        store.dispatch({
            type: 1,
        });
        store.dispatch({
            type: 2,
        });
        store.dispatch({
            type: 1,
        });
        expect(order).toEqual([[2, 3], [2, 3]]);
        expect(onerror).not.toHaveBeenCalled();
    });

    it('fires exceptions on window', () => {

        const exception = new Error();
        function *every() {
            throw exception;
        }

        sagaMiddleware.run(takeEvery('*', every));
        store.dispatch({
            type: 1,
        });
        store.dispatch({
            type: 2,
        });
        expect(onerror).toHaveBeenCalledTimes(0);
        jest.runAllTimers();
        expect(onerror).toHaveBeenCalledTimes(2);
    });
});
