/**
 * エラーレベルを定義する列挙型
 */
const ErrorLevel = Object.freeze({
  FATAL: 'fatal',
  ERROR: 'error', 
  WARNING: 'warning',
  INFO: 'info'
});

export { ErrorLevel };
export default ErrorLevel;
