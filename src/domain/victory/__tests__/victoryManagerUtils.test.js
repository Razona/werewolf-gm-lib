/**
 * @jest-environment node
 */

/**
 * VictoryManagerUtilsのテスト
 * テスト用ユーティリティ関数の動作を検証
 */

import { createPlayerWithRole, createMockGame, VictoryManager } from './helpers';

describe('VictoryManagerUtils', () => {
  test('createPlayerWithRole関数は正しいプレイヤーオブジェクトを作成する', () => {
    // テスト用プレイヤーの作成
    const player = createPlayerWithRole(1, 'werewolf', 'werewolf', true);

    // 期待される結果
    expect(player).toHaveProperty('id', 1);
    expect(player).toHaveProperty('name', 'Player1');
    expect(player).toHaveProperty('isAlive', true);
    expect(player).toHaveProperty('role');
    expect(player.role).toHaveProperty('name', 'werewolf');
    expect(player.role).toHaveProperty('team', 'werewolf');
    expect(typeof player.role.getFortuneResult).toBe('function');
    expect(player.role.getFortuneResult()).toBe('black');
  });

  test('createPlayerWithRole関数は生存状態を正しく設定する', () => {
    // 死亡したプレイヤーの作成
    const deadPlayer = createPlayerWithRole(2, 'villager', 'village', false);

    // 期待される結果
    expect(deadPlayer).toHaveProperty('isAlive', false);
  });

  test('createPlayerWithRole関数は追加プロパティを正しく設定する', () => {
    // 追加プロパティを持つプレイヤーの作成
    const playerWithExtraProps = createPlayerWithRole(
      3,
      'seer',
      'village',
      true,
      {
        customAbility: 'fortune',
        customCounter: 2
      }
    );

    // 期待される結果
    expect(playerWithExtraProps.role).toHaveProperty('customAbility', 'fortune');
    expect(playerWithExtraProps.role).toHaveProperty('customCounter', 2);
  });

  test('createMockGame関数は正しいモックゲームオブジェクトを作成する', () => {
    // テスト用プレイヤーの作成
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'werewolf', 'werewolf'),
      createPlayerWithRole(3, 'seer', 'village', false) // 死亡したプレイヤー
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // 期待される結果
    expect(mockGame).toHaveProperty('getAlivePlayers');
    expect(mockGame).toHaveProperty('getAllPlayers');
    expect(mockGame).toHaveProperty('phaseManager');
    expect(mockGame).toHaveProperty('eventSystem');
    expect(mockGame).toHaveProperty('options');

    // getAlivePlayersは生存プレイヤーのみを返す
    const alivePlayers = mockGame.getAlivePlayers();
    expect(alivePlayers.length).toBe(2);
    expect(alivePlayers.map(p => p.id)).toEqual([1, 2]);

    // getAllPlayersは全プレイヤーを返す
    const allPlayers = mockGame.getAllPlayers();
    expect(allPlayers.length).toBe(3);
    expect(allPlayers.map(p => p.id)).toEqual([1, 2, 3]);
  });

  test('createMockGame関数はオプションを正しく設定する', () => {
    // オプション付きでモックゲームを作成
    const mockGame = createMockGame([], {
      turn: 3,
      phase: 'night',
      regulations: {
        timeLimit: true,
        revealRoleOnDeath: false
      }
    });

    // 期待される結果
    expect(mockGame.phaseManager.getCurrentTurn()).toBe(3);
    expect(mockGame.phaseManager.getCurrentPhase()).toBe('night');
    expect(mockGame.options.regulations).toHaveProperty('timeLimit', true);
    expect(mockGame.options.regulations).toHaveProperty('revealRoleOnDeath', false);
  });
});