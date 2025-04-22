// src/service/gameManager/GameManagerAction.js

/**
 * GameManagerAction - GameManagerのアクション管理機能を提供するMix-in
 *
 * このモジュールは、夜フェーズでの役職能力（占い、護衛、襲撃など）の
 * 登録、実行、結果処理を担当します。
 *
 * @param {Class} GameManager - 拡張対象のGameManagerクラス
 * @returns {Class} - Mix-inが適用されたGameManagerクラス
 */
export default function GameManagerActionMixin(GameManager) {
  /**
   * アクションを登録します
   *
   * @param {Object} action - アクションオブジェクト
   * @param {string} action.type - アクションタイプ ('fortune', 'guard', 'attack' など)
   * @param {number} action.actor - アクション実行者のプレイヤーID
   * @param {number} action.target - アクション対象のプレイヤーID
   * @param {Object} [action.options] - アクション固有のオプション
   * @returns {Object} - 登録結果
   */
  GameManager.prototype.registerAction = function (action) {
    // 実装は次のステップで行います
    throw new Error('Not implemented');
  };

  /**
   * 登録されたアクションを実行します
   *
   * @returns {Array} - アクション実行結果の配列
   */
  GameManager.prototype.executeActions = function () {
    // 実装は次のステップで行います
    throw new Error('Not implemented');
  };

  /**
   * 特定プレイヤーのアクション結果を取得します
   *
   * @param {number} playerId - プレイヤーID
   * @param {Object} [options] - 取得オプション
   * @returns {Array} - アクション結果の配列
   */
  GameManager.prototype.getActionResults = function (playerId, options) {
    // 実装は次のステップで行います
    throw new Error('Not implemented');
  };

  /**
   * 特定のターンに実行されたアクションを取得します
   *
   * @param {number} turn - ターン数
   * @returns {Array} - アクションの配列
   */
  GameManager.prototype.getActionsByTurn = function (turn) {
    // 実装は次のステップで行います
    throw new Error('Not implemented');
  };

  /**
   * アクションをキャンセルします
   *
   * @param {string} actionId - キャンセルするアクションID
   * @param {string} [reason] - キャンセル理由
   * @returns {Object} - キャンセル結果
   */
  GameManager.prototype.cancelAction = function (actionId, reason) {
    // 実装は次のステップで行います
    throw new Error('Not implemented');
  };

  /**
   * 占い結果を取得します
   *
   * @param {number} targetId - 占われたプレイヤーID
   * @returns {string} - 占い結果
   */
  GameManager.prototype.getFortuneResult = function (targetId) {
    // 実装は次のステップで行います
    throw new Error('Not implemented');
  };

  // プライベートメソッド（内部用）
  /**
   * アクション結果を処理します
   *
   * @private
   * @param {Array} results - アクション実行結果の配列
   */
  GameManager.prototype._processActionResults = function (results) {
    // 実装は次のステップで行います
  };

  /**
   * 特定タイプのアクション結果をまとめて処理します
   *
   * @private
   * @param {string} actionType - アクションタイプ
   * @param {Array} results - 結果の配列
   */
  GameManager.prototype._processRoleActions = function (actionType, results) {
    // 実装は次のステップで行います
  };

  /**
   * 襲撃結果を処理します
   *
   * @private
   * @param {Object} result - 襲撃アクションの結果
   */
  GameManager.prototype._processAttackResult = function (result) {
    // 実装は次のステップで行います
  };

  /**
   * 護衛結果を処理します
   *
   * @private
   * @param {Object} result - 護衛アクションの結果
   */
  GameManager.prototype._processGuardResult = function (result) {
    // 実装は次のステップで行います
  };

  /**
   * 占い結果を処理します
   *
   * @private
   * @param {Object} result - 占いアクションの結果
   */
  GameManager.prototype._processFortuneResult = function (result) {
    // 実装は次のステップで行います
  };

  /**
   * カスタムアクション結果を処理します
   *
   * @private
   * @param {Object} result - カスタムアクションの結果
   */
  GameManager.prototype._processCustomActionResult = function (result) {
    // 実装は次のステップで行います
  };

  /**
   * 狐への占いによる呪殺を処理します
   *
   * @private
   * @param {number} targetId - 占われたプレイヤーID
   * @param {number} seerId - 占い師のプレイヤーID
   * @returns {boolean} - 呪殺が発生した場合にtrue
   */
  GameManager.prototype._processFoxCurse = function (targetId, seerId) {
    // 実装は次のステップで行います
    return false;
  };

  /**
   * 初日占いルールを適用します
   *
   * @private
   */
  GameManager.prototype._applyFirstNightFortuneRule = function () {
    // 実装は次のステップで行います
  };

  /**
   * 連続ガードルールを適用します
   *
   * @private
   * @param {number} guarderId - 騎士のプレイヤーID
   * @param {number} targetId - 護衛対象のプレイヤーID
   * @returns {boolean} - ガードが許可される場合にtrue
   */
  GameManager.prototype._checkConsecutiveGuardRule = function (guarderId, targetId) {
    // 実装は次のステップで行います
    return true;
  };

  /**
   * 未実行のアクションを自動的に処理します
   *
   * @private
   */
  GameManager.prototype._handleAutomaticNightActions = function () {
    // 実装は次のステップで行います
  };

  /**
   * アクション登録/実行時のゲーム状態を検証します
   *
   * @private
   * @returns {boolean} - 状態が有効な場合にtrue
   * @throws {Error} - 無効な状態の場合
   */
  GameManager.prototype._validateActionState = function () {
    // 実装は次のステップで行います
    return true;
  };

  /**
   * 特定のアクションが許可されるか検証します
   *
   * @private
   * @param {Object} action - 検証するアクション
   * @returns {Object} - 検証結果 { valid: boolean, reason: string }
   */
  GameManager.prototype._validateActionPermission = function (action) {
    // 実装は次のステップで行います
    return { valid: true };
  };

  return GameManager;
}

