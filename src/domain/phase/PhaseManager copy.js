import Phase from './Phase';

/**
 * ゲームのフェーズを管理するクラス
 *
 * フェーズの定義、遷移ルール、イベント発火のタイミング、およびフェーズ間の状態管理を担当する
 */
class PhaseManager {
  /**
   * フェーズマネージャーを作成
   * @param {Object} game - ゲームオブジェクト
   * @param {Object} [options={}] - オプション
   * @param {string} [options.initialPhase='preparation'] - 初期フェーズID
   * @param {number} [options.initialTurn=1] - 初期ターン数
   * @param {number} [options.maxHistorySize=100] - 履歴の最大サイズ
   */
  constructor(game, options = {}) {
    this.game = game;
    this.eventSystem = game.eventSystem;
    this.errorHandler = game.errorHandler;

    // オプションの設定とデフォルト値
    this.options = {
      maxHistorySize: 100,
      ...options
    };

    // フェーズの初期化
    this.phases = Phase.createStandardPhases();

    // 初期フェーズの設定
    const initialPhaseId = options.initialPhase && this.phases[options.initialPhase]
      ? options.initialPhase
      : 'preparation';
    this.currentPhase = this.phases[initialPhaseId];

    // 初期ターン数の設定
    this.currentTurn = options.initialTurn && options.initialTurn > 0
      ? options.initialTurn
      : 1;

    // 履歴の初期化
    this.phaseHistory = [];
    this.turnHistory = [];
    this.currentPhaseContext = null;

    // 遷移ルールの初期化
    this.phaseTransitions = [];
    this.initializeTransitions();
  }

  /**
   * 標準的なフェーズ遷移ルールを初期化
   */
  initializeTransitions() {
    // 基本遷移ルール
    const standardTransitions = [
      // 準備フェーズ → 初日夜
      {
        sourcePhase: 'preparation',
        targetPhase: 'firstNight',
        condition: () => true,
        priority: 10
      },
      // 初日夜 → 初日昼
      {
        sourcePhase: 'firstNight',
        targetPhase: 'firstDay',
        condition: () => true,
        priority: 10
      },
      // 初日昼 → 投票（初日処刑ありの場合）
      {
        sourcePhase: 'firstDay',
        targetPhase: 'vote',
        condition: () => this.game.options.regulations.firstDayExecution !== false,
        priority: 10
      },
      // 初日昼 → 夜（初日処刑なしの場合）
      {
        sourcePhase: 'firstDay',
        targetPhase: 'night',
        condition: () => this.game.options.regulations.firstDayExecution === false,
        priority: 20 // 優先度を高く設定
      },
      // 投票 → 決選投票（同数の場合）
      {
        sourcePhase: 'vote',
        targetPhase: 'runoffVote',
        condition: (game) => {
          const context = this.getPhaseContext();
          return context && context.data && context.data.needsRunoff === true;
        },
        priority: 20
      },
      // 投票 → 処刑（同数でない場合）
      {
        sourcePhase: 'vote',
        targetPhase: 'execution',
        condition: () => {
          const context = this.getPhaseContext();
          return !context || !context.data || context.data.needsRunoff !== true;
        },
        priority: 10
      },
      // 決選投票 → 処刑
      {
        sourcePhase: 'runoffVote',
        targetPhase: 'execution',
        condition: () => true,
        priority: 10
      },
      // 処刑 → 夜
      {
        sourcePhase: 'execution',
        targetPhase: 'night',
        condition: () => !this.game.checkVictoryCondition(), // 勝利条件未達成
        priority: 10
      },
      // 夜 → 昼
      {
        sourcePhase: 'night',
        targetPhase: 'day',
        condition: () => !this.game.checkVictoryCondition(), // 勝利条件未達成
        priority: 10
      },
      // 昼 → 投票
      {
        sourcePhase: 'day',
        targetPhase: 'vote',
        condition: () => true,
        priority: 10
      },
      // 勝利条件達成時のゲーム終了遷移ルール（高優先度）
      {
        sourcePhase: '*', // すべてのフェーズから
        targetPhase: 'gameEnd',
        condition: () => !!this.game.checkVictoryCondition(), // 勝利条件達成
        priority: 100 // 最高優先度
      }
    ];

    // 遷移ルールの登録
    standardTransitions.forEach(rule => this.registerTransition(rule));
  }

  /**
   * 現在のフェーズを取得する
   * @returns {Object} 現在のフェーズ
   */
  getCurrentPhase() {
    return this.currentPhase;
  }

  /**
   * 現在のターン番号を取得する
   * @returns {number} 現在のターン番号
   */
  getCurrentTurn() {
    return this.currentTurn;
  }

