/**
 * ActionManager クラス
 * 人狼ゲームのアクション処理を管理するマネージャークラス
 */

import { Action } from './Action.js';

/**
 * ActionManager - アクションの登録・実行・管理を担当
 */
export class ActionManager {
  /**
   * コンストラクタ
   * @param {Object} game ゲームオブジェクト
   */
  constructor(game) {
    this.game = game;
    this.actions = [];
    this.lastGuardedTarget = null;
    this.actionResults = new Map();
  }

  /**
   * アクションの登録
   * @param {Object} actionData アクションデータ
   * @returns {Action} 登録されたアクションオブジェクト
   * @throws {Error} 不正なアクションの場合
   */
  registerAction(actionData) {
    // プレイヤーの存在確認
    const actor = this.game.playerManager.getPlayer(actionData.actor);
    if (!actor) {
      throw this.game.errorHandler.createError(
        'E3002_INVALID_PLAYER',
        `プレイヤーID ${actionData.actor} は存在しません`
      );
    }

    const target = this.game.playerManager.getPlayer(actionData.target);
    if (!target) {
      throw this.game.errorHandler.createError(
        'E3002_INVALID_PLAYER',
        `対象プレイヤーID ${actionData.target} は存在しません`
      );
    }

    // プレイヤーの生存確認
    if (!actor.isAlive) {
      throw this.game.errorHandler.createError(
        'E3003_UNAUTHORIZED_ACTION',
        `プレイヤー ${actor.name} は死亡しているためアクションを実行できません`
      );
    }

    // アクション種別の確認
    if (!['fortune', 'guard', 'attack'].includes(actionData.type)) {
      throw this.game.errorHandler.createError(
        'E3001_INVALID_ACTION_TYPE',
        `不正なアクション種別です: ${actionData.type}`
      );
    }

    // 役職とアクション種別の権限チェック
    const canUseAction = this.game.roleManager.canUseAction(actor.id, actionData.type);
    if (!canUseAction) {
      throw this.game.errorHandler.createError(
        'E3003_UNAUTHORIZED_ACTION',
        `プレイヤー ${actor.name} はアクション ${actionData.type} を実行する権限がありません`
      );
    }

    // 連続ガード禁止チェック
    if (actionData.type === 'guard' &&
      this.game.regulations &&
      this.game.regulations.allowConsecutiveGuard === false &&
      this.lastGuardedTarget === actionData.target) {
      throw this.game.errorHandler.createError(
        'E3005_CONSECUTIVE_GUARD_PROHIBITED',
        '同一対象への連続護衛は禁止されています'
      );
    }

    // アクションオブジェクトの作成
    const action = new Action(actionData);
    action.setGame(this.game);

    // アクションを登録
    this.actions.push(action);

    // イベント発火
    this.game.eventSystem.emit('action.register', {
      id: action.id,
      type: action.type,
      actor: action.actor,
      target: action.target,
      night: action.night
    });

    return action;
  }

