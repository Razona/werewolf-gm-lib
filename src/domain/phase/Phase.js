/**
 * 人狼ゲームのフェーズを表現するクラス
 * 
 * フェーズは、ゲームの進行状態（夜、昼、投票など）を表し、
 * 各フェーズで可能なアクションを制御します。
 */

/**
 * @typedef {Object} VisibilityPolicy
 * @property {boolean} showDeadPlayers - 死亡プレイヤーを表示するか
 * @property {boolean} showRoles - 役職情報を表示するか
 * @property {boolean} showVotes - 投票情報を表示するか
 */

/**
 * @typedef {Object} PhaseOptions
 * @property {string} id - フェーズの識別子
 * @property {string} displayName - 表示名
 * @property {string} [description=''] - 説明文
 * @property {string[]} allowedActions - 許可されるアクション
 * @property {string[]} [requiredActions=[]] - 必須アクション
 * @property {number|null} [timeLimit=null] - 時間制限（秒、nullは無制限）
 * @property {VisibilityPolicy} [visibilityPolicy] - 情報可視性ポリシー
 * @property {Object} [metadata={}] - 拡張用メタデータ
 */

class Phase {
  /**
   * フェーズを作成する
   * @param {PhaseOptions} options - フェーズオプション
   */
  constructor(options) {
    // 必須パラメータの検証
    if (!options.id) {
      throw new Error('フェーズIDは必須です');
    }

    if (!options.displayName) {
      throw new Error('フェーズ表示名は必須です');
    }

    if (!options.allowedActions) {
      throw new Error('許可アクションリストは必須です');
    }

    if (!Array.isArray(options.allowedActions)) {
      throw new Error('許可アクションリストは配列である必要があります');
    }

    // プロパティの設定
    this.id = options.id;
    this.displayName = options.displayName;
    this.description = options.description || '';
    this.allowedActions = [...options.allowedActions]; // 配列のコピー
    this.requiredActions = options.requiredActions ? [...options.requiredActions] : [];
    
    // timeLimit は null または正の数値のみ許可
    if (options.timeLimit !== undefined && options.timeLimit !== null) {
      const limit = Number(options.timeLimit);
      this.timeLimit = !isNaN(limit) ? Math.max(0, limit) : null;
    } else {
      this.timeLimit = null;
    }

    // 可視性ポリシーの設定
    this.visibilityPolicy = {
      // デフォルト値
      showDeadPlayers: true,
      showRoles: false,
      showVotes: false,
      // 指定された値で上書き
      ...(options.visibilityPolicy || {})
    };

    // メタデータの設定
    this.metadata = { ...(options.metadata || {}) };

    // フェーズの状態管理
    this.startTime = null;  // フェーズ開始時刻
    this.endTime = null;    // フェーズ終了時刻
    this.duration = null;   // フェーズ継続時間
  }

  /**
   * フェーズ開始処理
   * @param {Object} game - ゲームオブジェクト
   */
  onPhaseStart(game) {
    this.startTime = Date.now();
    // 注意: イベント発火はPhaseManagerで行うように変更
  }

  /**
   * フェーズ終了処理
   * @param {Object} game - ゲームオブジェクト
   * @throws {Error} フェーズが開始されていない場合
   */
  onPhaseEnd(game) {
    if (this.startTime === null) {
      throw new Error('フェーズが開始されていません');
    }

    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
    // 注意: イベント発火はPhaseManagerで行うように変更
  }

  /**
   * 指定されたアクションが許可されているかチェック
   * @param {string} actionType - アクションタイプ
   * @returns {boolean} 許可されている場合true
   */
  isActionAllowed(actionType) {
    if (!actionType || typeof actionType !== 'string') {
      return false;
    }
    return this.allowedActions.includes(actionType);
  }

  /**
   * 可視性ポリシーを更新
   * @param {Partial<VisibilityPolicy>} newPolicy - 新しいポリシー（部分的）
   */
  updateVisibilityPolicy(newPolicy) {
    if (!newPolicy || typeof newPolicy !== 'object') {
      return;
    }

    // 有効なプロパティのみを更新
    const validKeys = ['showDeadPlayers', 'showRoles', 'showVotes'];
    for (const key of validKeys) {
      if (newPolicy[key] !== undefined) {
        this.visibilityPolicy[key] = newPolicy[key];
      }
    }
  }

  /**
   * 残り時間を取得（秒単位）
   * @returns {number|null} 残り時間、または時間制限がない場合はnull
   */
  getRemainingTime() {
    // フェーズが未開始または時間制限なしの場合
    if (this.startTime === null || this.timeLimit === null) {
      return null;
    }

    const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
    const remainingTime = Math.max(0, this.timeLimit - elapsedTime);
    return remainingTime;
  }

  /**
   * 時間制限に達したかチェック
   * @returns {boolean} 時間制限に達した場合true
   */
  isTimeLimitReached() {
    // フェーズが未開始または時間制限なしの場合
    if (this.startTime === null || this.timeLimit === null) {
      return false;
    }

    const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
    return elapsedTime >= this.timeLimit;
  }
}

/**
 * 標準フェーズのセットを作成する静的ヘルパーメソッド
 * @returns {Object} フェーズIDをキーとするフェーズオブジェクトのマップ
 */
Phase.createStandardPhases = () => {
  // 基本フェーズの定義と作成
  const phases = {};
  
  // 各標準フェーズの定義
  const phaseDefinitions = {
    preparation: {
      displayName: '準備フェーズ',
      description: 'ゲーム開始前の準備段階',
      allowedActions: ['setup']
    },
    firstNight: {
      displayName: '初日夜フェーズ',
      description: '初日の夜フェーズ',
      allowedActions: ['fortune', 'guard', 'attack']
    },
    firstDay: {
      displayName: '初日昼フェーズ',
      description: '初日の昼フェーズ',
      allowedActions: ['discuss']
    },
    vote: {
      displayName: '投票フェーズ',
      description: '処刑対象を決める投票フェーズ',
      allowedActions: ['vote']
    },
    runoffVote: {
      displayName: '決選投票フェーズ',
      description: '同数得票時の決選投票フェーズ',
      allowedActions: ['vote']
    },
    execution: {
      displayName: '処刑フェーズ',
      description: '投票結果に基づく処刑フェーズ',
      allowedActions: []
    },
    night: {
      displayName: '夜フェーズ',
      description: '役職能力を使用する夜フェーズ',
      allowedActions: ['fortune', 'guard', 'attack']
    },
    day: {
      displayName: '昼フェーズ',
      description: '昼のディスカッションフェーズ',
      allowedActions: ['discuss']
    },
    gameEnd: {
      displayName: 'ゲーム終了フェーズ',
      description: 'ゲーム終了と勝敗判定のフェーズ',
      allowedActions: []
    }
  };
  
  // 各フェーズのインスタンスを作成
  Object.entries(phaseDefinitions).forEach(([id, definition]) => {
    phases[id] = new Phase({
      id,
      ...definition
    });
  });
  
  return phases;
};

export default Phase;
