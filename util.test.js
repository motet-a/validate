
const { assert } = require('chai')
const { getType, getPreciseType } = require('./util')

describe('getType()', () => {
    it('works', () => {
        assert(getType([]) === 'array')
        assert(getType({}) === 'object')
        assert(getType('') === 'string')
        assert(getType(() => {}) === 'function')
        assert(getType(Symbol()) === 'symbol')
    })

    it('works with Symbol polyfills', () => {
        assert(getType({
            '@@toStringTag': 'Symbol',
        }) === 'symbol')
    })

    it('works with bad Symbol polyfills', () => {
        const RealSymbol = Symbol
        Symbol = function () {}
        assert(getType(new Symbol) === 'symbol')
        Symbol = RealSymbol
    })
})

describe('getPreciseType()', () => {
    it('works', () => {
        assert(getPreciseType([]) === 'array')
        assert(getPreciseType({}) === 'object')
        assert(getPreciseType('') === 'string')
        assert(getPreciseType(() => {}) === 'function')
        assert(getPreciseType(Symbol()) === 'symbol')
        assert(getPreciseType(undefined) === 'undefined')
        assert(getPreciseType(null) === 'null')
        assert(getPreciseType(new Date) === 'date')
        assert(getPreciseType(/hey/) === 'regexp')
    })
})