/**
 * アクション登録/実行時のゲーム状態を検証します
 *
 * @private
 * @returns {boolean} - 状態が有効な場合にtrue
 * @throws {Error} - 無効な状態の場合
 */
GameManager.prototype._validateActionState = function () {
  // ゲームが開始されているかチェック
  if (!this.isGameStarted()) {
    throw this.errorHandler.createError(
      'E4001',
      'GAME_NOT_STARTED',
      'ゲームが開始されていません'
    );
  }

  // ゲームが終了していないかチェック
  if (this.isGameEnded()) {
    throw this.errorHandler.createError(
      'E4002',
      'GAME_ALREADY_ENDED',
      'ゲームは既に終了しています'
    );
  }

  // 現在のフェーズが夜フェーズかチェック
  const currentPhase = this.getCurrentPhase();
  if (!currentPhase || currentPhase.id !== 'night') {
    throw this.errorHandler.createError(
      'E4003',
      'INVALID_PHASE',
      'アクションは夜フェーズでのみ登録できます'
    );
  }

  return true;
};

/**
 * 特定のアクションが許可されるか検証します
 *
 * @private
 * @param {Object} action - 検証するアクション
 * @returns {Object} - 検証結果 { valid: boolean, code: string, message: string }
 */
GameManager.prototype._validateActionPermission = function (action) {
  // アクションの基本形式チェック
  if (!action || typeof action !== 'object' || !action.type ||
    typeof action.actor !== 'number' || typeof action.target !== 'number') {
    return {
      valid: false,
      code: 'E4004',
      message: '無効なアクションフォーマットです'
    };
  }

  // アクター（実行者）の存在と生存チェック
  const actor = this.getPlayer(action.actor);
  if (!actor) {
    return {
      valid: false,
      code: 'E4005',
      message: '指定されたアクション実行者が存在しません'
    };
  }

  if (!actor.isAlive) {
    return {
      valid: false,
      code: 'E4005',
      message: '死亡したプレイヤーはアクションを実行できません'
    };
  }

  // ターゲット（対象）の存在チェック
  const target = this.getPlayer(action.target);
  if (!target) {
    return {
      valid: false,
      code: 'E4006',
      message: '指定されたアクション対象が存在しません'
    };
  }

  // 対象が生存しているかのチェック（一部のアクションでは死亡者も対象になる可能性あり）
  if (!target.isAlive && !['medium'].includes(action.type)) {
    return {
      valid: false,
      code: 'E4006',
      message: '死亡したプレイヤーはアクションの対象になれません'
    };
  }

  // アクター（実行者）の役職能力チェック
  if (this.roleManager) {
    const canUseAbility = this.roleManager.canUseAbility(
      action.actor,
      action.type,
      { night: this.state.turn, target: action.target }
    );

    if (!canUseAbility.allowed) {
      return {
        valid: false,
        code: 'E4007',
        message: canUseAbility.reason || 'このプレイヤーはこの能力を使用できません'
      };
    }
  }

  // アクションタイプに応じた特別なチェック
  switch (action.type) {
    case 'guard':
      // 連続ガード禁止ルールのチェック
      if (!this._checkConsecutiveGuardRule(action.actor, action.target)) {
        return {
          valid: false,
          code: 'E4008',
          message: '同じ対象を連続して護衛することはできません'
        };
      }
      break;

    // 他のアクションタイプに応じた検証...
  }

  return { valid: true };
}

/**
 * アクションを登録します
 *
 * @param {Object} action - アクションオブジェクト
 * @param {string} action.type - アクションタイプ ('fortune', 'guard', 'attack' など)
 * @param {number} action.actor - アクション実行者のプレイヤーID
 * @param {number} action.target - アクション対象のプレイヤーID
 * @param {Object} [action.options] - アクション固有のオプション
 * @returns {Object} - 登録結果
 */
