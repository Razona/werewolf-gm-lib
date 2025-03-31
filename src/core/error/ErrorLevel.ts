/**
 * エラーのレベルを定義する列挙型
 */
export enum ErrorLevel {
  /**
   * 致命的エラー - システムの継続が不可能
   */
  FATAL = 'FATAL',

  /**
   * エラー - 操作の失敗や深刻な問題
   */
  ERROR = 'ERROR',

  /**
   * 警告 - 将来的な問題の可能性や推奨されない操作
   */
  WARNING = 'WARNING',

  /**
   * 情報 - 一般的な状態や進行状況の通知
   */
  INFO = 'INFO'
}
