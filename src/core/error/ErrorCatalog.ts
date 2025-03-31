import { ErrorLevel } from './ErrorLevel';

export const ErrorCatalog = {
  PHASE_NOT_FOUND: {
    code: 'E000',
    level: ErrorLevel.ERROR,
    message: '指定されたフェーズは存在しないか、現在のゲームでは利用できません',
    details: 'フェーズが見つからないか、現在のゲーム状態で利用できません'
  },

  SYSTEM_INTERNAL_ERROR: {
    code: 'E001',
    level: ErrorLevel.FATAL,
    message: 'システム内部エラーが発生しました',
    details: '予期しないシステムエラーが発生しました。開発者に報告してください'
  },

  INVALID_CONFIGURATION: {
    code: 'E002',
    level: ErrorLevel.ERROR,
    message: '無効な設定',
    details: 'ゲーム設定に無効なパラメータが含まれています'
  },

  OPERATION_TIMEOUT: {
    code: 'E003',
    level: ErrorLevel.ERROR,
    message: '操作がタイムアウトしました',
    details: '操作が完了する前にタイムアウトしました'
  },

  STATE_CORRUPTION: {
    code: 'E004',
    level: ErrorLevel.FATAL,
    message: '状態の破損',
    details: 'ゲーム状態が破損しています。復元できない可能性があります'
  },

  SERIALIZATION_ERROR: {
    code: 'E005',
    level: ErrorLevel.ERROR,
    message: 'シリアライズエラー',
    details: 'ゲーム状態のシリアライズに失敗しました'
  },

  DESERIALIZATION_ERROR: {
    code: 'E006',
    level: ErrorLevel.ERROR,
    message: 'デシリアライズエラー',
    details: 'ゲーム状態のデシリアライズに失敗しました'
  },

  INVALID_STATE: {
    code: 'E007',
    level: ErrorLevel.ERROR,
    message: '無効な状態',
    details: 'ゲーム状態が無効です'
  },

  STATE_VALIDATION_ERROR: {
    code: 'E008',
    level: ErrorLevel.ERROR,
    message: '状態検証エラー',
    details: 'ゲーム状態の検証に失敗しました'
  },

  PLUGIN_LOAD_ERROR: {
    code: 'E009',
    level: ErrorLevel.ERROR,
    message: 'プラグイン読み込みエラー',
    details: 'プラグインの読み込みに失敗しました'
  },

  PLUGIN_COMPATIBILITY_ERROR: {
    code: 'E010',
    level: ErrorLevel.ERROR,
    message: 'プラグイン互換性エラー',
    details: 'プラグインはこのバージョンのシステムと互換性がありません'
  },

  CUSTOM_ROLE_ERROR: {
    code: 'E011',
    level: ErrorLevel.ERROR,
    message: 'カスタム役職エラー',
    details: 'カスタム役職の登録または使用中にエラーが発生しました'
  },

  EXTENSION_CONFLICT: {
    code: 'E012',
    level: ErrorLevel.ERROR,
    message: '拡張機能の競合',
    details: '複数の拡張機能間で競合が発生しています'
  },

  INVALID_PARAMETER: {
    code: 'E013',
    level: ErrorLevel.ERROR,
    message: '不正なパラメータが渡されました',
    details: '指定されたパラメータは型または範囲が無効です'
  },

  MISSING_REQUIRED_FIELD: {
    code: 'E014',
    level: ErrorLevel.ERROR,
    message: '必須フィールドが不足しています',
    details: '必要な情報が提供されていません'
  },

  DEAD_PLAYER_ACTION: {
    code: 'E015',
    level: ErrorLevel.ERROR,
    message: '死亡したプレイヤーは操作できません',
    details: '死亡したプレイヤーはアクションを実行できません'
  },

  TYPE_ERROR: {
    code: 'E016',
    level: ErrorLevel.ERROR,
    message: '型エラー',
    details: '指定された値の型が正しくありません'
  },

  DEPRECATED_FEATURE: {
    code: 'W001',
    level: ErrorLevel.WARNING,
    message: '非推奨の機能',
    details: 'この機能は将来のバージョンで削除される予定です'
  },

  SUBOPTIMAL_CONFIGURATION: {
    code: 'W002',
    level: ErrorLevel.WARNING,
    message: '最適でない設定',
    details: '現在の設定は機能しますが、最適ではありません'
  },

  PERFORMANCE_WARNING: {
    code: 'W003',
    level: ErrorLevel.WARNING,
    message: 'パフォーマンス警告',
    details: 'この操作はパフォーマンスに影響を与える可能性があります'
  },

  INCONSISTENT_STATE: {
    code: 'W004',
    level: ErrorLevel.WARNING,
    message: '一貫性のない状態',
    details: 'ゲーム状態に一貫性のない箇所が検出されましたが、続行は可能です'
  },

  GAME_STATE_CHANGED: {
    code: 'I001',
    level: ErrorLevel.INFO,
    message: 'ゲーム状態変更',
    details: 'ゲームの状態が変更されました'
  },

  ACTION_EXECUTED: {
    code: 'I002',
    level: ErrorLevel.INFO,
    message: 'アクション実行',
    details: 'アクションが正常に実行されました'
  },

  PHASE_CHANGED: {
    code: 'I003',
    level: ErrorLevel.INFO,
    message: 'フェーズ変更',
    details: 'ゲームのフェーズが変更されました'
  },

  PLAYER_STATE_CHANGED: {
    code: 'I004',
    level: ErrorLevel.INFO,
    message: 'プレイヤー状態変更',
    details: 'プレイヤーの状態が変更されました'
  }
};