GameManager.prototype.registerAction = function (action) {
  try {
    // ゲーム状態の検証
    this._validateActionState();

    // アクションの検証
    const validationResult = this._validateActionPermission(action);
    if (!validationResult.valid) {
      throw this.errorHandler.createError(
        validationResult.code,
        validationResult.message
      );
    }

    // 初日特有ルールの適用
    if (this.state.turn === 1) {
      if (action.type === 'fortune') {
        this._applyFirstNightFortuneRule(action);
      }
      // 他の初日特有ルール...
    }

    // アクション登録前イベント発火
    this.eventSystem.emit('action.register.before', {
      action,
      turn: this.state.turn,
      phase: this.getCurrentPhase().id
    });

    // アクションマネージャーにアクション登録
    const registrationResult = this.actionManager.registerAction({
      ...action,
      night: this.state.turn,
      timestamp: Date.now()
    });

    // アクション登録結果の構築
    const result = {
      success: true,
      actionId: registrationResult.actionId,
      replaced: registrationResult.replaced || false,
      pending: this.actionManager.getPendingActionsCount(this.state.turn)
    };

    // アクション登録後イベント発火
    this.eventSystem.emit('action.register.after', {
      actionId: result.actionId,
      action,
      turn: this.state.turn,
      phase: this.getCurrentPhase().id
    });

    // アクションタイプ別のイベント発火
    this.eventSystem.emit(`action.${action.type}.registered`, {
      actionId: result.actionId,
      actor: action.actor,
      target: action.target,
      turn: this.state.turn
    });

    // すべてのアクションが登録済みかチェック
    if (result.pending === 0) {
      this.eventSystem.emit('action.all_registered', {
        actions: this.actionManager.getRegisteredActions(this.state.turn),
        turn: this.state.turn,
        phase: this.getCurrentPhase().id
      });
    }

    return result;
  } catch (error) {
    // エラー処理
    this.eventSystem.emit('action.error', {
      error,
      action,
      context: {
        turn: this.state.turn,
        phase: this.getCurrentPhase() ? this.getCurrentPhase().id : null
      }
    });

    throw error;
  }
};

/**
 * 初日占いルールを適用します
 *
 * @private
 * @param {Object} action - 占いアクション
 */
GameManager.prototype._applyFirstNightFortuneRule = function (action) {
  const regulations = this.options?.regulations || {};
  const firstNightFortuneRule = regulations.firstNightFortune || 'free';

  // 初日占いルールの適用
  switch (firstNightFortuneRule) {
    case 'random_white':
      // ランダム白ルール: 初日占い結果は必ず「村人」
      action.options = action.options || {};
      action.options.forceResult = 'village';

      // 初日占いルール適用イベント発火
      this.eventSystem.emit('firstNight.fortune.rule', {
        rule: 'random_white',
        turn: this.state.turn
      });
      break;

    case 'random_target':
      // ランダム占い先ルール: 占い対象はランダムに決定
      const alivePlayers = this.getAlivePlayers()
        .filter(p => p.id !== action.actor) // 自分以外
        .map(p => p.id);

      if (alivePlayers.length > 0) {
        const randomIndex = Math.floor(this.random() * alivePlayers.length);
        action.target = alivePlayers[randomIndex];

        // 初日占いルール適用イベント発火
        this.eventSystem.emit('firstNight.fortune.rule', {
          rule: 'random_target',
          turn: this.state.turn,
          originalTarget: action.target,
          newTarget: action.target
        });
      }
      break;

    case 'free':
    default:
      // 自由占いルール: 制限なし
      break;
  }
};

/**
 * 連続ガードルールを適用します
 *
 * @private
 * @param {number} guarderId - 騎士のプレイヤーID
 * @param {number} targetId - 護衛対象のプレイヤーID
 * @returns {boolean} - ガードが許可される場合にtrue
 */
GameManager.prototype._checkConsecutiveGuardRule = function (guarderId, targetId) {
  const regulations = this.options?.regulations || {};
  const allowConsecutiveGuard = regulations.allowConsecutiveGuard !== false;

  // 連続ガード可能な場合は常に許可
  if (allowConsecutiveGuard) {
    return true;
  }

  // 連続ガード禁止の場合、前回のガード対象と比較
  const previousActions = this.actionManager.getActionsByTurn(this.state.turn - 1);
  const previousGuardAction = previousActions.find(
    a => a.type === 'guard' && a.actor === guarderId
  );

  // 前回ガードしていない場合は許可
  if (!previousGuardAction) {
    return true;
  }

  // 前回と同じ対象へのガードは禁止
  return previousGuardAction.target !== targetId;
};

/**
 * 登録されたアクションを実行します
 *
 * @returns {Array} - アクション実行結果の配列
 */
