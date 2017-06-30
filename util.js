/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This handles more types than `getType`. Only used for error messages.
// See `createPrimitiveTypeChecker`.
function getPreciseType(propValue) {
    if (typeof propValue === 'undefined' || propValue === null) {
        return '' + propValue
    }

    const propType = getType(propValue)
    if (propType === 'object') {
        if (propValue instanceof Date) {
            return 'date'
        } else if (propValue instanceof RegExp) {
            return 'regexp'
        }
    }

    return propType
}

function isSymbol(propType, propValue) {
    // Native Symbol.
    if (propType === 'symbol') {
        return true
    }

    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
    if (propValue['@@toStringTag'] === 'Symbol') {
        return true
    }

    // Fallback for non-spec compliant Symbols which are polyfilled.
    if (typeof Symbol === 'function' && propValue instanceof Symbol) {
        return true
    }

    return false
}

function getType(thing) {
    if (Array.isArray(thing)) {
        return 'array'
    }

    const type = typeof thing

    if (isSymbol(type, thing)) {
        return 'symbol'
    }

    return type
}

function mapValues(source, func) {
    const result = {}
    for (const key in source) {
        result[key] = func(source[key], key)
    }
    return result
}

function pickBy(source, predicate) {
    result = {}
    for (const key in source) {
        const v = source[key]
        if (predicate(v, key)) {
            result[key] = v
        }
    }
    return result
}

module.exports = {
    isSymbol, getType, getPreciseType,
    mapValues, pickBy,
}
