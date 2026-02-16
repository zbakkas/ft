const sendError = (reply, statusCode, error, extra = {}) => {
    return reply.code(statusCode).send({
        success: false,
        error,
        ...extra
    })
}

const sendSuccess = (reply, statusCode, message, extra = {}) => {
    return reply.code(statusCode).send({
        success: true,
        message,
        ...extra
    })
}

export {
    sendError,
    sendSuccess
}