GameManager.prototype.executeActions = function () {
  try {
    // ゲーム状態の検証
    this._validateActionState();

    // 未登録アクションの自動処理
    this._handleAutomaticNightActions();

    // 状態スナップショットの作成（トランザクション開始）
    const stateSnapshot = this.createStateSnapshot ?
      this.createStateSnapshot() : JSON.parse(JSON.stringify(this.state));

    // アクション実行前イベント発火
    const actionsToExecute = this.actionManager.getRegisteredActions(this.state.turn);
    this.eventSystem.emit('action.execute.before', {
      actionsToExecute,
      turn: this.state.turn,
      phase: this.getCurrentPhase().id
    });

    // アクションの実行
    let results = [];
    try {
      results = this.actionManager.executeActions(this.state.turn);
    } catch (error) {
      // 実行エラー時の状態復元
      if (this.restoreStateSnapshot) {
        this.restoreStateSnapshot(stateSnapshot);
      } else {
        this.state = stateSnapshot;
      }
      throw error;
    }

    // アクション結果の処理
    this._processActionResults(results);

    // アクション実行後イベント発火
    this.eventSystem.emit('action.execute.after', {
      results,
      turn: this.state.turn,
      phase: this.getCurrentPhase().id
    });

    // 全体結果イベントの発火
    this.eventSystem.emit('action.results', {
      results,
      turn: this.state.turn
    });

    return results;
  } catch (error) {
    // エラー処理
    this.eventSystem.emit('action.error', {
      error,
      context: {
        turn: this.state.turn,
        phase: this.getCurrentPhase() ? this.getCurrentPhase().id : null
      }
    });

    throw error;
  }
};

/**
 * 未実行のアクションを自動的に処理します
 *
 * @private
 */
GameManager.prototype._handleAutomaticNightActions = function () {
  // 未登録のアクションを検出
  const eligibleRoles = this.roleManager.getRolesWithNightAction(this.state.turn);
  const registeredActions = this.actionManager.getRegisteredActions(this.state.turn);

  // 既に登録済みのアクターのIDを抽出
  const registeredActorIds = registeredActions.map(action => action.actor);

  // 未登録のアクターを特定
  const pendingActors = eligibleRoles.filter(
    role => !registeredActorIds.includes(role.playerId)
  );

  // 各未登録アクターに対して自動アクションを生成
  pendingActors.forEach(role => {
    // アクターが生存していることを確認
    const actor = this.getPlayer(role.playerId);
    if (!actor || !actor.isAlive) return;

    // 役職タイプに応じた自動アクション生成
    let autoAction = null;

    switch (role.name) {
      case 'seer': // 占い師
        // ランダムに対象を選択
        autoAction = this._createRandomFortuneAction(role.playerId);
        break;

      case 'werewolf': // 人狼
        // ランダムに襲撃対象を選択
        autoAction = this._createRandomAttackAction(role.playerId);
        break;

      case 'knight': // 騎士
        // ランダムに護衛対象を選択
        autoAction = this._createRandomGuardAction(role.playerId);
        break;

      // その他の役職...
    }

    // 自動アクションが生成された場合、登録
    if (autoAction) {
      try {
        const result = this.registerAction(autoAction);

        // 自動実行イベント発火
        if (result.success) {
          this.eventSystem.emit('action.auto_executed', {
            actionId: result.actionId,
            action: autoAction,
            reason: 'timeout',
            turn: this.state.turn
          });
        }
      } catch (error) {
        // 自動アクション登録エラーはログに記録するだけ
        console.warn(`自動アクション登録エラー: ${error.message}`);
      }
    }
  });
};

/**
 * ランダムな占いアクションを生成
 *
 * @private
 * @param {number} actorId - 占い師のプレイヤーID
 * @returns {Object|null} - 生成されたアクションまたはnull
 */
GameManager.prototype._createRandomFortuneAction = function (actorId) {
  // 占い対象の候補を取得（自分以外の生存プレイヤー）
  const targets = this.getAlivePlayers()
    .filter(p => p.id !== actorId)
    .map(p => p.id);

  if (targets.length === 0) return null;

  // ランダムに対象を選択
  const randomIndex = Math.floor(this.random() * targets.length);

  return {
    type: 'fortune',
    actor: actorId,
    target: targets[randomIndex]
  };
};

/**
 * ランダムな襲撃アクションを生成
 *
 * @private
 * @param {number} actorId - 人狼のプレイヤーID
 * @returns {Object|null} - 生成されたアクションまたはnull
 */
GameManager.prototype._createRandomAttackAction = function (actorId) {
  // 人狼以外の生存プレイヤーを取得
  const targets = this.getAlivePlayers()
    .filter(p => {
      const role = this.roleManager.getRole(p.id);
      return p.id !== actorId && role && role.name !== 'werewolf';
    })
    .map(p => p.id);

  if (targets.length === 0) return null;

  // ランダムに対象を選択
  const randomIndex = Math.floor(this.random() * targets.length);

  return {
    type: 'attack',
    actor: actorId,
    target: targets[randomIndex]
  };
};

/**
 * ランダムな護衛アクションを生成
 *
 * @private
 * @param {number} actorId - 騎士のプレイヤーID
 * @returns {Object|null} - 生成されたアクションまたはnull
 */
