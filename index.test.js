
const { assert } = require('chai')
const V = require('.')

describe('validate()', () => {
    it('requires values by default', () => {
        assert.throws(
            () => V(undefined),
            'Required value, got `undefined`'
        )

        assert.throws(
            () => V(null),
            'Required value, got `null`'
        )

        assert.throws(
            () => V.string(null),
            'Required value, got `null`'
        )
    })

    it('works with custom assertions', () => {
        assert(V.assert(v => v === 123)(123) === 123)

        assert.throws(
            () => V.assert(v => v === 123)(12),
            'Assertion failure, the value was `12`'
        )
    })

    it('accepts undefined values when they are explicitly allowed', () => {
        assert(V.optional(undefined) === undefined)
        assert(V.optional(null) === null)
        assert(V.optional.string(null) === null)
        assert(V.optional.string('hello') === 'hello')
        assert(V.string.optional(undefined) === undefined)
        assert(V.string.optional('hello') === 'hello')

        assert(V.string.max(3).optional('') === '')
        assert(V.string.optional.max(3)('') === '')
        assert(V.optional.string.max(3)('') === '')

        assert(V.string.max(3).optional(null) === null)
        assert(V.string.optional.max(3)(null) === null)
        assert(V.optional.string.max(3)(null) === null)
    })

    it('allows any value by default', () => {
        assert(V(123) === 123)
        assert(V('hello') === 'hello')
        assert(V(0) === 0)
        assert(V('') === '')

        const someObject = {}
        assert(V(someObject) === someObject)
    })

    it('requires strings', () => {
        assert(V.string('hello') === 'hello')

        assert.throws(
            () => V.string(123),
            'The value must be a `string`, got a `number`'
        )

        assert.throws(
            () => V.string.lower(123),
            'The value must be a `string`, got a `number`'
        )
    })

    it('restricts the length of a string', () => {
        assert.throws(
            () => V.string.min(3).optional('12')
        )
        assert(V.string.min(3).optional('hello') === 'hello')
        assert(V.string.min(3).optional('123') === '123')

        assert.throws(
            () => V.string.max(3).optional('abcd')
        )
        assert(V.string.max(3).optional('abc') === 'abc')
        assert(V.string.max(3).optional('') === '')
    })

    it('trims strings', () => {
        assert(V.string.toTrimmed('\t\n\rhey ') === 'hey')
    })

    it('requires strings to be trimmed', () => {
        assert(V.string.trimmed('hey') === 'hey')

        assert.throw(
            () => V.string.trimmed('\t\n\rhey '),
            'Assertion failure, the value was `\t\n\rhey `'
        )
    })

    it('converts case', () => {
        assert(V.string.toLower('TeST') === 'test')
        assert(V.string.toUpper.toLower('TeST') === 'test')

        assert(V.string.toUpper('TeST') === 'TEST')
        assert(V.string.toLower.toUpper('TeST') === 'TEST')
    })

    it('restricts case', () => {
        assert(V.string.upper('TEST') === 'TEST')
        assert.throw(
            () => V.string.upper('TeST'),
            'Assertion failure, the value was `TeST`'
        )

        assert(V.string.lower('test') === 'test')
        assert.throw(
            () => V.string.lower('tesT'),
            'Assertion failure, the value was `tesT`'
        )
    })

    it('validates email addresses', () => {
        assert(V.string.email('john@example.com'))
        assert(V.email('john@example.com'))

        assert.throws(
            () => V.email('bad'),
            'Assertion failure, the value was `bad`'
        )
    })

    it('works with custom regexp', () => {
        assert(V.string.regexp(/hello/)('hello'))
        assert(V.regexp(/hello/)('hello'))

        assert.throws(
            () => V.regexp(/hello/)('bad'),
            'Assertion failure, the value was `bad`'
        )
    })

    it('allows to ensure that every character match a predicate', () => {
        const onlyAs = V.string.assertEveryChar(c => c === 'a')

        assert(('') === '')
        assert(onlyAs('aaa') === 'aaa')
        assert.throws(
            () => onlyAs('aab')
        )
        assert.throws(
            () => onlyAs('b')
        )
    })

    it('requires numbers', () => {
        assert(V.number(123) === 123)

        assert.throws(
            () => V.number(''),
            'The value must be a `number`, got a `string`'
        )
    })

    it('rejects `NaN`', () => {
        assert.throw(
            () => V.number(NaN),
            'Assertion failure, the value was `NaN`'
        )
    })

    it('rejects +inf and -inf by default', () => {
        assert.throw(
            () => V.number(Infinity),
            'The value must be finite'
        )

        assert.throw(
            () => V.number(-Infinity),
            'The value must be finite'
        )

        assert(V.number.allowInfinity(Infinity) === Infinity)
        assert(V.number.allowInfinity(-Infinity) === -Infinity)
    })

    // TODO: Infinity

    it('requires integer numbers', () => {
        assert(V.integer(123) === 123)
        assert(V.number.integer(123) === 123)

        assert.throws(
            () => V.integer(12.3)
        )

        assert.throws(
            () => V.number.integer(12.3)
        )
    })

    it('allows to restrict number ranges', () => {
        assert(V.number.min(2)(2) === 2)
        assert(V.number.max(2)(2) === 2)

        assert.throws(
            () => V.number.min(2)(1.9)
        )

        assert.throws(
            () => V.number.max(2)(2.1)
        )

        assert(V.number.positive(1))
        assert(V.number.negative(-1))

        assert.throws(
            () => V.number.positive(0)
        )

        assert.throws(
            () => V.number.positive(-1)
        )

        assert.throws(
            () => V.number.negative(0)
        )

        assert.throws(
            () => V.number.negative(1)
        )
    })

    it('requires functions', () => {
        const someFunc = () => {}

        assert(V.func(someFunc) === someFunc)

        assert.throws(
            () => V.func(''),
            'The value must be a `function`, got a `string`'
        )
    })

    it('shapes objects', () => {
        assert.deepEqual(
            V.shape({
                name: V.string,
            })({
                name: 'john',
            }),

            {
                name: 'john',
            }
        )

        assert.throws(
            () => V.shape({
                name: V.string,
            })(123),
            'The value must be a `object`, got a `number`'
        )

        assert.throws(
            () => V.shape({
                name: V.string,
            })({}),
            'Required value at `name`, got `undefined`'
        )

        assert.throws(
            () => V.shape({
                name: V.string,
            })({
                name: 123
            }),
            'The value at `name` must be a `string`, got a `number`'
        )
    })

    it('allows to access fields inside shapes', () => {
        const schema = {
            name: V.string,
        }

        const User = V.shape(schema)

        assert.deepEqual(
            User.shape(),
            schema
        )

        assert(schema.name === User.shape().name)
    })

    it('throws when a shape is invalid', () => {
        assert.throws(
            () => V.shape({
                name: 'bad',
            })({
            })
        )

        assert.throws(
            () => V.shape({}).shape({}),
            'Already shaped'
        )

        assert.throws(
            () => V.object.unshape,
            'Already unshaped'
        )
    })

    it('strips unknown props from shaped objects', () => {
        assert.deepEqual(
            V.shape({
                name: V.string,
            })({
                name: 'hello',
                unknownProp: 'value',
            }),

            {
                name: 'hello',
            }
        )
    })

    it('can be unshaped once shaped', () => {
        assert.deepEqual(
            V.shape({}).unshape({
                name: 'value'
            }),
            {
                name: 'value',
            }
        )

        assert.deepEqual(
            V.shape({ some: 'value' }).unshape.shape(),
            {}
        )
    })

    it('allows to cherry-pick properties for shaped objects', () => {
        assert.deepEqual(
            V.shape({
                name: V.string,
                age: V.number,
            }).pick('age')({
                age: 34,
            }),

            {
                age: 34,
            }
        )
    })

    it('allows to mark shaped children as required', () => {
        assert.throws(
            () => V.shape({
                name: V.string.optional,
            }).requiredChildren({}),

            'Required value at `name`, got `undefined`'
        )

        assert.deepEqual(
            V.shape({
                name: V.string.optional,
            }).unshape.requiredChildren({
                name: 'hey',
            }),

            {
                name: 'hey',
            }
        )
    })

    it('allows to mark shaped children as optional', () => {
        assert.deepEqual(
            V.shape({
                name: V.string,
            }).optionalChildren({}),

            {}
        )
    })

    it('allows to validate against an exact value', () => {
        const o = {}

        assert(V.exactly(o)(o) === o)

        assert.throws(
            () => V.exactly(o)({}),
            'Assertion failure, the value was `[object Object]`'
        )
    })

    describe('oneOf', () => {
        it('works with plain strings and numbers', () => {
            assert(V.oneOf(1, 2, 3)(1) === 1)
            assert(V.oneOf(1, 2, 3)(2) === 2)
            assert(V.oneOf(1, 2, 3)(3) === 3)
            assert.throws(
                () => V.oneOf(1, 2, 3)(4),
                'Assertion failure, the value was `4`'
            )

            assert(V.oneOf([1, 2, 3])(1) === 1)
            assert(V.oneOf([1, 2, 3])(3) === 3)
            assert.throws(
                () => V.oneOf([1, 2, 3])(0),
                'Assertion failure, the value was `0`'
            )

            assert(V.oneOf(['red', 'green', 'blue'])('red') === 'red')
            assert(V.oneOf('red', 'green', 'blue')('blue') === 'blue')
            assert.throws(
                () => V.oneOf('red', 'green', 'blue')('grey'),
                'Assertion failure, the value was `grey`'
            )

            assert.throws(
                () => V.oneOf()('grey'),
                "The value doesn't match"
            )
        })

        it('works with subvalidators', () => {
            assert(
                V.oneOf(
                    V.string,
                    V.number
                )(123) === 123
            )

            assert(
                V.oneOf(
                    V.string,
                    V.number
                )('hello') === 'hello'
            )

            assert.throw(
                () => V.oneOf(
                    V.string,
                    V.number
                )(/bad/),
                'The value must be a `number`, got a `regexp`'
            )
        })

        it('matches the first possible choice', () => {
            assert(
                V.oneOf(
                    V.string.toUpper,
                    V.string.toLower
                )('hEY') === 'HEY'
            )

            assert(
                V.oneOf(
                    V.string.toLower,
                    V.string.toUpper
                )('hEY') === 'hey'
            )
        })
    })

    describe('array.of', () => {
        it('works', () => {
            assert.deepEqual(
                V.array.of(V.number)([]),
                []
            )

            assert.deepEqual(
                V.array.of(V.number)([1, 2, 3]),
                [1, 2, 3]
            )

            assert.deepEqual(
                V.array.of(V.string.toTrimmed)([' not trimmed  ']),
                ['not trimmed']
            )

            assert.throws(
                () => V.array.of(V.number)([1, 2, 'hey']),
                'The value at `2` must be a `number`, got a `string`'
            )
        })

        it('throws by default with undefined values', () => {
            assert.throws(
                () => V.array.of(V.number)([1, 2, null]),
                'Required value at `2`, got `null`'
            )

            assert.throws(
                () => V.array.of(V.number)([1, 2, undefined]),
                'Required value at `2`, got `undefined`'
            )
        })
    })

    it('allows to restrict the length of an array', () => {
        const mustContain3Or4Items = V.array.min(3).max(4)

        assert.deepEqual(
            mustContain3Or4Items([1, 2, 3]),
            [1, 2, 3]
        )

        assert.deepEqual(
            mustContain3Or4Items([1, 2, 3, 4]),
            [1, 2, 3, 4]
        )

        assert.throws(
            () => mustContain3Or4Items([1, 2])
        )

        assert.throws(
            () => mustContain3Or4Items([1, 2, 3, 4, 5])
        )
    })

    describe('object.of', () => {
        it('works', () => {
            assert.deepEqual(
                V.object.of(V.string)({}),
                {}
            )

            assert.deepEqual(
                V.object.of(V.string.toTrimmed)({
                    name: '  john ',
                }),
                {
                    name: 'john',
                }
            )

            assert.throws(
                () => V.object.of(V.string)({
                    name: 'john',
                    phone: 123
                }),
                'The value at `phone` must be a `string`, got a `number`'
            )
        })

        it('throws by default with undefined values', () => {
            assert.throws(
                () => V.object.of(V.string)({
                    name: undefined,
                }),
                'Required value at `name`, got `undefined`'
            )

            assert.throws(
                () => V.object.of(V.string)({
                    name: null,
                }),
                'Required value at `name`, got `null`'
            )

            assert.deepEqual(
                V.object.of(V.string.optional)({
                    name: null,
                }),
                {
                    name: null,
                }
            )

            assert.deepEqual(
                V.object.of(V.string.optional)({
                    name: undefined,
                }),
                {
                    name: undefined,
                }
            )
        })
    })

    it('throws pretty errors with nested objects and arrays', () => {
        try {
            V.shape({
                users: V.array.of(V.shape({
                    books: V.array.of(V.string),
                })),
            })({
                users: [
                    {
                        books: [
                            'taocp',
                        ],
                    },

                    {
                        books: [
                            123,
                        ],
                    },
                ],
            })
        } catch (e) {
            assert(e instanceof V.ValidationError)
            assert(e.message === 'The value at `users.1.books.0` must ' +
                                 'be a `string`, got a `number`')
            assert(e.toString() === 'Error: ' + e.message)
            assert(e.stack.startsWith(e.toString()))
        }

    })
})

require('./util.test')
require('./error.test')