  /**
   * フェーズ履歴を取得する
   * @returns {Array} フェーズ履歴
   */
  getPhaseHistory() {
    return [...this.phaseHistory];
  }

  /**
   * 特定のターンのフェーズ履歴を取得する
   * @param {number} turn - ターン番号
   * @returns {Array} 指定ターンのフェーズ履歴
   */
  getPhaseHistoryByTurn(turn) {
    return this.phaseHistory.filter(entry => entry.turn === turn);
  }

  /**
   * 特定のIDのフェーズを取得する
   * @param {string} phaseId - フェーズID
   * @returns {Object|null} フェーズオブジェクト、または存在しない場合はnull
   */
  getPhaseById(phaseId) {
    return this.phases[phaseId] || null;
  }

  /**
   * 次のフェーズに移行する
   * @returns {Object} 移行後のフェーズ
   * @throws {Error} 適切な遷移先がない場合
   */
  moveToNextPhase() {
    // 現在のフェーズから適用可能な遷移ルールを検索
    const currentPhaseId = this.currentPhase.id;

    // 投票フェーズから決選投票フェーズへの特別処理
    if (currentPhaseId === 'vote') {
      const context = this.getPhaseContext();
      if (context && context.data && context.data.needsRunoff === true) {
        // 同票の場合は決選投票フェーズに移行
        return this.moveToPhase('runoffVote');
      }
    }

    // 通常の遷移ルール処理
    const applicableRules = this.phaseTransitions.filter(rule => {
      // sourcePhaseが現在のフェーズまたはワイルドカード
      return (rule.sourcePhase === currentPhaseId || rule.sourcePhase === '*') &&
        // 条件が満たされている
        rule.condition(this.game);
    });

    // 適用可能なルールがない場合
    if (applicableRules.length === 0) {
      throw this.errorHandler.createError(
        'INVALID_PHASE_TRANSITION',
        `現在のフェーズ ${currentPhaseId} から遷移可能な次のフェーズがありません`,
        { currentPhase: currentPhaseId }
      );
    }

    // 優先度順にソート（既に登録時にソート済みだが、念のため）
    applicableRules.sort((a, b) => b.priority - a.priority);

    // 最も優先度の高いルールを適用
    const nextPhaseId = applicableRules[0].targetPhase;
    return this.moveToPhase(nextPhaseId);
  }

  /**
   * 指定したフェーズに移行する
   * @param {string} targetPhaseId - 移行先のフェーズID
   * @returns {Object} 移行後のフェーズ
   * @throws {Error} 指定されたフェーズが存在しない場合
   */
  moveToPhase(targetPhaseId) {
    // 対象フェーズの存在確認
    const targetPhase = this.phases[targetPhaseId];
    if (!targetPhase) {
      throw this.errorHandler.createError(
        'INVALID_PHASE',
        `指定されたフェーズ ${targetPhaseId} は存在しません`,
        { phaseId: targetPhaseId }
      );
    }

    // 現在のフェーズがあれば終了処理
    if (this.currentPhase) {
      this.finalizeCurrentPhase();
    }

    // 遷移先フェーズの設定
    this.currentPhase = targetPhase;

    // 特定の遷移でターン数を増加（夜から昼への遷移時）
    if (targetPhaseId === 'day' && this.getPreviousPhaseContext()?.phaseId === 'night') {
      this.incrementTurn();
    }

    // フェーズ開始処理
    this.currentPhase.onPhaseStart(this.game);

    // フェーズ開始イベントの発火
    this.eventSystem.emit(`phase.start.${targetPhaseId}`, {
      phase: targetPhaseId,
      turn: this.currentTurn,
      displayName: this.currentPhase.displayName
    });

    // フェーズコンテキスト初期化
    this.setPhaseContext({});

    return this.currentPhase;
  }

  /**
   * 現在のフェーズを終了し、必要な後処理を行う
   * @private
   */
  finalizeCurrentPhase() {
    // フェーズ終了処理
    this.currentPhase.onPhaseEnd(this.game);

    // フェーズ終了イベントの発火
    this.eventSystem.emit(`phase.end.${this.currentPhase.id}`, {
      phase: this.currentPhase.id,
      turn: this.currentTurn,
      displayName: this.currentPhase.displayName
    });

    // コンテキストを完了状態に更新
    if (this.currentPhaseContext) {
      this.currentPhaseContext.endTime = Date.now();
      this.currentPhaseContext.status = 'completed';

      // 履歴に追加（phaseHistoryを確実に更新するために複製を作成して追加）
      const finalizedContext = { ...this.currentPhaseContext };

      // 履歴に追加（常に新しいエントリとして追加）
      this.phaseHistory.push(finalizedContext);
    }
  }

