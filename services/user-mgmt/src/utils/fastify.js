import errorMessages from "../schemas/errorMessages.js"
import successMessages from "../schemas/successMessages.js"

const sendError = (reply, statusCode, code, extra = {}) => {
    return reply.code(statusCode).send({
        success: false,
        code,
        error: errorMessages[code],
        ...extra
    })
}

const sendSuccess = (reply, statusCode, code, extra = {}) => {
    return reply.code(statusCode).send({
        success: true,
        code,
        message: successMessages[code],
        ...extra
    })
}

export {
    sendError,
    sendSuccess
}