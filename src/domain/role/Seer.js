/**
 * 人狼ゲームGM支援ライブラリの占い師クラス
 */

import { Village } from './Village';
import { ROLES, ACTION_TYPES } from '../../core/common/Constants';

/**
 * 占い師役職クラス
 * 夜のフェーズに1人のプレイヤーを占い、人狼かどうかを判定できる
 */
class Seer extends Village {
  /**
   * Seerコンストラクタ
   * @param {Object} game - ゲームインスタンス
   */
  constructor(game) {
    super(game);
    this.name = ROLES.SEER;
    this.displayName = '占い師';

    // 使用可能なアクション
    this.actions = [ACTION_TYPES.FORTUNE];

    // 占い結果の履歴
    this.fortuneResults = [];

    // メタデータの設定
    this.metadata = {
      description: "占い師は夜に一人を占い、その人が人狼かどうかを知ることができる村の協力者。",
      abilities: [
        "夜フェーズに1人を選んで占うことができる（占った人が人狼かどうかがわかる）"
      ],
      winCondition: this.getWinCondition()
    };
  }

  /**
   * 能力が使用可能かどうかを判定
   * @param {number} night - 現在の夜数
   * @returns {boolean} 生存していれば使用可能
   */
  canUseAbility(night) {
    return this.isAlive;
  }

  /**
   * 能力の対象となり得るプレイヤーリストを取得
   * @returns {number[]} 対象プレイヤーIDのリスト（自分以外の生存プレイヤー）
   */
  getAbilityTargets() {
    if (this.playerId === null) {
      throw new Error('プレイヤーが割り当てられていません');
    }

    // 自分以外の生存プレイヤーを対象とする
    const alivePlayers = this.game.getAlivePlayers();
    return alivePlayers
      .filter(player => player.id !== this.playerId)
      .map(player => player.id);
  }

  /**
   * 占いアクションの登録
   * @param {number} targetId - 占い対象のプレイヤーID
   * @returns {Object} 登録結果
   */
  fortuneTell(targetId) {
    // プレイヤーIDの検証
    if (this.playerId === null) {
      throw new Error('プレイヤーが割り当てられていません');
    }

    // 対象プレイヤーの存在確認
    const targetPlayer = this.game.getPlayer(targetId);
    if (!targetPlayer) {
      throw new Error(`プレイヤーID ${targetId} は存在しません`);
    }

    // 現在の夜数を取得
    const night = this.game.phaseManager.getCurrentTurn();

    // アクションIDを生成
    const actionId = this.game.generateActionId();

    // アクションを登録
    this.game.eventSystem.emit('role.action.register', {
      id: actionId,
      type: ACTION_TYPES.FORTUNE,
      actor: this.playerId,
      target: targetId,
      night,
      priority: 100
    });

    return {
      success: true,
      actionId: actionId
    };
  }

  /**
   * 占いの実行
   * @param {number} targetId - 占い対象のプレイヤーID
   * @param {number} night - 現在の夜数
   * @returns {string} 占い結果
   */
  onNightAction(targetId, night) {
    // プレイヤーIDの検証
    if (typeof targetId !== 'number' || targetId < 0) {
      throw new Error('無効なターゲットIDです');
    }

    // 対象プレイヤーを取得
    const targetPlayer = this.game.getPlayer(targetId);
    if (!targetPlayer) {
      throw new Error(`プレイヤーID ${targetId} は存在しません`);
    }

    // 役職から占い結果を取得
    const fortuneResult = targetPlayer.role.getFortuneResult();

    // 結果を履歴に保存
    this.fortuneResults.push({
      night,
      targetId,
      targetName: targetPlayer.name,
      result: fortuneResult
    });

    // 妖狐を占った場合は呪殺イベントを発火
    if (targetPlayer.role.name === 'fox') {
      this.game.eventSystem.emit('fox.curse', {
        foxId: targetId,
        seerId: this.playerId,
        night
      });
    }

    // 結果を通知するイベント発火
    this.game.eventSystem.emit('role.action.result', {
      type: ACTION_TYPES.FORTUNE,
      actor: this.playerId,
      target: targetId,
      night,
      result: fortuneResult
    });

    return fortuneResult;
  }
}

export { Seer };