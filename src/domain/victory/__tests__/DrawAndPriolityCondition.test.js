/**
 * @jest-environment node
 */

/**
 * 引き分け条件と優先度のテスト
 * 引き分け条件の判定と複数条件が満たされた場合の優先度処理を検証
 */

import { createPlayerWithRole, createMockGame, VictoryManager } from './VictoryManagerUtils';

describe('引き分け条件', () => {
  // 各テスト前に実行される
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('全プレイヤー死亡時は引き分けになる', () => {
    // テスト用プレイヤーデータ - 全員死亡
    const players = [
      createPlayerWithRole(1, 'villager', 'village', false),
      createPlayerWithRole(2, 'werewolf', 'werewolf', false)
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('draw');
    expect(result.winningCondition).toBe('draw');
  });

  test('人狼も村人もいない場合は引き分けになる', () => {
    // テスト用プレイヤーデータ - 妖狐のみ生存
    const players = [
      createPlayerWithRole(1, 'villager', 'village', false), // 死亡した村人
      createPlayerWithRole(2, 'werewolf', 'werewolf', false), // 死亡した人狼
      createPlayerWithRole(3, 'fox', 'fox') // 生存している妖狐
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 妖狐の勝利条件を無効化して引き分け条件のみテスト
    victoryManager.victoryConditions.delete('fox_win');

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('draw');
    expect(result.winningCondition).toBe('draw');
  });

  test('特殊な役職構成で勝利条件を満たさない場合も引き分け', () => {
    // テスト用プレイヤーデータ - カスタム役職のみ
    const players = [
      // カスタム陣営の役職だけ残った状態
      createPlayerWithRole(1, 'custom_role', 'custom'),
      createPlayerWithRole(2, 'custom_role', 'custom')
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // カスタム勝利条件を設定せずにテスト

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果 - 引き分け
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('draw');
  });
});

describe('勝利条件の優先度', () => {
  test('優先度が高い条件が優先される', () => {
    // テスト用プレイヤーデータ - 妖狐と村人のみ生存
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'fox', 'fox'),
      createPlayerWithRole(3, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // カスタム勝利条件（優先度最高）を登録
    victoryManager.registerCustomVictoryCondition({
      id: "test_win",
      team: "test",
      displayName: "テスト勝利",
      description: "テスト用の勝利条件",
      condition: () => ({
        satisfied: true,
        winningTeam: "test",
        reason: "テスト勝利条件達成"
      }),
      priority: 1000 // 非常に高い優先度
    });

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果 - 優先度の高いテスト勝利条件が勝つはず
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('test');
    expect(result.winningCondition).toBe('test_win');
  });

  test('村人陣営と人狼陣営の条件が同時に満たされる場合は村人陣営が優先される', () => {
    // テスト用プレイヤーデータ
    // この状態では両方の条件を満たす特殊なケース
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 人狼陣営の勝利条件を常に満たすよう上書き
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

    // 期待される結果 - 村人陣営の優先度が高いため村人陣営勝利
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('village');
    expect(result.winningCondition).toBe('village_win');
  });

  test('妖狐陣営は村人陣営や人狼陣営より低い優先度', () => {
    // テスト用プレイヤーデータ - 全陣営の条件を満たす状態
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'fox', 'fox'),
      createPlayerWithRole(3, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 人狼陣営の勝利条件も満たすよう上書き
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
      priority: 90 // 村人より低い
    });

    // 妖狐陣営の勝利条件も満たすよう上書き
    victoryManager.registerVictoryCondition({
      id: "fox_win",
      team: "fox",
      displayName: "妖狐陣営勝利",
      description: "テスト用",
      condition: () => ({
        satisfied: true,
        winningTeam: "fox",
        reason: "テスト用勝利条件"
      }),
      priority: 80 // 最も低い
    });

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果 - 村人陣営の優先度が最も高い
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('village');
    expect(result.winningCondition).toBe('village_win');
  });

  test('引き分け条件は最も優先度が低い', () => {
    // テスト用プレイヤーデータ - 全員死亡
    const players = [
      createPlayerWithRole(1, 'villager', 'village', false),
      createPlayerWithRole(2, 'werewolf', 'werewolf', false)
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // カスタム勝利条件を追加（優先度は引き分けより高い）
    victoryManager.registerCustomVictoryCondition({
      id: "custom_win",
      team: "custom",
      displayName: "カスタム勝利",
      description: "カスタム勝利条件",
      condition: () => ({
        satisfied: true,
        winningTeam: "custom",
        reason: "カスタム勝利条件達成"
      }),
      priority: 10 // 引き分けより高い
    });

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果 - 引き分けより優先度の高いカスタム勝利
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('custom');
    expect(result.winningCondition).toBe('custom_win');
  });
});