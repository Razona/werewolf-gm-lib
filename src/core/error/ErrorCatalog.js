/**
 * @file src/core/error/ErrorCatalog.js
 * @description エラー定義のカタログ
 */

/**
 * エラー定義のカタログ
 * 各エラーは、コード、メッセージ、詳細情報、レベルを持つ
 * 
 * @type {Object}
 */
const ErrorCatalog = {
  INVALID_PLAYER_ACTION: {
    code: 'E001',
    message: 'プレイヤーは現在このアクションを実行できません',
    details: '死亡者や特定の状態効果下ではアクションが制限されます',
    level: 'error'
  },
  
  INVALID_PHASE_TRANSITION: {
    code: 'E002',
    message: '現在のフェーズからその遷移は許可されていません',
    details: '特定のフェーズ順序に従う必要があります',
    level: 'error'
  },
  
  INVALID_TARGET: {
    code: 'E003',
    message: '無効な対象です',
    details: '存在しないプレイヤーや死亡プレイヤーは対象にできません',
    level: 'error'
  },
  
  DEAD_PLAYER: {
    code: 'E004',
    message: '死亡したプレイヤーは行動できません',
    details: '生存プレイヤーのみが行動可能です',
    level: 'error'
  },
  
  INVALID_VOTE: {
    code: 'E005',
    message: '無効な投票です',
    details: '投票者または対象が無効です',
    level: 'error'
  },
  
  ROLE_DEPENDENCY_ERROR: {
    code: 'E006',
    message: '役職の依存関係が満たされていません',
    details: '一部の役職は他の役職の存在を必要とします',
    level: 'error'
  },
  
  ROLE_BALANCE_ERROR: {
    code: 'E007',
    message: '役職のバランスが不適切です',
    details: '役職構成は特定のバランス条件を満たす必要があります',
    level: 'error'
  },
  
  INVALID_CONFIGURATION: {
    code: 'E008',
    message: '無効な設定です',
    details: '設定パラメータが適切な範囲内にありません',
    level: 'error'
  },
  
  ALREADY_INITIALIZED: {
    code: 'E009',
    message: '既に初期化されています',
    details: '初期化は一度だけ行えます',
    level: 'warning'
  },
  
  NOT_INITIALIZED: {
    code: 'E010',
    message: '初期化されていません',
    details: '操作を行う前に初期化が必要です',
    level: 'error'
  },
  
  INVALID_ROLE: {
    code: 'E011',
    message: '無効な役職です',
    details: '指定された役職は存在しないか、現在のゲームでは使用できません',
    level: 'error'
  },
  
  INSUFFICIENT_PLAYERS: {
    code: 'E012',
    message: 'プレイヤー数が不足しています',
    details: 'ゲームを開始するには最低限必要なプレイヤー数を満たす必要があります',
    level: 'error'
  },
  
  GAME_ALREADY_STARTED: {
    code: 'E013',
    message: 'ゲームは既に開始されています',
    details: 'ゲーム開始後は特定の操作ができません',
    level: 'warning'
  },
  
  GAME_NOT_STARTED: {
    code: 'E014',
    message: 'ゲームが開始されていません',
    details: 'この操作はゲーム開始後に実行可能です',
    level: 'error'
  },
  
  GAME_ALREADY_ENDED: {
    code: 'E015',
    message: 'ゲームは既に終了しています',
    details: 'ゲーム終了後は特定の操作ができません',
    level: 'warning'
  },
  
  ACTION_EXECUTION_ERROR: {
    code: 'E016',
    message: 'アクション実行中にエラーが発生しました',
    details: '役職のアクションハンドラでエラーが発生しました',
    level: 'error'
  },
  
  VALIDATION_ERROR: {
    code: 'E017',
    message: '検証エラー',
    details: '入力値が期待する条件を満たしていません',
    level: 'warning'
  },
  
  PLUGIN_REGISTRATION_ERROR: {
    code: 'E018',
    message: 'プラグイン登録エラー',
    details: 'プラグインの登録中にエラーが発生しました',
    level: 'error'
  },
  
  PLUGIN_EXECUTION_ERROR: {
    code: 'E019',
    message: 'プラグイン実行エラー',
    details: 'プラグインの実行中にエラーが発生しました',
    level: 'error'
  },
  
  UNKNOWN_ERROR: {
    code: 'E999',
    message: '不明なエラー',
    details: '予期しないエラーが発生しました',
    level: 'fatal'
  }
};

export default ErrorCatalog;
