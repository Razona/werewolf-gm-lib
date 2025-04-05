/**
 * @jest-environment node
 */

/**
 * カスタム勝利条件と時間制限テスト
 * カスタム勝利条件の登録・判定と時間制限による強制終了ロジックのテスト
 */

import { createPlayerWithRole, createMockGame, VictoryManager } from './VictoryManagerUtils';

describe('カスタム勝利条件', () => {
  // 各テスト前に実行される
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('カスタム勝利条件の登録と判定', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'werewolf', 'werewolf'),
      createPlayerWithRole(3, 'lover', 'neutral') // カスタム役職
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // カスタム勝利条件を登録
    victoryManager.registerCustomVictoryCondition({
      id: "lovers_win",
      team: "lovers",
      displayName: "恋人陣営勝利",
      description: "恋人が生き残った",
      condition: (game) => {
        // 恋人役職を持つプレイヤーを検索
        const lovers = game.getAlivePlayers().filter(
          player => player.role.name === 'lover'
        );

        // 恋人が生存していれば勝利
        return {
          satisfied: lovers.length > 0,
          winningTeam: "lovers",
          reason: "恋人が生き残った",
          winningPlayers: lovers.map(p => p.id)
        };
      },
      priority: 75 // 村人・人狼より低く、妖狐より少し高い
    });

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果 - 人狼陣営が通常なら勝つが、恋人陣営も条件を満たす
    // 優先度により、人狼陣営が勝つはず
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('werewolf');
    expect(result.winningCondition).toBe('werewolf_win');
  });

  test('優先度の高いカスタム勝利条件', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'werewolf', 'werewolf'),
      createPlayerWithRole(3, 'custom', 'custom') // カスタム役職
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 高優先度のカスタム勝利条件を登録
    victoryManager.registerCustomVictoryCondition({
      id: "high_priority_win",
      team: "custom",
      displayName: "高優先度勝利",
      description: "最優先の勝利条件",
      condition: () => ({
        satisfied: true,
        winningTeam: "custom",
        reason: "優先度の高いカスタム勝利条件達成"
      }),
      priority: 1000 // 非常に高い優先度
    });

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果 - 優先度の高いカスタム勝利条件が適用される
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('custom');
    expect(result.winningCondition).toBe('high_priority_win');
  });

  test('カスタム勝利条件のメタデータが結果に含まれる', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'custom', 'custom') // カスタム役職のみ
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // メタデータ付きのカスタム勝利条件を登録
    victoryManager.registerCustomVictoryCondition({
      id: "metadata_win",
      team: "custom",
      displayName: "メタデータ勝利",
      description: "メタデータ付き勝利条件",
      metadata: {
        customKey: "customValue",
        version: "1.0.0"
      },
      condition: () => ({
        satisfied: true,
        winningTeam: "custom",
        reason: "メタデータ付き勝利条件達成",
        metadata: {
          resultKey: "resultValue"
        }
      }),
      priority: 100
    });

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果 - メタデータが結果に含まれる
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('custom');
    expect(result.winningCondition).toBe('metadata_win');
    expect(result.metadata).toHaveProperty('customKey', 'customValue');
    expect(result.metadata).toHaveProperty('version', '1.0.0');
    expect(result.metadata).toHaveProperty('resultKey', 'resultValue');
  });

  test('複雑なカスタム勝利条件の登録', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'custom', 'custom'),
      createPlayerWithRole(3, 'custom', 'custom')
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 複雑な条件を持つカスタム勝利条件を登録
    victoryManager.registerCustomVictoryCondition({
      id: "complex_win",
      team: "custom",
      displayName: "複雑な勝利条件",
      description: "特定の条件を組み合わせた勝利条件",
      condition: (game) => {
        // 各陣営の生存プレイヤー数を確認
        const alivePlayers = game.getAlivePlayers();
        const customTeamPlayers = alivePlayers.filter(p => p.role.team === 'custom');
        const villageTeamPlayers = alivePlayers.filter(p => p.role.team === 'village');

        // カスタム陣営が村人陣営より多ければ勝利
        const satisfied = customTeamPlayers.length > villageTeamPlayers.length;

        return {
          satisfied,
          winningTeam: satisfied ? "custom" : null,
          reason: "カスタム陣営が村人陣営より多い",
          winningPlayers: satisfied ? customTeamPlayers.map(p => p.id) : []
        };
      },
      priority: 95
    });

    // 勝利条件をチェック
    const result = victoryManager.checkVictoryConditions();

    // 期待される結果 - カスタム陣営が勝利（村人より多いため）
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('custom');
    expect(result.winningCondition).toBe('complex_win');
  });
});

describe('時間制限による強制終了', () => {
  test('人狼が村人より多い場合は人狼陣営勝利', () => {
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

    // 時間制限による強制終了を処理
    const result = victoryManager.handleTimeLimit();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('werewolf');
    expect(result.conditionId).toBe('time_limit');
  });

  test('人狼と村人が同数なら人狼陣営勝利', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'werewolf', 'werewolf'), // 人狼1人
      createPlayerWithRole(2, 'villager', 'village')  // 村人1人
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 時間制限による強制終了を処理
    const result = victoryManager.handleTimeLimit();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('werewolf');
    expect(result.conditionId).toBe('time_limit');
  });

  test('人狼がゼロで村人がいる場合は村人陣営勝利', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'), // 村人2人
      createPlayerWithRole(2, 'villager', 'village'),
      createPlayerWithRole(3, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 時間制限による強制終了を処理
    const result = victoryManager.handleTimeLimit();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('village');
    expect(result.conditionId).toBe('time_limit');
  });

  test('人狼も村人もいない場合は引き分け', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'fox', 'fox'), // 妖狐のみ生存
      createPlayerWithRole(2, 'villager', 'village', false), // 死亡した村人
      createPlayerWithRole(3, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 時間制限による強制終了を処理
    const result = victoryManager.handleTimeLimit();

    // 期待される結果
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('draw');
    expect(result.conditionId).toBe('time_limit');
  });

  test('時間制限は通常の勝利条件チェックとは独立して動作する', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'werewolf', 'werewolf'), // 人狼
      createPlayerWithRole(2, 'villager', 'village')   // 村人
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players, {
      regulations: {
        timeLimit: true // 時間制限有効
      }
    });

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 通常の勝利条件チェック
    const normalResult = victoryManager.checkVictoryConditions();

    // 時間制限処理
    const timeLimitResult = victoryManager.handleTimeLimit();

    // 通常の勝利条件では人狼陣営が勝利
    expect(normalResult).not.toBeNull();
    expect(normalResult.winningTeam).toBe('werewolf');

    // 時間制限でも人狼陣営が勝利するが、理由が異なる
    expect(timeLimitResult).not.toBeNull();
    expect(timeLimitResult.winningTeam).toBe('werewolf');
    expect(timeLimitResult.conditionId).toBe('time_limit');
    expect(timeLimitResult.reason).toContain('時間制限による強制終了');
  });
});