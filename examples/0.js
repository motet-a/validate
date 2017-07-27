
const assert = require('assert')
const V = require('../dist')

const isPhoneNumberChar = c =>
    !!/[a-z0-9+ ]/i.exec(c)

const phoneNumberSpec = V
    .string
    .assertEveryChar(isPhoneNumberChar)
    .toTrimmed
    .min(2).max(20)

assert(phoneNumberSpec('+23 45 67 89  ') === '+23 45 67 89')

const userSpec = V.shape({
    name: V
        .string
        .toTrimmed
        .toLower
        .min(3).max(40),

    email: V
        .email
        .max(40),

    phoneNumbers: V
        .array
        .of(phoneNumberSpec)
        .max(8),

    bio: V
        .string
        .max(1000)
        .optional,
})

const user = userSpec({
    name: '  JOHN',
    email: 'john@example.com',
    phoneNumbers: [
        '+23 45 67 89  ',
    ],
})

assert.deepEqual(
    user,

    {
        name: 'john',
        email: 'john@example.com',
        phoneNumbers: [
            '+23 45 67 89',
        ],
    }
)

assert.throws(
    () => userSpec.shape().email('bad email'),
    /Assertion failure, the value was `bad email`/
)
