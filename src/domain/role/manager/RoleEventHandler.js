/**
 * 役職関連のイベント処理を担当するクラス
 */
export class RoleEventHandler {
  constructor(roleManager) {
    this.roleManager = roleManager;
  }

  /**
   * イベントリスナーを初期化する
   */
  initializeEventListeners() {
    this.roleManager.eventSystem.on('player.death', (data) => this.handlePlayerDeath(data));
    this.roleManager.eventSystem.on('phase.start.*', (data) => {
      const phaseName = data.phase || data.name || 'unknown';
      const phaseData = typeof data === 'string' ? { phase: data } : data;
      this.handlePhaseStart(phaseName, phaseData);
    });
    this.roleManager.eventSystem.on('game.start', (data) => this.handleGameStart(data));
  }

  /**
   * プレイヤー死亡イベントを処理する
   * @param {Object} data - イベントデータ
   */
  handlePlayerDeath(data) {
    const { playerId, cause } = data;
    const role = this.roleManager.roleAssignment.getPlayerRole(playerId);

    if (!role) return;

    if (typeof role.onDeath === 'function') {
      try {
        role.onDeath(cause);
      } catch (error) {
        const wrappedError = this.roleManager.errorHandler.createError('ROLE_EVENT_HANDLER_ERROR',
          `Error in onDeath handler for role ${role.name}`,
          { playerId, roleName: role.name, cause, originalError: error });
        this.roleManager.errorHandler.handleError(wrappedError);
      }
    }
  }

  /**
   * フェーズ開始イベントを処理する
   * @param {string} phase - フェーズ名
   * @param {Object} data - イベントデータ
   */
  handlePhaseStart(phase, data) {
    const phaseData = {
      ...data,
      phase,
      turn: data.turn || 1
    };
    this.notifyPhaseChange(phase, phaseData);
  }

  /**
   * ゲーム開始イベントを処理する
   * @param {Object} data - イベントデータ
   */
  handleGameStart(data) {
    this.notifyGameStart();
  }

  /**
   * 全ての役職に対してライフサイクルメソッドを呼び出す
   * @param {string} methodName - 呼び出すメソッド名
   * @param {...*} args - メソッドに渡す引数
   * @return {Array} - 実行結果の配列
   */
  triggerRoleLifecycleMethod(methodName, ...args) {
    const results = [];

    for (const [playerId, role] of this.roleManager.roleAssignment.getRolesByPlayerId()) {
      if (typeof role[methodName] === 'function') {
        try {
          const result = role[methodName](...args);
          results.push({
            playerId,
            role: role.name,
            result
          });
        } catch (error) {
          const wrappedError = this.roleManager.errorHandler.createError('ROLE_LIFECYCLE_ERROR',
            `Error in role lifecycle method ${methodName} for role ${role.name}`,
            { playerId, roleName: role.name, originalError: error });
          this.roleManager.errorHandler.handleError(wrappedError);

          results.push({
            playerId,
            role: role.name,
            error: wrappedError
          });
        }
      }
    }

    return results;
  }

  /**
   * すべての役職を初期化する
   * @return {Array} - 初期化結果の配列
   */
  initializeAllRoles() {
    const results = this.triggerRoleLifecycleMethod('initialize');

    this.roleManager.eventSystem.emit('roles.initialized', {
      results
    });

    return results;
  }

  /**
   * ゲーム開始を全役職に通知する
   * @return {Array} - 実行結果の配列
   */
  notifyGameStart() {
    const results = this.triggerRoleLifecycleMethod('onGameStart');

    this.roleManager.eventSystem.emit('role.game.initialized', { results });
    this.roleManager.eventSystem.emit('game.roleInitialized', { results });

    return results;
  }

  /**
   * フェーズ変更を全役職に通知する
   * @param {string} phase - フェーズ名
   * @param {Object} data - フェーズに関連するデータ
   * @return {Array} - 実行結果の配列
   */
  notifyPhaseChange(phase, data) {
    const results = this.triggerRoleLifecycleMethod('onPhaseStart', phase, data);

    this.roleManager.eventSystem.emit('phase.role.started', {
      phase,
      data,
      results
    });

    return results;
  }

  /**
   * ターン終了を全役職に通知する
   * @param {Object} turnData - ターンに関連するデータ
   * @return {Array} - 実行結果の配列
   */
  notifyTurnEnd(turnData) {
    return this.triggerRoleLifecycleMethod('onTurnEnd', turnData);
  }

  /**
   * 役職能力対象イベントを処理する
   * @param {Object} data - イベントデータ
   */
  handleTargetedAction(data) {
    const { type, actor, target, result } = data;
    const targetRole = this.roleManager.roleAssignment.getPlayerRole(target);

    if (!targetRole) return;

    if (typeof targetRole.onTargeted === 'function') {
      try {
        targetRole.onTargeted(type, actor, data);
      } catch (error) {
        const wrappedError = this.roleManager.errorHandler.createError('ROLE_EVENT_HANDLER_ERROR',
          `Error in onTargeted handler for role ${targetRole.name}`,
          { target, roleName: targetRole.name, actionType: type, actor, originalError: error });
        this.roleManager.errorHandler.handleError(wrappedError);
      }
    }
  }

  /**
   * 役職関連のイベントを発火する
   * @param {string} eventName - イベント名
   * @param {Object} data - イベントデータ
   */
  emitRoleEvent(eventName, data) {
    this.roleManager.eventSystem.emit(eventName, data);
  }
}