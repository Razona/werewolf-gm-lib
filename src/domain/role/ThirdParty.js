/**
 * 人狼ゲームGM支援ライブラリの第三陣営クラス
 * 第三陣営役職の基底クラス
 */

import { Role } from './Role';
import { TEAMS } from '../../core/common/Constants';

/**
 * 第三陣営の基底クラス
 * 第三陣営共通の機能を提供する
 */
class ThirdParty extends Role {
  /**
   * ThirdPartyコンストラクタ
   * @param {Object} game - ゲームインスタンス
   */
  constructor(game) {
    super(game);
    this.team = TEAMS.FOX;
    this.metadata.winCondition = "カスタム勝利条件";
  }

  /**
   * 占い結果を返す
   * @returns {string} 占い結果 ('white'/'black')
   */
  getFortuneResult() {
    return 'white'; // 第三陣営は白判定（役職による上書き可能）
  }

  /**
   * 霊媒結果を返す
   * @returns {string} 霊媒結果 ('white'/'black')
   */
  getMediumResult() {
    return 'white'; // 第三陣営は白判定（役職による上書き可能）
  }

  /**
   * 勝利条件を取得
   * @returns {string} 勝利条件の説明
   */
  getWinCondition() {
    return "カスタム勝利条件";
  }
}

export { ThirdParty };