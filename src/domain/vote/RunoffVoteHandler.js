/**
 * RunoffVoteHandler - 決選投票の処理を担当するクラス
 *
 * 決選投票の開始、集計、同数処理などを担当します。
 *
 * @module domain/vote/RunoffVoteHandler
 */

import { randomElement } from '../../core/common/utils.js';

/**
 * 決選投票処理クラス
 */
export default class RunoffVoteHandler {
  /**
   * RunoffVoteHandlerのコンストラクタ
   *
   * @param {Object} game - ゲームインスタンス
   */
  constructor(game) {
    this.game = game;
    this.eventSystem = game.eventSystem;

    this._runoffAttempt = 0;
    this._maxRunoffAttempts = 3; // 最大決選投票回数（設定可能）
  }

  /**
   * 決選投票を開始する
   *
   * @param {Array} candidates - 決選投票の候補者ID配列
   * @param {Object} voteCollector - 投票収集オブジェクト
   * @returns {Object} 決選投票開始情報
   */
  startRunoffVote(candidates, voteCollector) {
    // 決選投票試行回数の増加
    this._runoffAttempt++;

    // 現在のターン数取得
    const currentTurn = this.game.phaseManager.getCurrentTurn();

    // 投票者リスト（生存プレイヤー）
    const voters = this.game.playerManager.getAlivePlayers().map(p => p.id);

    // 決選投票の対象は同数だった候補者
    const targets = candidates.filter(id =>
      this.game.playerManager.getPlayer(id)?.isAlive
    );

    // 投票情報の初期化
    voteCollector.initialize(voters, targets, "runoff", currentTurn);

    // 決選投票開始イベント発火 - attempt属性を削除
    this.eventSystem.emit('vote.runoff.start', {
      turn: currentTurn,
      voters: voters,
      candidates: targets
    });

    // 戻り値から attempt 属性を削除
    return {
      type: "runoff",
      voters: voters.length,
      candidates: targets.length
    };
  }

  /**
   * 決選投票の結果から処刑対象を決定する
   *
   * @param {Object} voteResult - 投票集計結果
   * @param {string} tieRule - 同数処理ルール
   * @returns {Object} 処刑対象情報
   */
  finalizeRunoffVote(voteResult, tieRule = 'random') {
    // 決選投票でも同数の場合
    if (voteResult.isTie) {
      // 決選投票同数ルールに基づいて処理
      const executionTarget = this.resolveRunoffTie(voteResult.maxVoted, tieRule);
      voteResult.executionTarget = executionTarget;
    } else {
      // 同数でない場合は最多得票者
      voteResult.executionTarget = voteResult.maxVoted[0];
    }

    // 決選投票結果イベント発火
    this.eventSystem.emit('vote.runoff.result', {
      ...voteResult,
      executionTarget: voteResult.executionTarget
    });

    return voteResult;
  }

  /**
   * 決選投票でも同数の場合の処理
   *
   * @param {Array} tiedPlayers - 同数得票者の配列
   * @param {string} tieRule - 同数処理ルール
   * @returns {number|string|null} 処刑対象ID、'all'、またはnull
   */
  resolveRunoffTie(tiedPlayers, tieRule) {
    switch (tieRule) {
      case 'random':
        // ランダムに1人選出
        return this.selectRandomTiedPlayer(tiedPlayers);

      case 'no_execution':
        // 処刑なし
        return null;

      case 'all_execution':
        // 全員処刑（特殊値）
        return 'all';

      default:
        // デフォルトはランダム
        return this.selectRandomTiedPlayer(tiedPlayers);
    }
  }

  /**
   * 同数得票者からランダムに1人を選択する
   *
   * @param {Array} candidates - 候補者ID配列
   * @returns {number|null} 選択されたプレイヤーID
   */
  selectRandomTiedPlayer(candidates) {
    if (!candidates || candidates.length === 0) {
      return null;
    }

    return randomElement(candidates);
  }

  /**
   * 同数時に決選投票が必要かどうか判断する
   *
   * @param {boolean} isTie - 同数かどうか
   * @param {string} executionRule - 実行ルール
   * @returns {boolean} 決選投票が必要かどうか
   */
  needsRunoffVote(isTie, executionRule) {
    // 同数でない場合は決選投票不要
    if (!isTie) {
      return false;
    }

    // 最大試行回数を超えていないか確認
    if (this._runoffAttempt >= this._maxRunoffAttempts) {
      return false; // 最大回数を超えた場合はランダム選出などの方法に
    }

    // ルールに基づいて決選投票が必要か判断
    switch (executionRule) {
      case 'runoff':
        return true; // 決選投票を行う
      case 'random':
        return false; // ランダム選出
      case 'no_execution':
        return false; // 処刑なし
      case 'all_execution':
        return false; // 全員処刑
      default:
        return true; // デフォルトは決選投票
    }
  }

  /**
   * 決選投票試行回数をリセットする
   */
  resetRunoffAttempt() {
    this._runoffAttempt = 0;
  }

  /**
   * 最大決選投票回数を設定する
   *
   * @param {number} maxAttempts - 最大試行回数
   */
  setMaxRunoffAttempts(maxAttempts) {
    if (maxAttempts > 0) {
      this._maxRunoffAttempts = maxAttempts;
    }
  }

  /**
   * 現在の決選投票試行回数を取得する
   *
   * @returns {number} 現在の試行回数
   */
  getRunoffAttempt() {
    return this._runoffAttempt;
  }
}