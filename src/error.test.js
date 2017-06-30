
const { assert } = require('chai')
const ValidationError = require('./error')

describe('makeError()', () => {
    it('works with a string message', () => {
        const e = new ValidationError('oops')
        assert(e instanceof ValidationError)
        assert(e.message === 'oops')
        assert(e.toString() === 'ValidationError: oops')
        assert(e.stack.startsWith(e.toString() + '\n'))
    })

    it('works with a functional message', () => {
        let e = new ValidationError(name => 'Some ' + name + ' is invalid')
        assert(e.message === 'Some value is invalid')

        e = e.pushProp('users')
        assert(e.message === 'Some value at `users` is invalid')

        e = e.pushProp(123)
        assert.deepEqual(e.path, [123, 'users'])
        assert(e.message === 'Some value at `123.users` is invalid')
        assert(e.toString() === 'ValidationError: Some value at `123.users` is invalid')
        assert(e.stack.startsWith(e.toString() + '\n'))
    })

    it('works without Error.captureStackTrace', () => {
        const cst = Error.captureStackTrace
        Error.captureStackTrace = undefined

        const stack = (new ValidationError('hey')).stack.split('\n')
        assert(stack[0] === 'Error: hey')
        assert(stack.length > 3)

        Error.captureStackTrace = cst
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
        const someError = new ValidationError(
            name => 'The ' + name + ' is invalid'
        )

        let e
        try {
            ValidationError.catchAndPushProp(
                () => { throw someError },
                'prop'
            )
        } catch (error) {
            e = error
        }

        assert(e !== someError)
        assert.deepEqual(e.path, ['prop'])
        assert(e.message === 'The value at `prop` is invalid')
    })
})
