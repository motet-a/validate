
const { assert } = require('chai')
const { makeError, ValidationError } = require('./error')

describe('makeError()', () => {
    it('works with a string message', () => {
        const e = makeError('oops')
        assert(e instanceof ValidationError)
        assert(e.message === 'oops')
        assert(e.toString() === 'Error: oops')
        assert(e.stack.startsWith(e.toString() + '\n'))
    })

    it('works with a functional message', () => {
        const e = makeError(name => 'Some ' + name + ' is invalid')
        assert(e.message === 'Some value is invalid')
        e.pushProp('users')
        assert(e.message === 'Some value at `users` is invalid')
        e.pushProp(123)
        assert.deepEqual(e.path, [123, 'users'])
        assert(e.message === 'Some value at `123.users` is invalid')
        assert(e.toString() === 'Error: Some value at `123.users` is invalid')
        assert(e.stack.startsWith(e.toString() + '\n'))
    })
})

describe('ValidationError.catchAndPushProp', () => {
    it('works when nothing is thrown', () => {
        assert(ValidationError.catchAndPushProp(
            () => 123,
            'prop'
        ) === 123)
    })

    it('lets pass other errors', () => {
        const e = new Error('bad')

        assert.throws(
            () => ValidationError.catchAndPushProp(
                () => { throw e },
                'prop'
            ),
            e
        )

        assert(e.path === undefined)
    })

    it('catches and rethrows ValidationErrors', () => {
        const e = makeError(name => 'The ' + name + ' is invalid')

        assert.throws(
            () => ValidationError.catchAndPushProp(
                () => { throw e },
                'prop'
            ),
            e
        )

        assert.deepEqual(e.path, ['prop'])
        assert(e.message === 'The value at `prop` is invalid')
    })
})
