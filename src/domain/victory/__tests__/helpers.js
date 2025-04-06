/**
 * VictoryManagerテスト用のユーティリティ関数
 */

import { VictoryManager } from '../VictoryManager';

/**
 * テスト用のプレイヤーオブジェクトを作成する
 * @param {number} id - プレイヤーID
 * @param {string} roleName - 役職名
 * @param {string} team - 陣営
 * @param {boolean} isAlive - 生存状態
 * @param {Object} extraProps - 追加プロパティ
 * @returns {Object} プレイヤーオブジェクト
 */
export function createPlayerWithRole(id, roleName, team, isAlive = true, extraProps = {}) {
  return {
    id,
    name: `Player${id}`,
    isAlive,
    role: {
      name: roleName,
      team: team,
      getFortuneResult: () => roleName === 'werewolf' ? 'black' : 'white',
      ...extraProps
    }
  };
}

/**
 * テスト用のモックゲームを作成する
 * @param {Array} players - プレイヤー配列
 * @param {Object} options - オプション
 * @returns {Object} モックゲームオブジェクト
 */
export function createMockGame(players = [], options = {}) {
  return {
    getAlivePlayers: jest.fn().mockReturnValue(
      players.filter(player => player.isAlive)
    ),
    getAllPlayers: jest.fn().mockReturnValue(players),
    phaseManager: {
      getCurrentTurn: jest.fn().mockReturnValue(options.turn || 1),
      getCurrentPhase: jest.fn().mockReturnValue(options.phase || 'day')
    },
    eventSystem: {
      emit: jest.fn(),
      on: jest.fn()
    },
    options: {
      regulations: {
        ...(options.regulations || {})
      }
    }
  };
}

// VictoryManager class エクスポート
export { VictoryManager };