GameManager.prototype._createRandomGuardAction = function (actorId) {
  // 連続ガード禁止ルールを考慮した護衛対象候補を取得
  const targets = this.getAlivePlayers()
    .filter(p => {
      // 自分以外のプレイヤー
      if (p.id === actorId) return false;

      // 連続ガード禁止ルールのチェック
      return this._checkConsecutiveGuardRule(actorId, p.id);
    })
    .map(p => p.id);

  if (targets.length === 0) return null;

  // ランダムに対象を選択
  const randomIndex = Math.floor(this.random() * targets.length);

  return {
    type: 'guard',
    actor: actorId,
    target: targets[randomIndex]
  };
};

/**
 * 未実行のアクションを自動的に処理します
 *
 * @private
 */
GameManager.prototype._handleAutomaticNightActions = function () {
  // 未登録のアクションを検出
  const eligibleRoles = this.roleManager.getRolesWithNightAction(this.state.turn);
  const registeredActions = this.actionManager.getRegisteredActions(this.state.turn);

  // 既に登録済みのアクターのIDを抽出
  const registeredActorIds = registeredActions.map(action => action.actor);

  // 未登録のアクターを特定
  const pendingActors = eligibleRoles.filter(
    role => !registeredActorIds.includes(role.playerId)
  );

  // 各未登録アクターに対して自動アクションを生成
  pendingActors.forEach(role => {
    // アクターが生存していることを確認
    const actor = this.getPlayer(role.playerId);
    if (!actor || !actor.isAlive) return;

    // 役職タイプに応じた自動アクション生成
    let autoAction = null;

    switch (role.name) {
      case 'seer': // 占い師
        // ランダムに対象を選択
        autoAction = this._createRandomFortuneAction(role.playerId);
        break;

      case 'werewolf': // 人狼
        // ランダムに襲撃対象を選択
        autoAction = this._createRandomAttackAction(role.playerId);
        break;

      case 'knight': // 騎士
        // ランダムに護衛対象を選択
        autoAction = this._createRandomGuardAction(role.playerId);
        break;

      // その他の役職...
    }

    // 自動アクションが生成された場合、登録
    if (autoAction) {
      try {
        const result = this.registerAction(autoAction);

        // 自動実行イベント発火
        if (result.success) {
          this.eventSystem.emit('action.auto_executed', {
            actionId: result.actionId,
            action: autoAction,
            reason: 'timeout',
            turn: this.state.turn
          });
        }
      } catch (error) {
        // 自動アクション登録エラーはログに記録するだけ
        console.warn(`自動アクション登録エラー: ${error.message}`);
      }
    }
  });
};

/**
 * ランダムな占いアクションを生成
 *
 * @private
 * @param {number} actorId - 占い師のプレイヤーID
 * @returns {Object|null} - 生成されたアクションまたはnull
 */
GameManager.prototype._createRandomFortuneAction = function (actorId) {
  // 占い対象の候補を取得（自分以外の生存プレイヤー）
  const targets = this.getAlivePlayers()
    .filter(p => p.id !== actorId)
    .map(p => p.id);

  if (targets.length === 0) return null;

  // ランダムに対象を選択
  const randomIndex = Math.floor(this.random() * targets.length);

  return {
    type: 'fortune',
    actor: actorId,
    target: targets[randomIndex]
  };
};

/**
 * ランダムな襲撃アクションを生成
 *
 * @private
 * @param {number} actorId - 人狼のプレイヤーID
 * @returns {Object|null} - 生成されたアクションまたはnull
 */
GameManager.prototype._createRandomAttackAction = function (actorId) {
  // 人狼以外の生存プレイヤーを取得
  const targets = this.getAlivePlayers()
    .filter(p => {
      const role = this.roleManager.getRole(p.id);
      return p.id !== actorId && role && role.name !== 'werewolf';
    })
    .map(p => p.id);

  if (targets.length === 0) return null;

  // ランダムに対象を選択
  const randomIndex = Math.floor(this.random() * targets.length);

  return {
    type: 'attack',
    actor: actorId,
    target: targets[randomIndex]
  };
};

/**
 * ランダムな護衛アクションを生成
 *
 * @private
 * @param {number} actorId - 騎士のプレイヤーID
 * @returns {Object|null} - 生成されたアクションまたはnull
 */
GameManager.prototype._createRandomGuardAction = function (actorId) {
  // 連続ガード禁止ルールを考慮した護衛対象候補を取得
  const targets = this.getAlivePlayers()
    .filter(p => {
      // 自分以外のプレイヤー
      if (p.id === actorId) return false;

      // 連続ガード禁止ルールのチェック
      return this._checkConsecutiveGuardRule(actorId, p.id);
    })
    .map(p => p.id);

  if (targets.length === 0) return null;

  // ランダムに対象を選択
  const randomIndex = Math.floor(this.random() * targets.length);

  return {
    type: 'guard',
    actor: actorId,
    target: targets[randomIndex]
  };
};

