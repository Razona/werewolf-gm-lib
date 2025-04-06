/**
 * @jest-environment node
 */

/**
 * イベント処理と異常系のテスト
 * 勝利条件判定に関連するイベント発火やエラー処理を検証
 */

import { createPlayerWithRole, createMockGame, VictoryManager } from './helpers';

describe('イベント発火', () => {
  // 各テスト前に実行される
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('勝利条件チェック前後にイベントが発火される', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    victoryManager.checkVictoryConditions();

    // イベント発火を確認
    expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
      'victory.check.before',
      expect.any(Object)
    );
    expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
      'victory.condition.met',
      expect.objectContaining({
        conditionId: 'village_win',
        team: 'village'
      })
    );
    expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
      'victory.check.after',
      expect.any(Object)
    );
  });

  test('勝利条件が満たされた時にdetailsを含むイベントが発火される', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    victoryManager.checkVictoryConditions();

    // 勝利条件が満たされた時のイベント詳細を確認
    expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
      'victory.condition.met',
      expect.objectContaining({
        conditionId: 'village_win',
        team: 'village',
        reason: expect.any(String),
        turn: expect.any(Number)
      })
    );
  });

  test('結果通知イベントにはターン情報が含まれる', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // ターン数を3に設定したモックゲーム
    const mockGame = createMockGame(players, { turn: 3 });

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    victoryManager.checkVictoryConditions();

    // check.beforeイベントにターン情報が含まれることを確認
    expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
      'victory.check.before',
      expect.objectContaining({
        turn: 3
      })
    );

    // condition.metイベントにターン情報が含まれることを確認
    expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
      'victory.condition.met',
      expect.objectContaining({
        turn: 3
      })
    );

    // check.afterイベントにもターン情報が含まれることを確認
    expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
      'victory.check.after',
      expect.objectContaining({
        turn: 3
      })
    );
  });

  test('条件が満たされない場合はcondition.metイベントは発火されない', () => {
    // テスト用プレイヤーデータ - どの勝利条件も満たさない状態
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'werewolf', 'werewolf'),
      createPlayerWithRole(3, 'villager', 'village'),
      createPlayerWithRole(4, 'villager', 'village')
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // カスタム勝利条件を登録 - 常に満たされない条件
    victoryManager.victoryConditions.clear(); // 既存の条件をクリア
    victoryManager.registerVictoryCondition({
      id: "never_win",
      team: "test",
      displayName: "満たされない条件",
      description: "テスト用",
      condition: () => ({ satisfied: false }),
      priority: 100
    });

    // 勝利条件をチェック
    victoryManager.checkVictoryConditions();

    // check.beforeとcheck.afterは発火されるが、condition.metは発火されない
    expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
      'victory.check.before',
      expect.any(Object)
    );
    expect(mockGame.eventSystem.emit).not.toHaveBeenCalledWith(
      'victory.condition.met',
      expect.any(Object)
    );
    expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
      'victory.check.after',
      expect.objectContaining({
        result: null // 結果はnull
      })
    );
  });
});

describe('異常系テスト', () => {
  test('無効な勝利条件定義を登録しようとすると例外が発生する', () => {
    // モックゲームの作成
    const mockGame = createMockGame([]);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 無効な勝利条件（条件関数なし）の登録を試みる
    expect(() => {
      victoryManager.registerVictoryCondition({
        id: "invalid_win"
        // condition が未定義
      });
    }).toThrow('無効な勝利条件定義です');

    // 無効な勝利条件（ID未定義）の登録を試みる
    expect(() => {
      victoryManager.registerVictoryCondition({
        // id が未定義
        condition: () => ({ satisfied: false })
      });
    }).toThrow('無効な勝利条件定義です');
  });

  test('キャッシュされた結果が返される', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 1回目のチェック
    const result1 = victoryManager.checkVictoryConditions();

    // イベント発火回数をリセット
    mockGame.eventSystem.emit.mockClear();

    // 2回目のチェック - キャッシュから返されるはず
    const result2 = victoryManager.checkVictoryConditions();

    // 結果が同一であること
    expect(result2).toBe(result1); // 同一オブジェクト参照

    // イベント発火されていないこと
    expect(mockGame.eventSystem.emit).not.toHaveBeenCalled();
  });

  test('ゲーム結果のリセットが正しく動作する', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // 勝利条件をチェック
    const result1 = victoryManager.checkVictoryConditions();
    expect(result1).not.toBeNull();

    // ゲーム結果をリセット
    victoryManager.resetGameResult();

    // リセット後のゲーム結果を取得
    const resetResult = victoryManager.getGameResult();
    expect(resetResult).toBeNull();

    // 再度チェックすると新しく計算される
    const result2 = victoryManager.checkVictoryConditions();
    expect(result2).not.toBeNull();
    expect(result2).not.toBe(result1); // 新しいオブジェクト
  });

  test('勝利条件関数内でエラーが発生しても処理が続行される', () => {
    // テスト用プレイヤーデータ
    const players = [
      createPlayerWithRole(1, 'villager', 'village'),
      createPlayerWithRole(2, 'werewolf', 'werewolf', false) // 死亡した人狼
    ];

    // モックゲームの作成
    const mockGame = createMockGame(players);

    // VictoryManagerのインスタンス化
    const victoryManager = new VictoryManager(mockGame);

    // エラーを投げる勝利条件を追加
    victoryManager.registerVictoryCondition({
      id: "error_throwing_condition",
      team: "error",
      displayName: "エラー発生条件",
      description: "エラーを発生させる",
      condition: () => {
        throw new Error('テスト用のエラー');
      },
      priority: 1000 // 高い優先度
    });

    // jest内のエラー出力を抑制
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // 勝利条件をチェック - エラーがあっても次の条件へ進む
    let result;
    expect(() => {
      result = victoryManager.checkVictoryConditions();
    }).not.toThrow();

    // エラーが出力されたが、処理は続行され次の条件が評価された
    expect(result).not.toBeNull();
    expect(result.winningTeam).toBe('village'); // 村人陣営条件が評価された

    // コンソール出力を元に戻す
    console.error = originalConsoleError;
  });
});