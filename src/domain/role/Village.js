/**
 * 人狼ゲームGM支援ライブラリの村人陣営クラス
 * 村人陣営役職の基底クラス
 */

import { Role } from './Role';
import { TEAMS } from '../../core/common/Constants';

/**
 * 村人陣営の基底クラス
 * 村人陣営共通の機能を提供する
 */
class Village extends Role {
  /**
   * Villageコンストラクタ
   * @param {Object} game - ゲームインスタンス
   */
  constructor(game) {
    super(game);
    this.team = TEAMS.VILLAGE;
    this.metadata.winCondition = "すべての人狼を追放することで勝利します";
  }

  /**
   * 占い結果を返す
   * @returns {string} 占い結果 ('white'/'black')
   */
  getFortuneResult() {
    return 'white'; // 村人陣営は白判定
  }

  /**
   * 霊媒結果を返す
   * @returns {string} 霊媒結果 ('white'/'black')
   */
  getMediumResult() {
    return 'white'; // 村人陣営は白判定
  }

  /**
   * 勝利条件を取得
   * @returns {string} 勝利条件の説明
   */
  getWinCondition() {
    return "すべての人狼を追放することで勝利します";
  }
}

export { Village };