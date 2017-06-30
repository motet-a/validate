
[![Build Status](https://travis-ci.org/motet-a/validate.svg?branch=master)](https://travis-ci.org/motet-a/validate) [![Coverage Status](https://coveralls.io/repos/github/motet-a/validate/badge.svg?branch=master)](https://coveralls.io/github/motet-a/validate?branch=master)

# Data validation for Node.js

## Oh no, yet another validation library, there are thousands…

Well, I was unable to find _the perfect_ validation library. I like
these ones:

- [prop-types]. This one is truly great. It’s not the most customizable,
  not the most chainable and it’s not really suitable outside React,
  but it perfectly does its job.

- [Joi]. Chainable but a bit bloated. You can do a lot with Joi, but
  it’s not so simple, you can’t always guess what it does without
  reading the documentation.

This library is an attempt to write a cleaner and simplified Joi,
using modern JS features.

## Drawbacks

Since it uses `Reflect`, it is hard to use it in old environments.

## How-to

First of all:

```js
const V = require('@motet_a/validate')
```

`V` is a validation function which returns its argument, requires
a value and throws on error:

```js
V(123) // → 123
V(0) // → 0
V(null) // → throws V.ValidationError
V(undefined) // → throws V.ValidationError
```

Of course, you can allow `null` and `undefined`:

```js
V.optional(null) // → null
V.optional(undefined) // → undefined
```

You can restrict the type:

```js
V.string('valid') // → 'valid'
V.string(123) // → throws
V.number(NaN) // → throws
V.number(123) // → 123
V.number.integer(123) // → 123
V.object({}) // → {}
V.bool(false) // → false
```

`V.integer` is a shortcut for `V.number.integer`.

`V` is a validator, `V.string` is a new validator. Every validator is
immutable.

You can mix up everything:

```js
V.optional.string(null) // → null
V.string.optional(null) // → null
```

You can restrict types of objects and arrays:

```js
V.array.of(V.number.positive)([-1]) // throws (number not positive)
V.object.of(V.string.lower)
```

You can also shape objects, use rexgexp, extract and reuse field
validators and much more. See the `examples/` directory.

## Inspirations

[Joi] and [prop-types].

[joi]: https://github.com/hapijs/joi
[prop-types]: https://github.com/facebook/prop-types
