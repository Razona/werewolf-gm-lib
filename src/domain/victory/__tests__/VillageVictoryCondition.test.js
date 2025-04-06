/**
 * @jest-environment node
 */

/**
 * 村人陣営勝利条件テスト
 * 村人陣営の勝利条件が正しく判定されることを検証
 */

import { createPlayerWithRole, createMockGame, VictoryManager } from './helpers';

describe('村人陣営勝利条件', () => {
  // 各テスト前に実行される
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('人狼が全滅し村人が生存している場合に勝利する', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'seer', 'village'),
      createPlayerWithRole(3, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('village');
    expect(result.winningCondition).toBe('village_win');
    expect(mockGame.eventSystem.emit).toHaveBeenCalledWith('victory.condition.met', expect.any(Object));
  });

  test('人狼が生存している場合は勝利しない', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'seer', 'village'),
      createPlayerWithRole(3, 'werewolf', 'werewolf') // 生存している人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 村人陣営の勝利条件は満たされないが、
    // 人狼陣営の勝利条件が満たされる可能性がある
    if (result && result.winningTeam === 'village') {
      fail('人狼が生存しているのに村人陣営が勝利しています');
    }
  });

  test('人狼が全滅し狂人のみが生存している場合も村人陣営勝利', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'madman', 'werewolf'), // 生存している狂人
      createPlayerWithRole(2, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('village');
    expect(result.winningCondition).toBe('village_win');
  });

  test('人狼全滅時に生存者がいない場合は村人陣営勝利にならない', () => {
    // テスト用プレイヤーデータ - 全員死亡
    const players = [
      createPlayerWithRole(1, 'villager', 'village', false),
      createPlayerWithRole(2, 'seer', 'village', false),
      createPlayerWithRole(3, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 村人陣営の勝利条件は満たさない（生存者要件を満たさないため）
    expect(result).not.toBeNull();
    expect(result.winningTeam).not.toBe('village');
  });

  test('村人陣営と第三陣営のみ生存の場合も村人陣営勝利', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'fox', 'fox'), // 妖狐
      createPlayerWithRole(3, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 第三陣営の勝利条件を無効化して村人陣営の条件のみをテスト
    victoryManager.victoryConditions.delete('fox_win');

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('village');
    expect(result.winningCondition).toBe('village_win');
  });
});