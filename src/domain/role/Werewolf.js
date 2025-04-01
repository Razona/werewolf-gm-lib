/**
 * 人狼ゲームGM支援ライブラリの人狼陣営クラス
 * 人狼陣営役職の基底クラス
 */

import { Role } from './Role';
import { TEAMS } from '../../core/common/Constants';

/**
 * 人狼陣営の基底クラス
 * 人狼陣営共通の機能を提供する
 */
class Werewolf extends Role {
  /**
   * Werewolfコンストラクタ
   * @param {Object} game - ゲームインスタンス
   */
  constructor(game) {
    super(game);
    this.team = TEAMS.WEREWOLF;
    this.metadata.winCondition = "村人の数が人狼の数以下になったときに勝利します";
    
    // 人狼特有の能力設定
    this.actions = ['attack'];
  }

  /**
   * 占い結果を返す
   * @returns {string} 占い結果 ('white'/'black')
   */
  getFortuneResult() {
    return 'black'; // 人狼陣営は黒判定
  }

  /**
   * 霊媒結果を返す
   * @returns {string} 霊媒結果 ('white'/'black')
   */
  getMediumResult() {
    return 'black'; // 人狼陣営は黒判定
  }

  /**
   * 能力が使用可能かどうかを判定
   * @param {number} [night] - 現在の夜数
   * @returns {boolean} 能力が使用可能かどうか
   */
  canUseAbility(night) {
    // 実装例: 生存している人狼が存在する場合のみ能力を使用可能
    const alivePlayers = this.game.getAlivePlayers();
    const aliveWerewolves = alivePlayers.filter(player => 
      player.role && player.role.team === TEAMS.WEREWOLF
    );
    
    return aliveWerewolves.length > 0;
  }

  /**
   * 能力の対象となり得るプレイヤーリストを取得
   * @returns {number[]} 対象プレイヤーIDのリスト
   */
  getAbilityTargets() {
    // プレイヤーIDチェック
    if (this.playerId === null) {
      throw new Error('プレイヤーが割り当てられていません');
    }
    
    // 人狼以外の生存プレイヤーを対象とする
    const alivePlayers = this.game.getAlivePlayers();
    return alivePlayers
      .filter(player => 
        player.role && 
        player.role.team !== TEAMS.WEREWOLF && 
        player.id !== this.playerId
      )
      .map(player => player.id);
  }

  /**
   * 勝利条件を取得
   * @returns {string} 勝利条件の説明
   */
  getWinCondition() {
    return "村人の数が人狼の数以下になったときに勝利します";
  }
}

export { Werewolf };