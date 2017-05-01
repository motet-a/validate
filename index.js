
const _ = require('lodash')
const assert = require('assert')

const { getType, getPreciseType, mapValues, pickBy } = require('./util')
const { ValidationError, makeError } = require('./error')

function makeValidator(Class, ...args) {
    assert(typeof Class === 'function')
    function validator(...args) {
        return validator.validate(...args)
    }

    Reflect.setPrototypeOf(validator, Class.prototype)
    validator._constructor(...args)
    return validator
}

function choicesToValidators(choices) {
    return choices.map(choice => {
        if (choice instanceof Validator) {
            return choice
        }

        return V.exactly(choice)
    })
}

class Validator {
    _constructor(children = [], options = {}) {
        this._options = Object.assign({
            required: true,
        }, options)

        this._children = children
    }

    setOptions(options) {
        const newOptions = Object.assign({}, this._options, options)
        return makeValidator(this.constructor, this._children, newOptions)
    }

    setChildren(children) {
        return makeValidator(this.constructor, children, this._options)
    }

    setClass(Class) {
        return makeValidator(Class, this._children, this._options)
    }

    // Can be removed by `optional`
    get required() {
        return this.setOptions({ required: true })
    }

    // Can be removed by `required`
    get optional() {
        return this.setOptions({ required: false })
    }

    get string() {
        return this.assertType('string').setClass(StringValidator)
    }

    regexp(regexp) {
        return this.string.regexp(regexp)
    }

    get email() {
        return this.string.email
    }

    get number() {
        return this
            .assertType('number')
            .assert(n => !isNaN(n))
            .setClass(NumberValidator)
    }

    get integer() {
        return this.number.integer
    }

    get object() {
        return this.assertType('object').setClass(ObjectValidator)
    }

    get array() {
        return this.assertType('array').setClass(ArrayValidator)
    }

    get func() {
        return this.assertType('function')
    }

    shape(shape) {
        return this.object.shape(shape)
    }

    assert(shouldReturnSomethingTruthy) {
        return this.compose(value => {
            if (!shouldReturnSomethingTruthy(value)) {
                throw makeError(
                    name => 'Assertion failure, the ' + name +
                          ' was `' + value + '`'
                )
            }

            return value
        })
    }

    exactly(expectedValue) {
        return this.assert(v => v === expectedValue)
    }

    oneOf(...choices) {
        if (choices.length === 1 &&
            Array.isArray(choices[0])) {
            choices = choices[0]
        }

        choices = choicesToValidators(choices)

        return this.compose(value => {
            let lastError

            for (const choice of choices) {
                try {
                    return choice(value)
                } catch (error) {
                    lastError = error
                }
            }

            if (lastError) {
                throw lastError
            }

            throw makeError(
                name => 'The ' + name + " doesn't match"
            )
        })
    }

    compose(newFunc) {
        return this.setChildren([
            ...this._children,
            newFunc,
        ])
    }

    assertType(name) {
        return this.compose(v => {
            if (getType(v) !== name) {
                throw makeError(
                    vn => 'The ' + vn + ' must be a `' +
                        name + '`, got a `' + getPreciseType(v) + '`'
                )
            }

            return v
        })
    }

    _validate(value) {
        if (value == null) {
            if (!this._options.required) {
                // Don't run other validators in this case, they could fail.
                return value
            } else {
                throw makeError(
                    name => 'Required ' + name + ', got `' + value + '`'
                )
            }
        }

        return this
            ._children
            .reduce((value, child) => child(value), value)
    }

    // You can use this directly but you can also call the validator
    // like a function
    validate(value) {
        try {
            return this._validate(value)
        } catch (e) {
            if (!(e instanceof ValidationError)) {
                throw e
            }

            const trace =
                (new Error())
                    .stack
                    .split('\n')
                    .slice(2)
                    .join('\n')

            e.stack = e.message + '\n' + trace

            throw e
        }
    }
}

class StringValidator extends Validator {
    max(maxLength) {
        return this.assert(s => s.length <= maxLength)
    }

