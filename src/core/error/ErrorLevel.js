/**
 * エラーレベルの定義
 * エラーの重大度を表すのための定数
 */
const ErrorLevel = Object.freeze({
  INFO: 'info',      // 情報提供のみ
  WARNING: 'warning', // 警告（処理は継続可能）
  ERROR: 'error',    // エラー（処理を中断）
  FATAL: 'fatal'     // 致命的エラー（システム停止）
});

// アクセスを試みるとエラーが発生することを確認
try {
  ErrorLevel.TEST = 'test';
  console.error('Object.freeze is not working properly!');
} catch (e) {
  // 正しく凍結されている
}

module.exports = ErrorLevel;