/**
 * アクション結果を処理します
 *
 * @private
 * @param {Array} results - アクション実行結果の配列
 */
GameManager.prototype._processActionResults = function (results) {
  if (!Array.isArray(results) || results.length === 0) return;

  // アクションタイプごとに結果をグループ化
  const resultsByType = {};
  results.forEach(result => {
    if (!result.action || !result.action.type) return;

    const type = result.action.type;
    resultsByType[type] = resultsByType[type] || [];
    resultsByType[type].push(result);
  });

  // タイプごとの処理順序を定義（優先度順）
  const processingOrder = ['fortune', 'guard', 'attack'];

  // 定義された順序で処理
  processingOrder.forEach(type => {
    if (resultsByType[type]) {
      this._processRoleActions(type, resultsByType[type]);
    }
  });

  // その他のカスタムアクションタイプを処理
  Object.keys(resultsByType).forEach(type => {
    if (!processingOrder.includes(type)) {
      this._processRoleActions(type, resultsByType[type]);
    }
  });
};

/**
 * 特定タイプのアクション結果をまとめて処理します
 *
 * @private
 * @param {string} actionType - アクションタイプ
 * @param {Array} results - 結果の配列
 */
GameManager.prototype._processRoleActions = function (actionType, results) {
  if (!Array.isArray(results) || results.length === 0) return;

  // アクションタイプ別の処理
  switch (actionType) {
    case 'fortune': // 占い
      results.forEach(result => this._processFortuneResult(result));
      break;

    case 'guard': // 護衛
      results.forEach(result => this._processGuardResult(result));
      break;

    case 'attack': // 襲撃
      results.forEach(result => this._processAttackResult(result));
      break;

    default: // カスタムアクション
      results.forEach(result => this._processCustomActionResult(result));
      break;
  }
};

/**
 * 占い結果を処理します
 *
 * @private
 * @param {Object} result - 占いアクションの結果
 */
GameManager.prototype._processFortuneResult = function (result) {
  if (!result || !result.success || !result.action) return;

  const { actor: actorId, target: targetId } = result.action;

  // 占い師と対象プレイヤーの取得
  const actor = this.getPlayer(actorId);
  const target = this.getPlayer(targetId);

  if (!actor || !target) return;

  // 占い結果の取得
  let fortuneResult = result.outcome ? result.outcome.result : null;

  // 結果がなければ計算
  if (!fortuneResult) {
    fortuneResult = this.roleManager.getFortuneResult(targetId);
  }

  // 結果をプレイヤーの履歴に保存（占い師の情報として）
  if (actor.fortuneResults) {
    actor.fortuneResults.push({
      turn: this.state.turn,
      targetId,
      result: fortuneResult,
      targetName: target.name
    });
  }

  // 妖狐の呪殺処理
  const foxCursed = this._processFoxCurse(targetId, actorId);

  // 占い結果イベントの発火
  this.eventSystem.emit('action.fortune.result', {
    actorId,
    targetId,
    result: fortuneResult,
    foxCursed,
    turn: this.state.turn
  });
};

/**
 * 護衛結果を処理します
 *
 * @private
 * @param {Object} result - 護衛アクションの結果
 */
GameManager.prototype._processGuardResult = function (result) {
  if (!result || !result.success || !result.action) return;

  const { actor: actorId, target: targetId } = result.action;

  // 騎士と対象プレイヤーの取得
  const actor = this.getPlayer(actorId);
  const target = this.getPlayer(targetId);

  if (!actor || !target) return;

  // 護衛状態の設定
  if (this.playerManager.setGuardStatus) {
    this.playerManager.setGuardStatus(targetId, actorId);
  } else {
    // プレイヤーマネージャーに専用メソッドがない場合は状態効果として設定
    if (!target.statusEffects) target.statusEffects = [];
    target.statusEffects.push({
      type: 'guarded',
      by: actorId,
      turn: this.state.turn
    });
  }

  // 護衛履歴の更新（騎士の情報として）
  if (actor.guardHistory) {
    actor.guardHistory.push({
      turn: this.state.turn,
      targetId,
      targetName: target.name
    });
  }

  // 護衛イベントの発火
  this.eventSystem.emit('player.guarded', {
    playerId: targetId,
    guardedBy: actorId,
    turn: this.state.turn
  });
};

/**
 * 襲撃結果を処理します
 *
 * @private
 * @param {Object} result - 襲撃アクションの結果
 */
