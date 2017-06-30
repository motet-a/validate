
const assert = require('assert')

const renderMessage = (messageTemplate, path) => {
    if (typeof messageTemplate === 'string') {
        return messageTemplate
    }

    assert(typeof messageTemplate === 'function')

    const valueName = path.length ? (
        'value at `' + path.join('.') + '`'
    ) : (
        'value'
    )

    return messageTemplate(valueName)
}

class ValidationError extends Error {
    constructor(messageTemplate, path = []) {
        const message = renderMessage(messageTemplate, path)
        super(message)

        this.name = this.constructor.name

        this.messageTemplate = messageTemplate
        this.path = path

        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor)
        } else {
            this.stack = (new Error(message)).stack
        }
    }

    pushProp(name) {
        return new ValidationError(
            this.messageTemplate,
            [name].concat(this.path),
        )
    }
}

ValidationError.catchAndPushProp = (func, propName) => {
    try {
        return func()
    } catch (error) {
        if (error instanceof ValidationError) {
            error = error.pushProp(propName)
        }

        throw error
    }
}

module.exports = ValidationError