    min(minLength) {
        return this.assert(s => s.length >= minLength)
    }

    get trimmed() {
        return this.assert(s => s.trim() === s)
    }

    get toTrimmed() {
        return this.compose(s => s.trim())
    }

    get lower() {
        return this.assert(s => s.toLowerCase() === s)
    }

    get upper() {
        return this.assert(s => s.toUpperCase() === s)
    }

    get toLower() {
        return this.compose(s => s.toLowerCase())
    }

    get toUpper() {
        return this.compose(s => s.toUpperCase())
    }

    regexp(regexp) {
        assert(regexp instanceof RegExp)
        return this.assert(s => regexp.exec(s))
    }

    get email() {
        return this.regexp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
    }
}

class NumberValidator extends Validator {
    get integer() {
        return this.assert(n => Number.isSafeInteger(n))
    }

    get positive() {
        return this.assert(n => n > 0)
    }

    get negative() {
        return this.assert(n => n < 0)
    }

    min(min) {
        return this.assert(n => n >= min)
    }

    max(max) {
        return this.assert(n => n <= max)
    }

    get allowInfinity() {
        return this.setOptions({ allowInfinity: true })
    }

    _validate(value) {
        if (!isNaN(value) &&
            !isFinite(value) &&
            !this._options.allowInfinity) {
            throw makeError(
                vn => 'The ' + vn + ' must be finite'
            )
        }

        return super._validate(value)
    }
}

class ObjectValidator extends Validator {
    _validateShapeProp(shape, value, key, result) {
        const childValidator = shape[key]
        assert(childValidator instanceof Validator)

        if (!childValidator._options.required &&
            !(key in value)) {
            return
        }

        result[key] = ValidationError.catchAndPushProp(() => {
            return childValidator.validate(value[key])
        }, key)
    }

    shape(shape) {
        if (!shape) {
            return this._options.shape || {}
        }

        if (this._options.shape) {
            throw new Error('Already shaped')
        }

        assert(typeof shape === 'object')

        shape = Object.assign({}, shape)

        const validateShape = value => {
            const result = {}

            for (const key in shape) {
                this._validateShapeProp(shape, value, key, result)
            }

            return result
        }

        return this.compose(validateShape)
                   .setOptions({ shape, validateShape })
    }

    get unshape() {
        if (!this._options.shape) {
            throw new Error('Already unshaped')
        }

        return this
            .setChildren(
                this._children
                    .filter(c => c !== this._options.validateShape)
            )
            .setOptions({ shape: undefined })
    }

    reshape(func) {
        if (!this._options.shape) {
            return this
        }

        const oldShape = this.shape()
        return this.unshape.shape(func(oldShape))
    }

    // The given func is called with each child
    mapChildren(func) {
        return this.reshape(
            oldShape => mapValues(
                oldShape,
                (value, key) => ValidationError.catchAndPushProp(
                    () => func(value, key),
                    key
                )
            )
        )
    }

    filterChildren(func) {
        return this.reshape(
            oldShape => pickBy(
                oldShape,
                (value, key) => ValidationError.catchAndPushProp(
                    () => func(value, key),
                    key
                )
            )
        )
    }

    // Only works with shapes
    get requiredChildren() {
        return this.mapChildren(
            child => child.required
        )
    }

    // Only works with shapes
    get optionalChildren() {
        return this.mapChildren(
            child => child.optional
        )
    }

    pick(...keys) {
        return this.filterChildren((c, key) => keys.includes(key))
    }

    of(validator) {
        return this.compose(
            object => _.mapValues(
                object,
                (value, key) => ValidationError.catchAndPushProp(
                    () => validator(value),
                    key
                )
            )
        )
    }
}

class ArrayValidator extends Validator {
    of(validator) {
        return this.compose(
            array => array.map(
                (value, index) => ValidationError.catchAndPushProp(
                    () => validator(value),
                    index
                )
            )
        )
    }
}

const V = makeValidator(Validator)
V.ValidationError = ValidationError
module.exports = V
