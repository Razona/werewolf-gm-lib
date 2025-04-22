/**
 * ErrorHandler モック
 */

const ErrorHandler = jest.fn().mockImplementation((eventSystem, options = {}) => {
  return {
    eventSystem,
    options,
    createError: jest.fn().mockImplementation((code, message, details) => {
      const error = new Error(message || `Error: ${code}`);
      error.code = code;
      error.details = details;
      error.isGameError = true;
      return error;
    }),
    handleError: jest.fn().mockImplementation((error, context) => {
      return { handled: true, error, context };
    }),
    validateInput: jest.fn().mockReturnValue(true),
    standardizeError: jest.fn().mockImplementation(error => error),
    isGameError: jest.fn().mockImplementation(error => error?.isGameError || false)
  };
});

module.exports = { ErrorHandler };
