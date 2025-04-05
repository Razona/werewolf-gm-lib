/**
 * @jest-environment node
 */

/**
 * 人狼陣営勝利条件テスト
 * 人狼陣営の勝利条件が正しく判定されることを検証
 */

import { createPlayerWithRole, createMockGame, VictoryManager } from './VictoryManagerUtils';

describe('人狼陣営勝利条件', () => {
  // 各テスト前に実行される
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('村人判定のプレイヤー数が人狼数と同数の場合に勝利する', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'), // 村人1人
      createPlayerWithRole(2, 'werewolf', 'werewolf') // 人狼1人
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('werewolf');
    expect(result.winningCondition).toBe('werewolf_win');
  });

  test('村人判定のプレイヤー数が人狼数より少ない場合に勝利する', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'werewolf', 'werewolf'), // 人狼2人
      createPlayerWithRole(2, 'werewolf', 'werewolf'),
      createPlayerWithRole(3, 'villager', 'village')  // 村人1人
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('werewolf');
    expect(result.winningCondition).toBe('werewolf_win');
  });

  test('人狼が生存していない場合は勝利しない', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'madman', 'werewolf'),  // 狂人
      createPlayerWithRole(3, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 人狼陣営の勝利条件は満たされない
    if (result && result.winningTeam === 'werewolf') {
      fail('人狼が生存していないのに人狼陣営が勝利しています');
    }
  });

  test('狂人は村人判定になる', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'madman', 'werewolf'), // 狂人
      createPlayerWithRole(2, 'werewolf', 'werewolf') // 人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 狂人は村人判定なので、村人1人：人狼1人の状態
    // 人狼陣営の勝利条件を満たす
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('werewolf');
    expect(result.winningCondition).toBe('werewolf_win');
  });

  test('村人判定のプレイヤー数が人狼数より多い場合は勝利しない', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'), // 村人3人
      createPlayerWithRole(2, 'villager', 'village'),
      createPlayerWithRole(3, 'villager', 'village'),
      createPlayerWithRole(4, 'werewolf', 'werewolf') // 人狼1人
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 村人陣営の勝利条件を無効化し人狼陣営のみチェック
    victoryManager.victoryConditions.delete('village_win');
    victoryManager.victoryConditions.delete('fox_win');

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 人狼陣営の勝利条件は満たされない
    expect(result).toBeNull(); // 勝利条件を満たさないのでnull
  });

  test('第三陣営のプレイヤーは村人判定に含まれる（占い結果による）', () => {
    // テスト用プレイヤーデータ - 妖狐は占い結果が白
    const players = [
      createPlayerWithRole(1, 'werewolf', 'werewolf'), // 人狼1人
      createPlayerWithRole(2, 'fox', 'fox')           // 妖狐1人（村人判定）
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 第三陣営の勝利条件を無効化
    victoryManager.victoryConditions.delete('fox_win');

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 妖狐は村人判定なので、村人1人：人狼1人の状態
    // 人狼陣営の勝利条件を満たす
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('werewolf');
    expect(result.winningCondition).toBe('werewolf_win');
  });

  test('占い結果が黒の役職は村人判定に含まれない', () => {
    // テスト用プレイヤーデータ
    const players = [
      // 占い結果が黒のカスタム役職
      createPlayerWithRole(1, 'custom', 'village', true, {
        getFortuneResult: () => 'black' // 占い結果を黒に設定
      }),
      createPlayerWithRole(2, 'werewolf', 'werewolf') // 人狼1人
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 占い結果が黒のプレイヤーは村人判定に含まれないため、
    // 村人判定0人：人狼1人の状態となり、人狼陣営勝利
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('werewolf');
    expect(result.winningCondition).toBe('werewolf_win');
  });
});