GameManager.prototype._processAttackResult = function (result) {
  if (!result || !result.action) return;

  const { actor: actorId, target: targetId } = result.action;

  // 人狼と対象プレイヤーの取得
  const actor = this.getPlayer(actorId);
  const target = this.getPlayer(targetId);

  if (!actor || !target) return;

  // 護衛状態のチェック
  let isGuarded = false;
  let guarderId = null;

  // プレイヤーマネージャーに専用メソッドがある場合
  if (this.playerManager.isGuarded) {
    const guardInfo = this.playerManager.isGuarded(targetId);
    isGuarded = guardInfo.guarded;
    guarderId = guardInfo.guarderId;
  }
  // ない場合は状態効果から判断
  else if (target.statusEffects) {
    const guardEffect = target.statusEffects.find(
      effect => effect.type === 'guarded' && effect.turn === this.state.turn
    );

    if (guardEffect) {
      isGuarded = true;
      guarderId = guardEffect.by;
    }
  }

  // 妖狐への襲撃かチェック（襲撃耐性）
  const targetRole = this.roleManager.getRole(targetId);
  const isFox = targetRole && targetRole.name === 'fox';
  const hasAttackImmunity = isFox;

  // 襲撃結果の決定
  if (isGuarded) {
    // 護衛成功
    this.eventSystem.emit('player.guard.success', {
      targetId,
      attackerId: actorId,
      guarderId,
      turn: this.state.turn
    });

    this.eventSystem.emit('player.attack.failed', {
      targetId,
      attackerId: actorId,
      reason: 'guarded',
      turn: this.state.turn
    });
  }
  else if (hasAttackImmunity) {
    // 襲撃耐性
    this.eventSystem.emit('player.attack.immune', {
      playerId: targetId,
      attackerId: actorId,
      reason: 'fox_immunity',
      turn: this.state.turn
    });

    this.eventSystem.emit('player.attack.failed', {
      targetId,
      attackerId: actorId,
      reason: 'target_immune',
      turn: this.state.turn
    });
  }
  else if (result.success === false) {
    // その他の理由による失敗
    this.eventSystem.emit('player.attack.failed', {
      targetId,
      attackerId: actorId,
      reason: result.reason || 'unknown',
      turn: this.state.turn
    });
  }
  else {
    // 襲撃成功 - 死亡処理
    this.killPlayer(targetId, 'werewolf_attack');

    // 襲撃成功イベントの発火
    this.eventSystem.emit('action.attack.success', {
      targetId,
      attackerId: actorId,
      turn: this.state.turn
    });
  }
};

/**
 * カスタムアクション結果を処理します
 *
 * @private
 * @param {Object} result - カスタムアクションの結果
 */
GameManager.prototype._processCustomActionResult = function (result) {
  if (!result || !result.action) return;

  const { type, actor: actorId, target: targetId } = result.action;

  // カスタムアクション結果イベントの発火
  this.eventSystem.emit(`action.${type}.result`, {
    actorId,
    targetId,
    success: result.success,
    outcome: result.outcome,
    turn: this.state.turn
  });

  // カスタムアクション処理プラグインがあれば実行
  if (this.customActionProcessors && this.customActionProcessors[type]) {
    this.customActionProcessors[type](result, {
      game: this,
      turn: this.state.turn
    });
  }
};

/**
 * 狐への占いによる呪殺を処理します
 *
 * @private
 * @param {number} targetId - 占われたプレイヤーID
 * @param {number} seerId - 占い師のプレイヤーID
 * @returns {boolean} - 呪殺が発生した場合にtrue
 */
GameManager.prototype._processFoxCurse = function (targetId, seerId) {
  // 対象が存在し、生存している狐であるか確認
  const target = this.getPlayer(targetId);
  if (!target || !target.isAlive) return false;

  const targetRole = this.roleManager.getRole(targetId);
  if (!targetRole || targetRole.name !== 'fox') return false;

  // 呪殺処理
  this.killPlayer(targetId, 'fox_curse');

  // 呪殺イベントの発火
  this.eventSystem.emit('player.cursed', {
    playerId: targetId,
    curseSource: seerId,
    turn: this.state.turn
  });

  return true;
};

/**
 * 特定プレイヤーのアクション結果を取得します
 *
 * @param {number} playerId - プレイヤーID
 * @param {Object} [options] - 取得オプション
 * @param {boolean} [options.asActor=true] - アクター（実行者）としての結果
 * @param {boolean} [options.asTarget=true] - ターゲット（対象）としての結果
 * @param {number} [options.turn] - 特定ターンの結果のみ
 * @returns {Array} - アクション結果の配列
 */
