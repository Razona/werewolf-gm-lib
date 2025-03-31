/**
 * エラーシステムのエントリーポイント
 * エラー関連の機能をまとめてエクスポートする
 */
const ErrorLevel = require('./ErrorLevel');
const ErrorHandler = require('./ErrorHandler');
const Validator = require('./Validator');
const { ErrorCatalog, getErrorByCode, getErrorsByLevel } = require('./ErrorCatalog');

/**
 * エラーシステムを作成する
 * @param {object} eventSystem - イベントシステム
 * @param {object} options - オプション設定
 * @returns {object} エラーシステムのインスタンス
 */
function createErrorSystem(eventSystem, options = {}) {
  const errorHandler = new ErrorHandler(eventSystem, options.policy);
  const validator = new Validator(errorHandler);
  
  return {
    errorHandler,
    validator,
    ErrorCatalog,
    getErrorByCode,
    getErrorsByLevel
  };
}

module.exports = {
  ErrorLevel,
  ErrorHandler,
  Validator,
  ErrorCatalog,
  getErrorByCode,
  getErrorsByLevel,
  createErrorSystem
};
