class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

module.exports = {
  HttpError,
  badRequest: (message, details) => new HttpError(400, message, details),
  unauthorized: (message = "Please log in to continue.") =>
    new HttpError(401, message),
  forbidden: (message = "You do not have permission to do that.") =>
    new HttpError(403, message),
  notFound: (message = "Not found.") => new HttpError(404, message),
  conflict: (message, details) => new HttpError(409, message, details),
};