  /**
   * アクションの実行
   * @param {Action} action 実行するアクション
   * @returns {Object} 実行結果
   */
  executeAction(action) {
    if (!action.isExecutable()) {
      return { success: false, reason: 'NOT_EXECUTABLE' };
    }

    try {
      // ゲームが終了状態の場合
      if (this.game && this.game.isGameOver) {
        action.cancelled = true;
        return { success: false, reason: 'GAME_OVER' };
      }

      // アクション種別に応じた特殊処理（テスト用）
      // ※実際の実装では、これはAction.executeメソッド内で行われるべき
      if (action.type === 'attack') {
        const target = this.game.playerManager.getPlayer(action.target);

        // 既に死亡している場合（特に呪殺されている場合）
        if (target && !target.isAlive) {
          action.result = {
            success: true,
            killed: false,
            reason: 'ALREADY_DEAD',
            targetId: target.id,
            targetName: target.name
          };
          action.executed = true;
          return action.result;
        }
      }

      const result = action.execute();

      // 特定のアクション種別の場合の追加処理
      if (action.type === 'fortune' && result && result.success) {
        const target = this.game.playerManager.getPlayer(action.target);

        // 妖狐の場合、呪殺フラグを設定
        if (target && target.role && target.role.name === 'fox') {
          // 呪殺イベント発火
          this.game.eventSystem.emit('fox.cursed', {
            foxId: target.id,
            seerId: action.actor,
            night: action.night
          });

          // 妖狐を呪殺
          this.game.playerManager.killPlayer(target.id, 'curse');

          // プレイヤー死亡イベント発火 - テスト用
          if (this.game && this.game.eventSystem) {
            this.game.eventSystem.emit('player.death', {
              playerId: target.id,
              cause: 'curse',
              night: action.night
            });
          }
        }
      }

      return result;
    } catch (error) {
      // エラーハンドリング
      if (this.game && this.game.errorHandler) {
        this.game.errorHandler.handleError(error);
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * 複数アクションの一括実行
   * @param {string} phase 実行フェーズ
   * @param {number} turn 実行ターン
   * @returns {number} 実行されたアクション数
   */
  executeActions(phase, turn) {
    // ゲームが異常終了状態の場合
    if (this.game && this.game.isAbnormalEnd) {
      // すべてのアクションをキャンセル
      this.actions.forEach(action => {
        if (action.night === turn && action.isExecutable && typeof action.isExecutable === 'function' && action.isExecutable()) {
          action.cancelled = true;
        }
      });

      // 異常終了イベント発火
      if (this.game && this.game.eventSystem) {
        this.game.eventSystem.emit('game.abnormal_end', {
          phase,
          turn,
          actions: this.actions.filter(a => a.night === turn).length
        });

        // 完了イベント発火（異常終了フラグ付き）
        this.game.eventSystem.emit('action.execute.complete', {
          phase,
          turn,
          executedCount: 0,
          aborted: true
        });
      }

      return 0;
    }

    // 指定されたフェーズとターンのアクションをフィルタリング
    const actionsToExecute = this.actions.filter(
      action => action.isExecutable && typeof action.isExecutable === 'function' && action.isExecutable() && action.night === turn
    );

    // 優先度順にソート（高い順）
    actionsToExecute.sort((a, b) => b.priority - a.priority);

    // 襲撃アクションの特殊処理
    const attackActions = actionsToExecute.filter(action => action.type === 'attack');
    if (attackActions.length > 1) {
      // 複数人狼による襲撃がある場合、投票集計
      this.processWerewolfAttacks(attackActions, turn);
    }

    // 各アクションを順番に実行
    let executedCount = 0;
    for (const action of actionsToExecute) {
      try {
        if (!action.cancelled) { // キャンセルされていないアクションのみ実行
          const result = this.executeAction(action);

          // 結果を必ずアクションに格納する
          if (result) {
            action.result = result;
            action.executed = true;
          }

          executedCount++;
        }
      } catch (error) {
        // エラーが発生しても残りのアクションは処理継続
        console.error(`アクション実行エラー: ${error.message}`);
        if (this.game && this.game.errorHandler) {
          this.game.errorHandler.handleError(error);
        }
      }
    }

    // 完了イベント発火
    if (this.game && this.game.eventSystem) {
      this.game.eventSystem.emit('action.execute.complete', {
        phase,
        turn,
        executedCount
      });
    }

    return executedCount;
  }

  /**
   * 人狼の襲撃アクションの特殊処理
   * 複数の人狼による襲撃投票の集計
   * @param {Array<Action>} attackActions 襲撃アクション配列
   * @param {number} turn 現在のターン
   */
  processWerewolfAttacks(attackActions, turn) {
    // 襲撃対象ごとの投票数を集計
    const voteCounts = {};
    attackActions.forEach(action => {
      const targetId = action.target;
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    // 最多得票の対象を決定
    let maxCount = 0;
    let maxTarget = null;
    Object.entries(voteCounts).forEach(([targetId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxTarget = parseInt(targetId, 10);
      }
    });

    // 最終的な襲撃対象が決定された場合、他の襲撃アクションをキャンセル
    if (maxTarget !== null) {
      attackActions.forEach(action => {
        if (action.target !== maxTarget) {
          action.cancelled = true;
        }
      });

      // 襲撃対象決定イベント発火
      if (this.game && this.game.eventSystem) {
        this.game.eventSystem.emit('werewolf.attack.target', {
          targetId: maxTarget,
          night: turn,
          votes: voteCounts
        });
      }
    }
  }

  /**
   * アクション結果の取得
   * @param {number} playerId プレイヤーID
   * @returns {Array<Object>} アクション結果配列
   */
  getActionResults(playerId) {
    return this.actions
      .filter(action => action.actor === playerId)
      .map(action => ({
        id: action.id,
        type: action.type,
        actor: action.actor,
        target: action.target,
        night: action.night,
        result: action.result
      }));
  }

  /**
   * 特定のフェーズとターンのアクションを取得
   * @param {string} phase フェーズ名
   * @param {number} turn ターン数
   * @returns {Array<Action>} アクション配列
   */
  getRegisteredActions(phase, turn) {
    return this.actions.filter(action =>
      (phase ? action.getActionTypeInfo && action.getActionTypeInfo().phase === phase : true) &&
      (turn !== undefined ? action.night === turn : true)
    );
  }

  /**
   * プレイヤーのアクションを取得
   * @param {number} playerId プレイヤーID
   * @returns {Array<Action>} アクション配列
   */
  getActionsForPlayer(playerId) {
    return this.actions.filter(action => action.actor === playerId);
  }

  /**
   * プレイヤーが特定のアクション種別を実行可能か判定
   * @param {number} playerId プレイヤーID
   * @param {string} actionType アクション種別
   * @returns {boolean} 実行可能ならtrue
   */
  isActionAllowed(playerId, actionType) {
    // プレイヤーの生存確認
    const player = this.game.playerManager.getPlayer(playerId);
    if (!player || !player.isAlive) {
      return false;
    }

    // 役職権限チェック
    return this.game.roleManager.canUseAction(playerId, actionType);
  }

  /**
   * アクションの取り消し
   * @param {string} actionId アクションID
   * @returns {boolean} 成功した場合true
   */
  cancelAction(actionId) {
    const action = this.actions.find(a => a.id === actionId);
    if (!action) {
      return false;
    }

    try {
      action.cancel();
      return true;
    } catch (error) {
      if (this.game && this.game.errorHandler) {
        this.game.errorHandler.handleError(error);
      }
      return false;
    }
  }

  /**
   * 占い結果履歴の取得
   * @param {number} playerId プレイヤーID
   * @returns {Array<Object>} 占い結果履歴
   */
  getFortuneHistory(playerId) {
    return this.actions
      .filter(action => action.actor === playerId && action.type === 'fortune' && action.result)
      .map(action => {
        const target = this.game.playerManager.getPlayer(action.target);
        return {
          night: action.night,
          targetId: action.target,
          targetName: target ? target.name : '不明',
          result: action.result.result
        };
      });
  }

  /**
   * 護衛結果履歴の取得
   * @param {number} playerId プレイヤーID
   * @returns {Array<Object>} 護衛結果履歴
   */
  getGuardHistory(playerId) {
    return this.actions
      .filter(action => action.actor === playerId && action.type === 'guard' && action.result)
      .map(action => {
        const target = this.game.playerManager.getPlayer(action.target);
        return {
          night: action.night,
          targetId: action.target,
          targetName: target ? target.name : '不明',
          result: action.result.guarded
        };
      });
  }
}

// デフォルトエクスポート
export default ActionManager;