GameManager.prototype.getActionResults = function (playerId, options = {}) {
  // デフォルトオプション
  const opts = {
    asActor: true,
    asTarget: true,
    turn: null,
    ...options
  };

  // ゲーム開始状態の確認
  if (!this.isGameStarted()) {
    throw this.errorHandler.createError(
      'E4001',
      'GAME_NOT_STARTED',
      'ゲームが開始されていません'
    );
  }

  // プレイヤー存在確認
  const player = this.getPlayer(playerId);
  if (!player) {
    throw this.errorHandler.createError(
      'E4005',
      'PLAYER_NOT_FOUND',
      '指定されたプレイヤーが存在しません'
    );
  }

  // ActionManagerから結果取得
  const results = [];

  // アクターとしての結果
  if (opts.asActor) {
    const actorResults = this.actionManager.getActionResultsByActor(
      playerId,
      opts.turn
    );

    // 結果の整形
    actorResults.forEach(result => {
      results.push({
        turn: result.action.night || result.action.turn,
        type: result.action.type,
        role: 'actor',
        targetId: result.action.target,
        result: result.outcome,
        success: result.success
      });
    });
  }

  // ターゲットとしての結果
  if (opts.asTarget) {
    const targetResults = this.actionManager.getActionResultsByTarget(
      playerId,
      opts.turn
    );

    // 結果の整形（情報可視性を考慮）
    targetResults.forEach(result => {
      // アクションタイプによっては対象に結果を見せない
      if (['medium', 'guard'].includes(result.action.type)) {
        return;
      }

      results.push({
        turn: result.action.night || result.action.turn,
        type: result.action.type,
        role: 'target',
        actorId: result.action.actor,
        result: result.outcome,
        success: result.success
      });
    });
  }

  return results;
};

/**
 * 特定のターンに実行されたアクションを取得します
 *
 * @param {number} turn - ターン数
 * @returns {Array} - アクションの配列
 */
GameManager.prototype.getActionsByTurn = function (turn) {
  // ゲーム開始状態の確認
  if (!this.isGameStarted()) {
    throw this.errorHandler.createError(
      'E4001',
      'GAME_NOT_STARTED',
      'ゲームが開始されていません'
    );
  }

  // 無効なターンのチェック
  if (typeof turn !== 'number' || turn < 1 || turn > this.state.turn) {
    throw this.errorHandler.createError(
      'E4010',
      'INVALID_TURN',
      '無効なターン番号です'
    );
  }

  // ActionManagerからアクション履歴取得
  return this.actionManager.getActionsByTurn(turn);
};

/**
 * アクションをキャンセルします
 *
 * @param {string} actionId - キャンセルするアクションID
 * @param {string} [reason] - キャンセル理由
 * @returns {Object} - キャンセル結果
 */
GameManager.prototype.cancelAction = function (actionId, reason = 'user_cancel') {
  // ゲーム開始状態の確認
  if (!this.isGameStarted()) {
    throw this.errorHandler.createError(
      'E4001',
      'GAME_NOT_STARTED',
      'ゲームが開始されていません'
    );
  }

  // アクション存在確認
  const action = this.actionManager.getAction(actionId);
  if (!action) {
    throw this.errorHandler.createError(
      'E4009',
      'ACTION_NOT_FOUND',
      '指定されたアクションが存在しません'
    );
  }

  // アクションのキャンセル可能性チェック
  if (action.executed) {
    throw this.errorHandler.createError(
      'E4011',
      'ACTION_ALREADY_EXECUTED',
      '既に実行されたアクションはキャンセルできません'
    );
  }

  // アクションキャンセル前イベント発火
  this.eventSystem.emit('action.cancel.before', {
    actionId,
    action,
    reason,
    turn: this.state.turn
  });

  // アクションのキャンセル
  const cancelled = this.actionManager.cancelAction(actionId);

  // 代替アクション候補の生成
  const alternatives = [];
  if (cancelled && action.type) {
    // アクターと同じ役職のプレイヤーを取得
    const actor = this.getPlayer(action.actor);
    if (actor && actor.isAlive) {
      const actorRole = this.roleManager.getRole(action.actor);

      // アクションタイプに基づく代替候補
      switch (action.type) {
        case 'fortune': // 占い
        case 'guard': // 護衛
        case 'attack': // 襲撃
          // アクション対象になれる生存プレイヤーのリスト
          const eligibleTargets = this.getAlivePlayers()
            .filter(p => p.id !== action.actor)
            .map(p => ({
              id: p.id,
              name: p.name
            }));

          if (eligibleTargets.length > 0) {
            alternatives.push({
              type: action.type,
              targets: eligibleTargets
            });
          }
          break;
      }
    }
  }

  // 結果オブジェクトの構築
  const result = {
    success: cancelled,
    actionId,
    alternatives
  };

  // アクションキャンセル後イベント発火
  this.eventSystem.emit('action.cancel.after', {
    actionId,
    result,
    reason,
    turn: this.state.turn
  });

  return result;
};

/**
 * 占い結果を取得します
 *
 * @param {number} targetId - 占われたプレイヤーID
 * @returns {string} - 占い結果
 */
GameManager.prototype.getFortuneResult = function (targetId) {
  // ゲーム開始状態の確認
  if (!this.isGameStarted()) {
    throw this.errorHandler.createError(
      'E4001',
      'GAME_NOT_STARTED',
      'ゲームが開始されていません'
    );
  }

  // プレイヤー存在確認
  const target = this.getPlayer(targetId);
  if (!target) {
    throw this.errorHandler.createError(
      'E4006',
      'PLAYER_NOT_FOUND',
      '指定されたプレイヤーが存在しません'
    );
  }

  // RoleManagerから占い結果取得
  return this.roleManager.getFortuneResult(targetId);
};