  /**
   * ターン数を増加させる
   * @returns {number} 新しいターン数
   */
  incrementTurn() {
    const previousTurn = this.currentTurn;
    this.currentTurn++;

    // ゲーム状態の更新
    this.game.gameState.updateState({
      turn: this.currentTurn
    });

    // ターン開始イベント発火
    this.eventSystem.emit('turn.start', {
      turn: this.currentTurn,
      previousTurn
    });

    return this.currentTurn;
  }

  /**
   * フェーズコンテキストを設定する
   * @param {Object} data - フェーズに関連するコンテキストデータ
   * @returns {Object} 設定されたコンテキスト
   */
  setPhaseContext(data) {
    // 履歴サイズが上限を超えた場合、古いものを削除
    if (this.phaseHistory.length >= this.options.maxHistorySize) {
      this.phaseHistory.shift();
    }

    this.currentPhaseContext = {
      phaseId: this.currentPhase.id,
      turn: this.currentTurn,
      startTime: Date.now(),
      endTime: null,
      status: 'in_progress',
      data: data || {}
    };

    return this.currentPhaseContext;
  }

  /**
   * 現在のフェーズコンテキストを取得する
   * @returns {Object} フェーズコンテキスト
   */
  getPhaseContext() {
    return this.currentPhaseContext || {
      phaseId: this.currentPhase?.id,
      turn: this.currentTurn,
      status: 'in_progress',
      data: {}
    };
  }

  /**
   * 前のフェーズのコンテキストを取得する
   * @returns {Object|null} 前のフェーズのコンテキスト、またはnull
   */
  getPreviousPhaseContext() {
    if (this.phaseHistory.length > 0) {
      return this.phaseHistory[this.phaseHistory.length - 1];
    }
    return null;
  }

  /**
   * フェーズコンテキストのデータを部分的に更新する
   * @param {Object} newData - 新しいデータ（部分的）
   * @returns {Object} 更新後のコンテキスト
   */
  updatePhaseContextData(newData) {
    if (!this.currentPhaseContext) {
      return this.setPhaseContext(newData);
    }

    this.currentPhaseContext.data = {
      ...this.currentPhaseContext.data,
      ...newData
    };

    return this.currentPhaseContext;
  }

  /**
   * ターン履歴を取得する
   * @returns {Array} ターン履歴
   */
  getTurnHistory() {
    return [...this.turnHistory];
  }

  /**
   * 新しいフェーズを登録する
   * @param {Object} phase - フェーズオブジェクト
   * @returns {boolean} 登録に成功したらtrue
   * @throws {Error} 既存のフェーズIDと衝突する場合
   */
  registerPhase(phase) {
    if (!phase || !phase.id) {
      throw this.errorHandler.createError(
        'INVALID_PHASE_DEFINITION',
        'フェーズには有効なIDが必要です',
        { phase }
      );
    }

    // 既存のフェーズとの衝突チェック
    if (this.phases[phase.id]) {
      throw this.errorHandler.createError(
        'DUPLICATE_PHASE',
        `フェーズID ${phase.id} は既に登録されています`,
        { phaseId: phase.id }
      );
    }

    // フェーズの登録
    this.phases[phase.id] = phase;

    return true;
  }

  /**
   * カスタム遷移ルールを登録する
   * @param {Object} transition - 遷移ルール定義
   * @returns {boolean} 登録に成功したらtrue
   * @throws {Error} 無効な遷移ルールの場合
   */
  registerTransition(transition) {
    if (!transition.sourcePhase || !transition.targetPhase) {
      throw this.errorHandler.createError(
        'INVALID_TRANSITION_RULE',
        '遷移ルールには sourcePhase と targetPhase が必要です',
        { transition }
      );
    }

    // 遷移ルールの正規化
    const normalizedTransition = {
      sourcePhase: transition.sourcePhase,
      targetPhase: transition.targetPhase,
      condition: transition.condition || (() => true),
      priority: transition.priority || 10,
      actions: transition.actions || []
    };

    // 優先度順に挿入位置を決定
    let insertIndex = 0;
    while (insertIndex < this.phaseTransitions.length &&
      this.phaseTransitions[insertIndex].priority >= normalizedTransition.priority) {
      insertIndex++;
    }

    // 遷移ルールを挿入
    this.phaseTransitions.splice(insertIndex, 0, normalizedTransition);

    return true;
  }
}

export default PhaseManager;