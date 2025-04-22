/**
 * GameManagerState.js
 *
 * GameManagerの状態管理機能を提供するMix-inモジュール。
 * ゲーム全体の状態の管理、状態変更の追跡、状態の永続化と復元などを担当します。
 */

/**
 * GameManagerState Mixin
 * GameManagerクラスに状態管理機能を追加します。
 *
 * @param {Function} GameManager - GameManagerクラス
 * @returns {Function} - 拡張されたGameManagerクラス
 */
export function applyGameManagerStateMixin(GameManager) {
  /**
   * 現在のゲーム状態を取得します
   *
   * @param {Object} [options] - 取得オプション
   * @param {boolean} [options.includeHistory=false] - 履歴を含めるか
   * @param {boolean} [options.includeDetails=true] - 詳細情報を含めるか
   * @param {Function} [options.filterFunction] - カスタムフィルター関数
   * @returns {Object} - 現在のゲーム状態
   */
  GameManager.prototype.getCurrentState = function (options = {}) {
    // オプションの準備
    const includeHistory = options.includeHistory === true;
    const includeDetails = options.includeDetails !== false;
    const filterFunction = typeof options.filterFunction === 'function' ? options.filterFunction : null;

    // 基本状態を構築（ディープコピーを避けるため、新しいオブジェクトを作成）
    const baseState = {
      id: this.state.id,
      isStarted: this.state.isStarted,
      isEnded: this.state.isEnded,
      turn: this.state.turn,
      phase: this.state.phase,
      winner: this.state.winner,
      lastUpdate: this.state.lastUpdate
    };

    // 詳細情報を追加
    let state = baseState;

    if (includeDetails) {
      // プレイヤー情報
      state.players = this.playerManager ? this.playerManager.getAllPlayers().map(player => ({
        id: player.id,
        name: player.name,
        isAlive: player.isAlive,
        role: player.role ? player.role.name : null,
        team: player.role ? player.role.team : null
      })) : [];

      // 役職情報
      state.roles = this.roleManager ? {
        list: this.roleManager.getRoleList(),
        distributed: this.roleManager.isDistributed()
      } : {};

      // 現在の投票状況
      state.votes = this.voteManager ? this.voteManager.getCurrentVotes() : [];

      // 保留中のアクション
      state.actions = this.actionManager ? this.actionManager.getPendingActions() : [];
    }

    // 履歴情報を追加
    if (includeHistory) {
      state.history = [...(this.state.history || [])];

      if (includeDetails) {
        // 投票履歴
        state.voteHistory = this.voteManager ? this.voteManager.getVoteHistory() : [];

        // アクション履歴
        state.actionHistory = this.actionManager ? this.actionManager.getActionHistory() : [];
      }
    }

    // カスタムフィルター適用
    if (filterFunction) {
      state = filterFunction(state);
    }

    // 最終更新日時を設定
    state.lastUpdate = Date.now();

    return state;
  };

  /**
   * ゲーム状態の要約を取得します
   *
   * @returns {Object} - ゲーム状態の要約
   */
  GameManager.prototype.getGameSummary = function () {
    // 生存プレイヤーの取得
    const players = this.playerManager ? this.playerManager.getAllPlayers() : [];
    const alivePlayers = this.playerManager ? this.playerManager.getAlivePlayers() : [];

    // 陣営分布の計算
    const teamDistribution = {};
    alivePlayers.forEach(player => {
      if (player.role && player.role.team) {
        teamDistribution[player.role.team] = (teamDistribution[player.role.team] || 0) + 1;
      }
    });

    // 役職分布の計算
    const roleDistribution = {};
    alivePlayers.forEach(player => {
      if (player.role) {
        roleDistribution[player.role.name] = (roleDistribution[player.role.name] || 0) + 1;
      }
    });

    // 要約情報の構築
    return {
      id: this.state.id,
      status: this.state.isEnded ? 'ended' : (this.state.isStarted ? 'in_progress' : 'ready'),
      turn: this.state.turn,
      phase: this.state.phase,
      players: {
        total: players.length,
        alive: alivePlayers.length,
        dead: players.length - alivePlayers.length
      },
      teams: teamDistribution,
      roles: roleDistribution,
      winner: this.state.winner,
      lastDeath: this.state.lastDeath,
      lastUpdate: this.state.lastUpdate,
      startTime: this.state.startTime,
      endTime: this.state.endTime
    };
  };

  /**
   * ゲームが開始されているか確認します
   *
   * @returns {boolean} - ゲームが開始されていればtrue
   */
  GameManager.prototype.isGameStarted = function () {
    // this.state が null や undefined の場合も考慮
    return this.state?.isStarted === true;
  };

  /**
   * ゲームが終了しているか確認します
   *
   * @returns {boolean} - ゲームが終了していればtrue
   */
  GameManager.prototype.isGameEnded = function () {
    // this.state が null や undefined の場合も考慮
    return this.state?.isEnded === true;
  };

  /**
   * ゲーム状態の履歴を取得します
   *
   * @param {Object} [options] - 履歴取得オプション
   * @param {number} [options.turn] - 特定ターンの履歴のみ取得
   * @param {number} [options.limit] - 取得する最大件数
   * @param {boolean} [options.reverse=true] - 新しい順に取得
   * @returns {Array} - 状態履歴の配列
   */
  GameManager.prototype.getStateHistory = function (options = {}) {
    // 履歴がない場合は空配列を返す
    if (!this.state || !this.state.history || !Array.isArray(this.state.history)) {
      return [];
    }

    // オプションの準備
    const turn = options.turn !== undefined ? options.turn : null;
    const limit = options.limit !== undefined ? options.limit : null;
    const reverse = options.reverse !== false;

    // 履歴データの取得
    let history = [...this.state.history];

    // 特定ターンのフィルタリング
    if (turn !== null) {
      history = history.filter(entry => entry.turn === turn);
    }

    // 並べ替え
    if (reverse) {
      history.reverse();
    }

    // 制限
    if (limit !== null && limit > 0) {
      history = history.slice(0, limit);
    }

    return history;
  };

  /**
   * ゲーム状態を部分的に更新します
   *
   * @param {Object} partialState - 更新する部分的な状態
   * @param {Object} [options] - 更新オプション
   * @param {boolean} [options.silent=false] - イベント発火を抑制するか
   * @param {boolean} [options.validate=true] - 更新前に検証するか
   * @param {boolean} [options.mergeArrays=false] - 配列をマージするか上書きするか
   * @returns {Object} - 更新された状態
   * @throws {Error} - 無効な更新データの場合
   */
  GameManager.prototype.updateState = function (partialState, options = {}) {
    // 状態が初期化されていない場合は初期化
    if (!this.state) {
      this.state = {
        id: `game-${Date.now()}`,
        isStarted: false,
        isEnded: false,
        turn: 0,
        phase: null,
        players: [],
        roles: {
          list: [],
          distributed: false,
          distribution: {}
        },
        votes: {
          current: [],
          history: []
        },
        actions: {
          pending: [],
          history: []
        },
        history: [],
        lastUpdate: Date.now()
      };
    }

    if (!partialState || typeof partialState !== 'object') {
      throw this.errorHandler.createError('STATE_INVALID_UPDATE', '更新データはオブジェクトでなければなりません');
    }

    // オプションの準備
    const silent = options.silent === true;
    const validate = options.validate !== false;
    const mergeArrays = options.mergeArrays === true;

    // 検証
    if (validate) {
      const validationResult = this.validateStateUpdate(partialState);
      if (validationResult !== true) {
        // ErrorHandlerを使用してエラーを生成し、それをスローする
        const error = this.errorHandler.createError(
          'STATE_VALIDATION_FAILED',
          `状態更新の検証に失敗しました: ${validationResult.message}`,
          { updateData: partialState, validationResult }
        );
        throw error; // エラーをスロー
      }
    }

    // 現在の状態のコピー
    const previousState = { ...this.state };

    // 更新前イベント発火
    if (!silent) {
      this.eventSystem.emit('state.update.before', {
        currentState: previousState,
        updates: partialState,
        source: options.source || 'api'
      });
    }

    // 状態の更新
    const updatedState = this.mergeStateUpdate(this.state, partialState, { mergeArrays });
    this.state = updatedState;

    // 最終更新時刻の設定
    this.state.lastUpdate = Date.now();

    // トランザクション中の場合は変更を記録
    if (this.inTransaction) {
      this.recordTransactionChange('update', {
        previous: previousState,
        current: this.state,
        delta: partialState
      });
    }

    // 更新後イベント発火
    if (!silent) {
      this.eventSystem.emit('state.update.after', {
        previousState,
        currentState: this.state,
        updates: partialState,
        changes: this.getChanges(previousState, this.state)
      });
    }

    return this.state;
  };

  /**
   * 状態の更新をマージする内部メソッド
   *
   * @private
   * @param {Object} currentState - 現在の状態
   * @param {Object} updates - 更新内容
   * @param {Object} [options] - マージオプション
   * @param {boolean} [options.mergeArrays=false] - 配列をマージするか上書きするか
   * @returns {Object} - マージされた状態
   */
  GameManager.prototype.mergeStateUpdate = function (currentState, updates, options = {}) {
    const mergeArrays = options.mergeArrays === true;

    // 新しいオブジェクトを作成
    const newState = { ...currentState };

    // 各フィールドを処理
    for (const [key, value] of Object.entries(updates)) {
      // 特殊ケース: 保護されたフィールド
      if (['id', 'version'].includes(key)) {
        continue; // これらのフィールドは更新しない
      }

      // 値が配列の場合
      if (Array.isArray(value)) {
        if (mergeArrays && Array.isArray(newState[key])) {
          // 配列のマージ（重複を許可）
          newState[key] = [...newState[key], ...value];
        } else {
          // 配列の置換
          newState[key] = [...value];
        }
      }
      // 値がオブジェクトの場合（配列・null以外）
      else if (value !== null && typeof value === 'object') {
        if (newState[key] !== null && typeof newState[key] === 'object') {
          // 深いマージ（再帰的に処理）
          newState[key] = this.mergeStateUpdate(newState[key], value, options);
        } else {
          // オブジェクトの置換（コピーを作成）
          newState[key] = { ...value };
        }
      }
      // プリミティブ値の場合
      else {
        // 直接代入
        newState[key] = value;
      }
    }

    return newState;
  };

  /**
   * 状態更新の検証を行います
   *
   * @private
   * @param {Object} updates - 検証する更新内容
   * @returns {boolean|Object} - 検証結果（有効な場合はtrue、無効な場合はエラー情報）
   */
  GameManager.prototype.validateStateUpdate = function (updates) {
    // *** デバッグログ削除 ***
    // console.log('[DEBUG] validateStateUpdate called with:', JSON.stringify(updates));

    // 基本的な検証
    if (!updates || typeof updates !== 'object') {
      return { valid: false, message: '更新データはオブジェクトでなければなりません' };
    }

    // 空オブジェクトのチェックを追加
    if (Object.keys(updates).length === 0) {
      return { valid: false, message: '更新データは空であってはなりません' };
    }

    // 保護フィールドの確認
    for (const key of ['id', 'version']) {
      if (updates[key] !== undefined) {
        return { valid: false, message: `\'${key}\'フィールドは保護されています` };
      }
    }

    // シリアライズ可能か（関数や循環参照がないか）を深くチェック
    const visited = new Set();
    function checkSerializable(target) {
      if (target === undefined || target === null) return true;
      if (typeof target === 'function') return false; // 関数はシリアライズ不可
      if (typeof target !== 'object') return true; // プリミティブ型はOK

      if (visited.has(target)) return false; // 循環参照を検出
      visited.add(target);

      let result = true;
      if (Array.isArray(target)) {
        for (const item of target) {
          if (!checkSerializable(item)) { // 正しい再帰呼び出し
            result = false;
            break;
          }
        }
      } else {
        // 通常のオブジェクト
        for (const key in target) {
          if (Object.prototype.hasOwnProperty.call(target, key)) {
            if (!checkSerializable(target[key])) { // 正しい再帰呼び出し
              result = false;
              break;
            }
          }
        }
      }

      visited.delete(target); // チェックが完了したらSetから削除
      return result;
    }

    if (!checkSerializable(updates)) {
      return { valid: false, message: 'シリアライズできない値（関数や循環参照など）が含まれています' };
    }

    // 念のためJSON.stringifyでのチェックも残す (深いチェックで検出できないエッジケース用)
    try {
      JSON.stringify(updates);
    } catch (error) {
      return { valid: false, message: 'シリアライズできない値が含まれています: ' + error.message };
    }

    // 値の型と範囲の検証
    if (updates.isStarted !== undefined && typeof updates.isStarted !== 'boolean') {
      return { valid: false, message: 'isStartedはブール値でなければなりません' };
    }

    if (updates.isEnded !== undefined && typeof updates.isEnded !== 'boolean') {
      return { valid: false, message: 'isEndedはブール値でなければなりません' };
    }

    if (updates.turn !== undefined && (typeof updates.turn !== 'number' || updates.turn < 0)) {
      return { valid: false, message: 'turnは0以上の数値でなければなりません' };
    }

    // 整合性検証
    if (updates.isEnded === true && (!this.state || !this.state.winner) && !updates.winner) {
      return { valid: false, message: '終了状態ではwinnerを指定する必要があります' };
    }

    // プレイヤー配列の検証
    if (updates.players !== undefined && !Array.isArray(updates.players)) {
      return { valid: false, message: 'playersは配列でなければなりません' };
    }

    // 成功
    return true;
  };

  /**
   * ゲーム状態を初期状態にリセットします
   *
   * @returns {Object} - 初期化された状態
   */
  GameManager.prototype.resetState = function () {
    const previousState = this.state ? { ...this.state } : null;

    // リセット前イベント発火
    this.eventSystem.emit('state.reset.before', {
      previousState,
      timestamp: Date.now()
    });

    // 固定の初期状態を生成（this.stateを参照しない）
    this.state = {
      id: this.state?.id || `game-${Date.now()}`, // IDは可能なら維持、なければ新規作成
      isStarted: false,
      isEnded: false,
      winner: null,
      winningPlayers: [],
      turn: 0,
      phase: null,
      players: [],
      roles: {
        list: [],
        distributed: false,
        distribution: {}
      },
      votes: {
        current: [],
        history: []
      },
      actions: {
        pending: [],
        history: []
      },
      history: [],
      lastUpdate: Date.now(),
      lastDeath: null
    };

    // リセット後イベント発火
    this.eventSystem.emit('state.reset.after', {
      previousState,
      currentState: this.state
    });

    return this.state;
  };

  /**
   * 2つの状態間の差分を取得します
   *
   * @private
   * @param {Object} stateA - 比較元の状態
   * @param {Object} stateB - 比較先の状態
   * @returns {Object} - 差分情報
   */
  GameManager.prototype.getChanges = function (stateA, stateB) {
    const changes = {
      updated: {},
      added: {},
      removed: {}
    };

    // 更新・追加されたフィールドの検出
    for (const [key, valueB] of Object.entries(stateB)) {
      // キーが元の状態に存在する場合
      if (key in stateA) {
        // 値が異なる場合は更新として記録
        if (JSON.stringify(stateA[key]) !== JSON.stringify(valueB)) {
          changes.updated[key] = {
            from: stateA[key],
            to: valueB
          };
        }
      } else {
        // キーが元の状態に存在しない場合は追加として記録
        changes.added[key] = valueB;
      }
    }

    // 削除されたフィールドの検出
    for (const key of Object.keys(stateA)) {
      if (!(key in stateB)) {
        changes.removed[key] = stateA[key];
      }
    }

    return changes;
  };

  /**
   * ゲーム状態を保存します
   *
   * @param {string} [saveId] - 保存識別子（省略時は自動生成）
   * @param {Object} [options] - 保存オプション
   * @param {Object} [options.metadata] - 追加のメタデータ
   * @param {boolean} [options.includeHistory=true] - 履歴を含めるか
   * @returns {Object} - 保存されたゲーム状態
   */
  GameManager.prototype.saveGameState = function (saveId, options = {}) {
    // 保存IDの準備
    const id = saveId || `save-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // オプションの準備
    const metadata = options.metadata || {};
    const includeHistory = options.includeHistory !== false;

    // 保存前イベント発火
    this.eventSystem.emit('state.save.before', {
      saveId: id,
      options,
      timestamp: Date.now()
    });

    // 完全なゲーム状態の構築
    const state = this.buildFullGameState({ includeHistory });

    // チェックサムの計算
    const checksum = this.calculateChecksum(state);

    // 保存データの構築
    const saveData = {
      id,
      gameId: this.state.id,
      version: GameManager.version,
      timestamp: Date.now(),
      state,
      metadata: {
        createdBy: 'system',
        description: '',
        ...metadata
      },
      checksum
    };

    // 保存後イベント発火
    this.eventSystem.emit('state.save.after', {
      saveId: id,
      saveData,
      options,
      timestamp: Date.now()
    });

    return saveData;
  };

  /**
   * 完全なゲーム状態を構築する内部メソッド
   *
   * @private
   * @param {Object} [options] - 構築オプション
   * @param {boolean} [options.includeHistory=true] - 履歴を含めるか
   * @returns {Object} - 完全なゲーム状態
   */
  GameManager.prototype.buildFullGameState = function (options = {}) {
    // オプションの準備
    const includeHistory = options.includeHistory !== false;

    // 基本状態の取得
    const state = {
      ...this.state,
      // 参照を断ち切るため、配列やオブジェクトはコピー
      players: this.playerManager ? this.playerManager.getAllPlayers().map(player => ({
        id: player.id,
        name: player.name,
        isAlive: player.isAlive,
        role: player.role ? {
          name: player.role.name,
          team: player.role.team
        } : null,
        statusEffects: player.statusEffects ? [...player.statusEffects] : [],
        causeOfDeath: player.causeOfDeath,
        deathTurn: player.deathTurn
      })) : [],

      // 役職情報
      roles: this.roleManager ? {
        list: this.roleManager.getRoleList(),
        distributed: this.roleManager.isDistributed(),
        distribution: { ...this.roleManager.getRoleDistribution() }
      } : {},

      // フェーズ情報
      phase: this.phaseManager ? this.phaseManager.getCurrentPhase() : null,

      // 投票情報
      votes: this.voteManager ? this.voteManager.getCurrentVotes() : [],

      // アクション情報
      actions: this.actionManager ? this.actionManager.getPendingActions() : []
    };

    // 履歴情報
    if (includeHistory) {
      state.history = [...(this.state.history || [])];

      // 投票履歴
      state.voteHistory = this.voteManager ? this.voteManager.getVoteHistory() : [];

      // アクション履歴
      state.actionHistory = this.actionManager ? this.actionManager.getActionHistory() : [];
    } else {
      state.history = [];
      state.voteHistory = [];
      state.actionHistory = [];
    }

    return state;
  };

  /**
   * チェックサムを計算する内部メソッド
   *
   * @private
   * @param {Object} data - チェックサム計算対象データ
   * @returns {string} - チェックサム
   */
  GameManager.prototype.calculateChecksum = function (data) {
    // 簡易的なチェックサム実装
    // 注: 本番環境では強力なハッシュアルゴリズムを使用する
    const str = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }

    return hash.toString(16);
  };

  /**
   * 保存されたゲーム状態から復元します
   *
   * @param {Object} saveData - 保存されたゲーム状態
   * @param {Object} [options] - 読み込みオプション
   * @param {boolean} [options.validateOnly=false] - 検証のみ行い、実際に復元しない
   * @param {boolean} [options.resetBeforeLoad=true] - 読み込み前に状態をリセットするか
   * @returns {boolean} - 復元成功時にtrue
   * @throws {Error} - 無効な保存データの場合
   */
  GameManager.prototype.loadGameState = function (saveData, options = {}) {
    // オプションの準備
    const validateOnly = options.validateOnly === true;
    const resetBeforeLoad = options.resetBeforeLoad !== false;

    // データの検証
    const validationResult = this.validateSaveData(saveData);
    if (validationResult !== true) {
      throw this.errorHandler.createError('STATE_SAVE_INVALID',
        `保存データの検証に失敗しました: ${validationResult.message}`);
    }

    // 検証のみモードの場合はここで終了
    if (validateOnly) {
      return true;
    }

    // 読み込み前イベント発火
    this.eventSystem.emit('state.load.before', {
      saveData,
      options,
      timestamp: Date.now()
    });

    // 現在の状態をバックアップ
    const previousState = { ...this.state };

    // 状態のリセット（オプション）
    if (resetBeforeLoad) {
      this.resetState();
    }

    try {
      // 保存データからの状態復元
      const state = saveData.state;

      // 基本状態の設定
      this.state = {
        ...this.state, // リセット時の基本状態を保持
        id: state.id,
        isStarted: state.isStarted,
        isEnded: state.isEnded,
        winner: state.winner,
        winningPlayers: state.winningPlayers ? [...state.winningPlayers] : [],
        turn: state.turn,
        phase: state.phase,
        history: state.history ? [...state.history] : [],
        lastUpdate: Date.now(),
        lastDeath: state.lastDeath
      };

      // プレイヤーの復元
      if (state.players && this.playerManager) {
        this.playerManager.restoreFromData(state.players);
      }

      // 役職の復元
      if (state.roles && this.roleManager) {
        this.roleManager.restoreFromData(state.roles);
      }

      // フェーズの復元
      if (state.phase && this.phaseManager) {
        this.phaseManager.restoreFromData(state.phase);
      } else if (this.phaseManager) {
        this.phaseManager.restoreFromData(null);
      }

      // 投票の復元
      if (state.votes && this.voteManager) {
        this.voteManager.restoreFromData(state.votes);
      }

      // アクションの復元
      if (state.actions && this.actionManager) {
        this.actionManager.restoreFromData(state.actions);
      }

      // 整合性の再確認
      // TODO: 整合性検証の実装

      // 読み込み後イベント発火
      this.eventSystem.emit('state.load.after', {
        saveId: saveData.id,
        previousState,
        currentState: this.state,
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      // エラー処理
      this.errorHandler.handleError(error, {
        context: 'loadGameState',
        saveData: saveData.id
      });

      // 状態の復元を試みる
      if (resetBeforeLoad) {
        this.resetState();
      } else {
        // 元の状態に戻す
        this.state = previousState;
      }

      // エラーを再スロー
      throw error;
    }
  };

  /**
   * 保存データの検証を行います
   *
   * @private
   * @param {Object} saveData - 検証する保存データ
   * @returns {boolean|Object} - 検証結果（有効な場合はtrue、無効な場合はエラー情報）
   */
  GameManager.prototype.validateSaveData = function (saveData) {
    // 基本的な検証
    if (!saveData || typeof saveData !== 'object') {
      return { valid: false, message: '保存データはオブジェクトでなければなりません' };
    }

    // 必須フィールドの確認
    const requiredFields = ['id', 'version', 'state', 'timestamp'];
    for (const field of requiredFields) {
      if (saveData[field] === undefined) {
        return { valid: false, message: `'${field}'フィールドが必要です` };
      }
    }

    // バージョン互換性の確認
    if (!GameManager.isCompatible(saveData.version)) {
      return { valid: false, message: `バージョン互換性がありません: ${saveData.version} vs ${GameManager.version}` };
    }

    // stateの検証
    if (!saveData.state || typeof saveData.state !== 'object') {
      return { valid: false, message: '状態データはオブジェクトでなければなりません' };
    }

    // チェックサムの検証（存在する場合）
    if (saveData.checksum) {
      const calculatedChecksum = this.calculateChecksum(saveData.state);
      if (calculatedChecksum !== saveData.checksum) {
        return { valid: false, message: 'チェックサムが一致しません（データが破損している可能性があります）' };
      }
    }

    // 成功
    return true;
  };

  /**
   * 古いバージョンの保存データを現在のバージョンに変換します
   *
   * @private
   * @param {Object} saveData - 変換する保存データ
   * @returns {Object} - 変換された保存データ
   */
  GameManager.prototype.migrateSaveData = function (saveData) {
    // バージョンチェック
    const saveVersion = saveData.version.split('.').map(Number);
    const currentVersion = GameManager.version.split('.').map(Number);

    // 同じバージョンならマイグレーション不要
    if (saveVersion[0] === currentVersion[0] &&
      saveVersion[1] === currentVersion[1]) {
      return saveData;
    }

    // 変換結果を新しいオブジェクトに格納
    let migratedData = { ...saveData };

    // バージョン別の変換処理
    // 例: 1.0.x → 1.1.x への変換
    if (saveVersion[0] === 1 && saveVersion[1] === 0 && currentVersion[1] >= 1) {
      // 変換処理の実装
      // 例: 新しいフィールドの追加やフォーマット変更
      migratedData.state = {
        ...migratedData.state,
        // 新しいフィールドのデフォルト値設定
        startTime: migratedData.state.startTime || migratedData.timestamp,
        // フォーマット変更の適用
      };

      // マイグレーションログの追加
      if (!migratedData.migrations) {
        migratedData.migrations = [];
      }

      migratedData.migrations.push({
        from: saveData.version,
        to: GameManager.version,
        timestamp: Date.now()
      });
    }

    // バージョン情報の更新
    migratedData.version = GameManager.version;

    // マイグレーションイベント発火
    this.eventSystem.emit('state.migrate', {
      fromVersion: saveData.version,
      toVersion: GameManager.version,
      changes: migratedData.migrations
    });

    return migratedData;
  };

  /**
   * トランザクションを開始します（変更の一括適用のため）
   *
   * @param {Object} [metadata] - トランザクションのメタデータ
   * @returns {boolean} - トランザクション開始成功時にtrue
   * @throws {Error} - トランザクションが既に開始されている場合
   */
  GameManager.prototype.beginTransaction = function (metadata = {}) {
    // 既にトランザクション中の場合はエラー
    if (this.inTransaction) {
      throw this.errorHandler.createError('STATE_TRANSACTION_ALREADY_ACTIVE',
        'トランザクションは既に開始されています');
    }

    // トランザクション状態の初期化
    this.inTransaction = true;
    this.transactionSnapshot = this.createStateSnapshot();
    this.transactionChanges = [];
    this.transactionTimestamp = Date.now();
    this.transactionMetadata = { ...metadata };

    // トランザクション開始イベント発火
    this.eventSystem.emit('state.transaction.begin', {
      metadata: this.transactionMetadata,
      timestamp: this.transactionTimestamp
    });

    return true;
  };

  /**
   * 現在の状態のスナップショットを作成します
   *
   * @private
   * @returns {Object} - 状態スナップショット
   */
  GameManager.prototype.createStateSnapshot = function () {
    // 注: 完全な深いコピーではなく、効率的なスナップショットを作成

    // 基本状態のコピー
    const snapshot = {
      state: { ...this.state },
      // 履歴は参照のみ保持（通常変更されない想定）
      history: this.state.history
    };

    // プレイヤー状態のコピー
    if (this.playerManager) {
      snapshot.players = this.playerManager.getAllPlayers().map(player => ({
        id: player.id,
        name: player.name,
        isAlive: player.isAlive,
        role: player.role ? { name: player.role.name, team: player.role.team } : null,
        statusEffects: player.statusEffects ? [...player.statusEffects] : [],
        causeOfDeath: player.causeOfDeath,
        deathTurn: player.deathTurn
      }));
    }

    // 役職情報のコピー
    if (this.roleManager) {
      snapshot.roles = {
        list: this.roleManager.getRoleList(),
        distributed: this.roleManager.isDistributed(),
        distribution: { ...this.roleManager.getRoleDistribution() }
      };
    }

    // フェーズ情報のコピー
    if (this.phaseManager) {
      snapshot.phase = this.phaseManager.getCurrentPhase();
    }

    // 投票情報のコピー
    if (this.voteManager) {
      snapshot.votes = this.voteManager.getCurrentVotes();
    }

    // アクション情報のコピー
    if (this.actionManager) {
      snapshot.actions = this.actionManager.getPendingActions();
    }

    // メタデータの設定
    snapshot.metadata = {
      timestamp: Date.now(),
      reason: 'transaction'
    };

    return snapshot;
  };

  /**
   * 状態スナップショットから状態を復元します
   *
   * @private
   * @param {Object} snapshot - 復元するスナップショット
   * @returns {boolean} - 復元成功時にtrue
   */
  GameManager.prototype.restoreStateSnapshot = function (snapshot) {
    if (!snapshot) {
      throw this.errorHandler.createError('STATE_SNAPSHOT_INVALID',
        'スナップショットが無効です');
    }

    try {
      // 基本状態の復元
      this.state = { ...snapshot.state };

      // プレイヤー状態の復元
      if (snapshot.players && this.playerManager) {
        this.playerManager.restoreFromData(snapshot.players);
      }

      // 役職の復元
      if (snapshot.roles && this.roleManager) {
        this.roleManager.restoreFromData(snapshot.roles);
      }

      // フェーズの復元
      if (snapshot.phase && this.phaseManager) {
        this.phaseManager.restoreFromData(snapshot.phase);
      } else if (this.phaseManager) {
        this.phaseManager.restoreFromData(null);
      }

      // 投票の復元
      if (snapshot.votes && this.voteManager) {
        this.voteManager.restoreFromData(snapshot.votes);
      }

      // アクションの復元
      if (snapshot.actions && this.actionManager) {
        this.actionManager.restoreFromData(snapshot.actions);
      }

      // 復元イベント発火
      this.eventSystem.emit('state.restore', {
        source: 'snapshot',
        reason: snapshot.metadata?.reason || 'manual',
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      this.errorHandler.handleError(error, {
        context: 'restoreStateSnapshot'
      });
      throw error;
    }
  };

  /**
   * トランザクション中の変更を記録します
   *
   * @private
   * @param {string} type - 変更タイプ（'update', 'add', 'remove'など）
   * @param {Object} data - 変更データ
   */
  GameManager.prototype.recordTransactionChange = function (type, data) {
    if (!this.inTransaction) {
      // トランザクション外での記録は警告のみ
      console.warn('トランザクション外での変更記録: トランザクションを開始してください');
      return;
    }

    // 変更情報の構築
    const change = {
      type,
      data,
      timestamp: Date.now()
    };

    // 変更ログへの追加
    this.transactionChanges.push(change);
  };

  /**
   * トランザクションをコミットします（変更を確定）
   *
   * @returns {boolean} - コミット成功時にtrue
   * @throws {Error} - アクティブなトランザクションがない場合
   */
  GameManager.prototype.commitTransaction = function () {
    // トランザクションが開始されていない場合はエラー
    if (!this.inTransaction) {
      throw this.errorHandler.createError('STATE_NO_ACTIVE_TRANSACTION',
        'アクティブなトランザクションがありません');
    }

    // コミット前イベント発火
    this.eventSystem.emit('state.transaction.commit.before', {
      changes: this.transactionChanges,
      metadata: this.transactionMetadata
    });

    // 変更の確定
    // すでに状態は更新されているため、追加の処理は必要ない

    // 変更履歴の処理
    // 必要に応じて履歴への追加などを行う

    // トランザクション状態のクリア
    const duration = Date.now() - this.transactionTimestamp;
    const changes = [...this.transactionChanges];
    const metadata = { ...this.transactionMetadata };

    this.inTransaction = false;
    this.transactionSnapshot = null;
    this.transactionChanges = [];
    this.transactionTimestamp = null;
    this.transactionMetadata = {};

    // コミット後イベント発火
    this.eventSystem.emit('state.transaction.commit', {
      changes,
      duration,
      metadata,
      timestamp: Date.now()
    });

    return true;
  };

  /**
   * トランザクションをロールバックします（変更を取り消し）
   *
   * @param {string} [reason] - ロールバック理由
   * @returns {boolean} - ロールバック成功時にtrue
   * @throws {Error} - アクティブなトランザクションがない場合
   */
  GameManager.prototype.rollbackTransaction = function (reason = 'manual') {
    // トランザクションが開始されていない場合はエラー
    if (!this.inTransaction) {
      throw this.errorHandler.createError('STATE_NO_ACTIVE_TRANSACTION',
        'アクティブなトランザクションがありません');
    }

    // スナップショットがない場合はエラー
    if (!this.transactionSnapshot) {
      throw this.errorHandler.createError('STATE_SNAPSHOT_INVALID',
        'トランザクションスナップショットが無効です');
    }

    // ロールバック前イベント発火
    this.eventSystem.emit('state.transaction.rollback.before', {
      changes: this.transactionChanges,
      reason,
      metadata: this.transactionMetadata
    });

    const previousState = this.getCurrentState({ deepCopy: true }); // State before rollback

    // --- スナップショットからの状態復元 ---
    try {
      // ★ 修正: Managerリセットではなく、スナップショットから復元するメソッドを呼ぶ
      this.restoreStateSnapshot(this.transactionSnapshot);

      // If managers need explicit restoration:
      // if (this.playerManager && snapshot.players) this.playerManager.restoreFromData(snapshot.players);
      // if (this.roleManager && snapshot.roles) this.roleManager.restoreFromData(snapshot.roles);
      // if (this.phaseManager && snapshot.phase) this.phaseManager.restoreFromData(snapshot.phase);
      // etc.

    } catch (error) {
      this.errorHandler.handleError(error, { context: 'rollbackTransaction', message: 'スナップショットからの状態復元に失敗しました' });
      // ロールバック失敗時の処理 (エラーをスローするか、不整合状態を許容するか)
      // ここではエラーをスローして失敗を通知
      throw error;
    }

    // トランザクション状態のクリア
    const duration = Date.now() - this.transactionTimestamp;
    const changes = [...this.transactionChanges];
    const metadata = { ...this.transactionMetadata };

    this.inTransaction = false;
    this.transactionSnapshot = null;
    this.transactionChanges = [];
    this.transactionTimestamp = null;
    this.transactionMetadata = {};

    // ロールバック後イベント発火
    this.eventSystem.emit('state.transaction.rollback', {
      changes,
      reason,
      duration,
      metadata,
      timestamp: Date.now()
    });

    return true;
  };

  /**
   * 現在トランザクション中かどうかを確認します
   *
   * @returns {boolean} - トランザクション中の場合にtrue
   */
  GameManager.prototype.isInTransaction = function () {
    return this.inTransaction === true;
  };

  /**
   * 状態変更の履歴を取得します
   *
   * @param {Object} [options] - 取得オプション
   * @param {number} [options.limit] - 取得する最大件数
   * @param {number} [options.since] - 特定のタイムスタンプ以降の変更のみ取得
   * @returns {Array} - 変更履歴の配列
   */
  GameManager.prototype.getStateChanges = function (options = {}) {
    // オプションの準備
    const limit = options.limit > 0 ? options.limit : null;
    const since = options.since > 0 ? options.since : 0;

    // 変更履歴の取得（実装されていれば）
    let changes = [];

    if (this.state && this.state.changeLog) {
      changes = [...this.state.changeLog];

      // タイムスタンプでフィルタリング
      if (since > 0) {
        changes = changes.filter(entry => entry.timestamp >= since);
      }

      // 新しい順に並べ替え
      changes.sort((a, b) => b.timestamp - a.timestamp);

      // 件数制限
      if (limit !== null) {
        changes = changes.slice(0, limit);
      }
    }

    return changes;
  };

  /**
   * デバッグ用の詳細な状態スナップショットを作成します
   *
   * @returns {Object} - デバッグ情報を含むスナップショット
   */
  GameManager.prototype.createDebugSnapshot = function () {
    // 基本状態のコピー
    const snapshot = this.buildFullGameState({ includeHistory: true });

    // デバッグメタデータの追加
    snapshot._debug = {
      timestamp: Date.now(),
      version: GameManager.version,
      inTransaction: this.inTransaction,
      eventListeners: this.eventSystem.listenerCount ? {
        total: this.eventSystem.eventNames().reduce((sum, name) =>
          sum + this.eventSystem.listenerCount(name), 0),
        byEvent: Object.fromEntries(
          this.eventSystem.eventNames().map(name =>
            [name, this.eventSystem.listenerCount(name)]
          )
        )
      } : { note: 'イベントリスナー情報を取得できません' }
    };

    // マネージャーデバッグ情報の追加
    if (this.playerManager && typeof this.playerManager.getDebugInfo === 'function') {
      snapshot._debug.playerManager = this.playerManager.getDebugInfo();
    }

    if (this.roleManager && typeof this.roleManager.getDebugInfo === 'function') {
      snapshot._debug.roleManager = this.roleManager.getDebugInfo();
    }

    if (this.phaseManager && typeof this.phaseManager.getDebugInfo === 'function') {
      snapshot._debug.phaseManager = this.phaseManager.getDebugInfo();
    }

    // 履歴情報の要約
    if (snapshot.history && snapshot.history.length > 0) {
      snapshot._debug.historyStats = {
        entries: snapshot.history.length,
        firstEntryTime: snapshot.history[0].timestamp,
        lastEntryTime: snapshot.history[snapshot.history.length - 1].timestamp
      };
    }

    // サイズを制限するため、履歴を要約に置き換え
    if (snapshot.history && snapshot.history.length > 10) {
      snapshot._debug.historySample = {
        first: snapshot.history.slice(0, 3),
        last: snapshot.history.slice(-3)
      };
      snapshot.history = `[${snapshot.history.length} entries]`;
    }

    return snapshot;
  };

  /**
   * 2つの状態を比較し、差分を取得します
   *
   * @param {Object} stateA - 比較元の状態
   * @param {Object} stateB - 比較先の状態
   * @returns {Object} - 差分情報
   */
  GameManager.prototype.compareStates = function (stateA, stateB) {
    // 基本的な差分情報
    const diff = {
      changes: this.getChanges(stateA, stateB),
      summary: {
        updatedFields: 0,
        addedFields: 0,
        removedFields: 0
      },
      metadata: {
        timestamp: Date.now(),
        stateAId: stateA.id,
        stateBId: stateB.id
      }
    };

    // 差分サマリーの集計
    diff.summary.updatedFields = Object.keys(diff.changes.updated).length;
    diff.summary.addedFields = Object.keys(diff.changes.added).length;
    diff.summary.removedFields = Object.keys(diff.changes.removed).length;

    // プレイヤー差分の詳細分析
    if (stateA.players && stateB.players) {
      // プレイヤー変更の詳細
      diff.players = {
        added: stateB.players.filter(p => !stateA.players.some(a => a.id === p.id)),
        removed: stateA.players.filter(p => !stateB.players.some(b => b.id === p.id)),
        changed: stateB.players.filter(p => {
          const playerA = stateA.players.find(a => a.id === p.id);
          return playerA && JSON.stringify(playerA) !== JSON.stringify(p);
        })
      };
    }

    // 役職差分の分析
    if (stateA.roles && stateB.roles) {
      diff.roles = {
        distributionChanged: JSON.stringify(stateA.roles.distribution) !== JSON.stringify(stateB.roles.distribution),
        listChanged: JSON.stringify(stateA.roles.list) !== JSON.stringify(stateB.roles.list)
      };
    }

    // フェーズ変更の分析
    if (stateA.phase !== stateB.phase) {
      diff.phaseChange = {
        from: stateA.phase,
        to: stateB.phase
      };
    }

    // ターン変更の分析
    if (stateA.turn !== stateB.turn) {
      diff.turnChange = {
        from: stateA.turn,
        to: stateB.turn
      };
    }

    return diff;
  };

  // GameManagerにStateMixinを追加して返す
  return GameManager;
}