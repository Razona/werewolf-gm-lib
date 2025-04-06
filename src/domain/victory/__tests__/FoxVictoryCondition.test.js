/**
 * @jest-environment node
 */

/**
 * 妖狐陣営勝利条件テスト
 * 妖狐陣営(第三陣営)の勝利条件が正しく判定されることを検証
 */

import { createPlayerWithRole, createMockGame, VictoryManager } from './helpers';

describe('妖狐陣営勝利条件', () => {
  // 各テスト前に実行される
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('村人陣営勝利条件達成時に生存していれば勝利する', () => {
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

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('fox');
    expect(result.winningCondition).toBe('fox_win');
  });

  test('人狼陣営勝利条件達成時に生存していれば勝利する', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'werewolf', 'werewolf'), // 人狼
      createPlayerWithRole(2, 'fox', 'fox'),          // 妖狐
      createPlayerWithRole(3, 'villager', 'village')  // 村人1人
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 人狼陣営の勝利条件を強制的に満たすようにする
    // これで「人狼が村人と同数以下」の条件が確実に満たされる
    victoryManager.registerVictoryCondition({
      id: "werewolf_win",
      team: "werewolf",
      displayName: "人狼陣営勝利",
      description: "テスト用",
      condition: () => ({
        satisfied: true,
        winningTeam: "werewolf",
        reason: "テスト用勝利条件"
      }),
      priority: 90
    });

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('fox');
    expect(result.winningCondition).toBe('fox_win');
  });

  test('妖狐が死亡している場合は勝利しない', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'fox', 'fox', false), // 死亡した妖狐
      createPlayerWithRole(3, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 妖狐陣営の勝利条件は満たされない
    expect(result).not.toBeNull();
    expect(result.winningTeam).not.toBe('fox');
  });

  test('他の勝利条件が発生していない場合は勝利しない', () => {
    // テスト用プレイヤーデータ - まだ勝利条件を満たしていない状態
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'villager', 'village'),
      createPlayerWithRole(3, 'fox', 'fox'),          // 生存している妖狐
      createPlayerWithRole(4, 'werewolf', 'werewolf') // 生存している人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 村人陣営と人狼陣営の勝利条件を無効化
    victoryManager.victoryConditions.delete('village_win');
    victoryManager.victoryConditions.delete('werewolf_win');

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 他陣営の勝利条件が満たされていないため妖狐陣営も勝利しない
    expect(result).toBeNull();
  });

  test('背徳者も勝利プレイヤーに含まれる', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'fox', 'fox'),         // 妖狐
      createPlayerWithRole(3, 'heretic', 'fox'),     // 背徳者
      createPlayerWithRole(4, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('fox');
    expect(result.winningCondition).toBe('fox_win');

    // 勝利プレイヤーに背徳者も含まれることを確認
    expect(result.winningPlayers).toContain(2); // 妖狐のID
    expect(result.winningPlayers).toContain(3); // 背徳者のID
  });
});