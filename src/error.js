
const PATH = Symbol()
const MESSAGE = Symbol()

// Don't instanciate directly
class ValidationError extends Error {
    pushProp(name) {
        this[PATH].unshift(name)
    }

    getNewStack(oldStack) {
        const withoutFirstLine = oldStack.split('\n')
                                         .slice(1)
                                         .join('\n')

        return 'Error: ' + this.newMessage + '\n' +
               withoutFirstLine
    }

    get path() {
        return this[PATH].slice()
    }

    get newMessage() {
        if (typeof this[MESSAGE] === 'string') {
            return this[MESSAGE]
        }

        const valueName = this.path.length ? (
            'value at `' + this.path.join('.') + '`'
        ) : (
            'value'
        )

        return this[MESSAGE](valueName)
    }
}

ValidationError.catchAndPushProp = (func, propName) => {
    try {
        return func()
    } catch (error) {
        if (error instanceof ValidationError) {
            error.pushProp(propName)
        }

        throw error
    }
}

function makeError(message) {
    const error = new Proxy(
        new ValidationError('ValidationError'),

        {
            get(target, prop, receiver) {
                if (prop === 'message') {
                    return Reflect.get(target, 'newMessage', receiver)
                }

                if (prop === 'stack') {
                    const oldStack = Reflect.get(target, 'stack', receiver)
                    return target.getNewStack.bind(receiver)(oldStack)
                }

                return Reflect.get(target, prop, receiver)
            },
        }
    )

    error[PATH] = []
    error[MESSAGE] = message
    return error
}

module.exports = {
    makeError,
    ValidationError,
}
