/**
 * ExecutionHandler - 処刑実行を担当するクラス
 * 
 * 投票結果に基づく処刑の実行と処理を担当します。
 * 
 * @module domain/vote/ExecutionHandler
 */

/**
 * 処刑実行クラス
 */
export default class ExecutionHandler {
  /**
   * ExecutionHandlerのコンストラクタ
   *
   * @param {Object} game - ゲームインスタンス
   */
  constructor(game) {
    this.game = game;
    this.eventSystem = game.eventSystem;
    this._regulations = game.options?.regulations || {
      revealRoleOnDeath: true
    };
  }

  /**
   * 投票結果から処刑対象を決定する
   *
   * @param {Object} voteResult - 投票集計結果
   * @param {string} executionRule - 処刑ルール
   * @param {Function} randomSelectFn - ランダム選択関数
   * @returns {Object} 処刑決定結果
   */
  determineExecutionTarget(voteResult, executionRule = 'runoff', randomSelectFn = null) {
    // 投票タイプに応じて処理
    if (voteResult.type === "execution") {
      // 通常投票の場合
      if (voteResult.isTie) {
        // 同数の場合は同数ルールに基づく
        const tieRule = executionRule;

        switch (tieRule) {
          case 'runoff':
            // 決選投票フェーズへ移行
            return {
              needsRunoff: true,
              candidates: voteResult.maxVoted
            };

          case 'random':
            // ランダム選出
            const randomTarget = randomSelectFn ? 
              randomSelectFn(voteResult.maxVoted) : 
              voteResult.maxVoted[Math.floor(Math.random() * voteResult.maxVoted.length)];
            
            return {
              needsRunoff: false,
              executionTarget: randomTarget
            };

          case 'no_execution':
            // 処刑なし
            return { needsRunoff: false, executionTarget: null };

          case 'all_execution':
            // 全員処刑
            return { needsRunoff: false, executionTarget: 'all' };

          default:
            // デフォルトは決選投票
            return {
              needsRunoff: true,
              candidates: voteResult.maxVoted
            };
        }
      } else {
        // 同数でない場合は最多得票者
        return {
          needsRunoff: false,
          executionTarget: voteResult.maxVoted[0]
        };
      }
    } else if (voteResult.type === "runoff") {
      // 決選投票の結果をそのまま返す
      return {
        needsRunoff: false,
        executionTarget: voteResult.executionTarget
      };
    }

    // 不明な投票タイプの場合
    return { needsRunoff: false, executionTarget: null };
  }

  /**
   * 処刑を実行する
   *
   * @param {number|string|null} targetId - 処刑対象ID、'all'、またはnull
   * @returns {Object} 処刑結果
   */
  executeTarget(targetId) {
    // 処刑なしの場合
    if (targetId === null) {
      // 処刑なしイベント発火
      this.eventSystem.emit('execution.none', {
        turn: this.game.phaseManager.getCurrentTurn(),
        reason: 'no_execution_rule'
      });

      return { executed: false, reason: 'no_execution' };
    }

    // 全員処刑の特殊ケース
    if (targetId === 'all') {
      return this.executeAllCandidates();
    }

    // 通常の処刑
    const target = this.game.playerManager.getPlayer(targetId);
    if (!target || !target.isAlive) {
      return {
        executed: false,
        reason: 'INVALID_TARGET'
      };
    }

    // 処刑前イベント発火
    this.eventSystem.emit('execution.before', {
      targetId,
      playerName: target.name,
      turn: this.game.phaseManager.getCurrentTurn()
    });

    // 処刑効果（死亡）の適用
    this.game.playerManager.killPlayer(targetId, 'execution');

    // 役職公開（設定に応じて）
    const revealRole = this._regulations.revealRoleOnDeath;
    const roleInfo = revealRole ? { role: target.role?.name } : {};

    // 処刑後イベント発火
    this.eventSystem.emit('execution.after', {
      targetId,
      playerName: target.name,
      turn: this.game.phaseManager.getCurrentTurn(),
      ...roleInfo
    });

    return {
      executed: true,
      targetId,
      playerName: target.name
    };
  }

  /**
   * 複数の候補者を全員処刑する（全員処刑ルール用）
   *
   * @param {Array} targetIds - 処刑対象IDの配列
   * @returns {Object} 処刑結果
   */
  executeAllCandidates(targetIds) {
    // 処刑対象リストが指定されていない場合は何もしない
    if (!targetIds || targetIds.length === 0) {
      return { executed: false, reason: 'NO_CANDIDATES' };
    }

    // 全員処刑前イベント発火
    this.eventSystem.emit('execution.all.before', {
      targetIds,
      turn: this.game.phaseManager.getCurrentTurn()
    });

    // 各対象の処刑処理
    const executedTargets = [];
    for (const targetId of targetIds) {
      const target = this.game.playerManager.getPlayer(targetId);
      if (target && target.isAlive) {
        this.game.playerManager.killPlayer(targetId, 'execution');
        executedTargets.push({
          id: targetId,
          name: target.name,
          role: this._regulations.revealRoleOnDeath ? target.role?.name : undefined
        });
      }
    }

    // 全員処刑後イベント発火
    this.eventSystem.emit('execution.all.after', {
      targets: executedTargets,
      turn: this.game.phaseManager.getCurrentTurn()
    });

    return {
      executed: true,
      targets: executedTargets
    };
  }
}
