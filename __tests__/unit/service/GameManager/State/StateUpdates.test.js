/**
 * GameManagerState 状態更新機能テスト
 */

// モックと共通ユーティリティのインポート
import MockFactory from './shared/MockFactory';
import TestFixtures from './shared/TestFixtures';
import TestHelpers from './shared/TestHelpers';
// TestScenarios から個別のシナリオ関数をインポート
import {
  basicUpdateScenario,
  transactionScenario
  // 必要に応じて他のシナリオもインポート
} from './shared/TestScenarios';
// 実際のMixinをインポート
import { applyGameManagerStateMixin } from '../../../../../src/service/GameManager/GameManagerState';

// テスト前の準備
let gameManager;
let mocks;

// Jest Fake Timersを有効化
beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  // モックのリセット
  jest.clearAllMocks();

  // テスト用のGameManagerインスタンス作成
  mocks = MockFactory.createMockSet('init', {
    roleManagerOptions: {
      roleList: ['villager', 'werewolf'] // シナリオの期待値に合わせる
    }
  });
  const GameManager = class {
    constructor() {
      this.eventSystem = mocks.eventSystem;
      this.errorHandler = mocks.errorHandler;
      this.playerManager = mocks.playerManager;
      this.roleManager = mocks.roleManager;
      this.phaseManager = mocks.phaseManager;
      // stateの初期化（GameManagerStateMixin内で初期化される想定だが、念のため基本構造を用意）
      this.state = {
        id: `game-${Date.now()}`,
        isStarted: false,
        isEnded: false,
        turn: 0,
        phase: null,
        players: [],
        roles: { list: [], distributed: false, distribution: {} },
        votes: { current: [], history: [] },
        actions: { pending: [], history: [] },
        history: [],
        lastUpdate: Date.now()
      };
      this.options = {
        regulations: {},
        visibilityControl: { enabled: false }
      };

      // トランザクション状態
      this.inTransaction = false; // booleanに変更
      this.transactionSnapshot = null;
      this.transactionChanges = [];
      this.transactionTimestamp = null;
      this.transactionMetadata = {};
    }
  };

  // 実際のMixinの適用
  applyGameManagerStateMixin(GameManager);
  gameManager = new GameManager();
});

describe('GameManagerState 状態更新機能', () => {

  describe('基本的な状態更新', () => {
    test('単一フィールドの更新が正しく動作する', () => {
      // 単一フィールドの更新
      const updatedState = gameManager.updateState({ turn: 1 });

      // 更新結果の検証
      expect(updatedState.turn).toBe(1);
      expect(gameManager.state.turn).toBe(1);

      // 他のフィールドは変更されていないことを確認
      expect(updatedState.isStarted).toBe(false);
      expect(updatedState.phase).toBeNull();
    });

    test('複数フィールドの同時更新が正しく動作する', () => {
      // 複数フィールドの更新
      const updatedState = gameManager.updateState({
        isStarted: true,
        turn: 1,
        phase: 'preparation'
      });

      // 更新結果の検証
      expect(updatedState.isStarted).toBe(true);
      expect(updatedState.turn).toBe(1);
      expect(updatedState.phase).toBe('preparation');
    });

    test('タイムスタンプが更新される', () => {
      // 更新前のタイムスタンプを保存
      const beforeTimestamp = gameManager.state.lastUpdate;

      // 少し待機して時間差を作る
      jest.advanceTimersByTime(100);

      // 状態更新
      const updatedState = gameManager.updateState({
        phase: 'test'
      });

      // 更新後のタイムスタンプが新しいことを確認
      expect(updatedState.lastUpdate).toBeGreaterThan(beforeTimestamp);
    });

    test('イベントが適切に発火される', () => {
      // 状態更新
      gameManager.updateState({ turn: 2 });

      // イベント発火の検証
      expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
        'state.update.before',
        expect.objectContaining({
          currentState: expect.any(Object),
          updates: { turn: 2 }
        })
      );

      expect(mocks.eventSystem.emit).toHaveBeenCalledWith(
        'state.update.after',
        expect.objectContaining({
          previousState: expect.any(Object),
          currentState: expect.any(Object),
          updates: { turn: 2 }
        })
      );
    });

    test('silentオプションでイベント発火を抑制できる', () => {
      // silentオプションを指定して更新
      gameManager.updateState({ turn: 3 }, { silent: true });

      // イベント発火メソッドが呼ばれていないことを確認
      expect(mocks.eventSystem.emit).not.toHaveBeenCalled();
    });
  });

  describe('ネストした構造の更新', () => {
    test('ネストしたオブジェクトの更新が正しく動作する', () => {
      // ネストしたフィールドの更新
      const updatedState = gameManager.updateState({
        roles: {
          list: ['villager', 'werewolf'],
          distributed: true
        }
      });

      // 更新結果の検証
      expect(updatedState.roles.list).toEqual(['villager', 'werewolf']);
      expect(updatedState.roles.distributed).toBe(true);

      // 更新されていないフィールドが保持されていることを確認
      expect(updatedState.roles.distribution).toEqual({});
    });

    test('深くネストした構造の更新', () => {
      // 深くネストした構造を作成
      gameManager.updateState({
        testNested: {
          level1: {
            level2: {
              value: 'original'
            }
          }
        }
      });

      // 深くネストした値の更新
      const updatedState = gameManager.updateState({
        testNested: {
          level1: {
            level2: {
              value: 'updated'
            }
          }
        }
      });

      // 更新結果の検証
      expect(updatedState.testNested.level1.level2.value).toBe('updated');

      // ネストした構造の他の部分が保持されていることを確認
      expect(updatedState.testNested.level1).toBeDefined();
    });

    test('部分的なネストオブジェクトの更新', () => {
      // 複雑な構造を作成
      gameManager.updateState({
        testNested: {
          a: { value: 1 },
          b: { value: 2 },
          c: { value: 3 }
        }
      });

      // 一部のみ更新
      const updatedState = gameManager.updateState({
        testNested: {
          b: { value: 20 }
        }
      });

      // 更新されたフィールドの検証
      expect(updatedState.testNested.b.value).toBe(20);

      // 更新されていないフィールドが保持されていることを確認
      expect(updatedState.testNested.a.value).toBe(1);
      expect(updatedState.testNested.c.value).toBe(3);
    });
  });

  describe('配列の更新', () => {
    test('デフォルトでは配列は置換される', () => {
      // 初期配列を設定
      gameManager.updateState({
        testArray: [1, 2, 3]
      });

      // 配列の更新
      const updatedState = gameManager.updateState({
        testArray: [4, 5]
      });

      // 配列が置換されていることを確認
      expect(updatedState.testArray).toEqual([4, 5]);
    });

    test('mergeArraysオプションで配列をマージできる', () => {
      // 初期配列を設定
      gameManager.updateState({
        testArray: [1, 2, 3]
      });

      // マージオプションで配列を更新
      const updatedState = gameManager.updateState(
        { testArray: [4, 5] },
        { mergeArrays: true }
      );

      // 配列がマージされていることを確認
      expect(updatedState.testArray).toEqual([1, 2, 3, 4, 5]);
    });

    test('マージオプションは再帰的に適用される', () => {
      // ネスト構造内の配列を持つオブジェクトを設定
      gameManager.updateState({
        nested: {
          items: [1, 2],
          other: [5, 6]
        }
      });

      // マージオプションでネスト構造内の配列を更新
      const updatedState = gameManager.updateState(
        {
          nested: {
            items: [3, 4]
          }
        },
        { mergeArrays: true }
      );

      // 更新した配列がマージされていることを確認
      expect(updatedState.nested.items).toEqual([1, 2, 3, 4]);

      // 更新していない配列はそのままであることを確認
      expect(updatedState.nested.other).toEqual([5, 6]);
    });
  });

  describe('バリデーション機能', () => {
    test('無効な更新データが検出される', () => {
      // 空オブジェクトでの更新
      expect(() => {
        gameManager.updateState({});
      }).toThrow();

      // nullでの更新
      expect(() => {
        gameManager.updateState(null);
      }).toThrow();
    });

    test('シリアライズできない値が検出される', () => {
      // 循環参照を持つオブジェクト
      const circular = {};
      circular.self = circular;

      // 関数を含むオブジェクト
      const withFunction = {
        fn: () => { }
      };

      // 循環参照での更新
      expect(() => {
        gameManager.updateState({ badObj: circular });
      }).toThrow();

      // 関数を含むオブジェクトでの更新
      expect(() => {
        gameManager.updateState({ badObj: withFunction });
      }).toThrow();
    });

    test('無効なプレイヤー配列が検出される', () => {
      // プレイヤーフィールドに配列でない値を設定
      expect(() => {
        gameManager.updateState({ players: "not an array" });
      }).toThrow();

      expect(() => {
        gameManager.updateState({ players: 123 });
      }).toThrow();

      expect(() => {
        gameManager.updateState({ players: {} });
      }).toThrow();
    });

    test('validateオプションでバリデーションをスキップできる', () => {
      // 通常は失敗する更新
      const badUpdate = { players: "not an array" };

      // validateオプションをfalseに設定
      const updatedState = gameManager.updateState(badUpdate, { validate: false });

      // バリデーションをスキップして更新が適用されていることを確認
      expect(updatedState.players).toBe("not an array");
    });

    test('ゲーム終了時の勝者情報の検証', () => {
      // 勝者情報なしでのゲーム終了
      expect(() => {
        gameManager.updateState({
          isEnded: true
          // winner が指定されていない
        });
      }).toThrow();

      // 勝者情報ありならOK
      expect(() => {
        gameManager.updateState({
          isEnded: true,
          winner: 'village'
        });
      }).not.toThrow();
    });
  });

  describe('トランザクション連携', () => {
    test('トランザクション中は変更が記録される', () => {
      // トランザクションをアクティブにする
      gameManager.inTransaction = true;

      // 状態更新
      gameManager.updateState({ turn: 5 });

      // 変更が記録されていることを確認
      expect(gameManager.transactionChanges.length).toBe(1);
      expect(gameManager.transactionChanges[0].type).toBe('update');
      expect(gameManager.transactionChanges[0].data.delta).toEqual({ turn: 5 });
    });

    test('トランザクションが非アクティブなら変更は記録されない', () => {
      // トランザクションが非アクティブな状態で更新
      gameManager.inTransaction = false;

      // 状態更新
      gameManager.updateState({ turn: 5 });

      // 変更が記録されていないことを確認
      expect(gameManager.transactionChanges.length).toBe(0);
    });
  });

  describe('テストシナリオ', () => {
    test('基本更新シナリオが正しく実行される', async () => {
      // basicUpdateScenario を直接呼び出す
      const result = await basicUpdateScenario(gameManager, mocks);

      // 検証
      expect(result.error).toBeUndefined(); // エラーがないことを確認
      expect(result.updates.length).toBe(3); // 3回の更新が行われたか
      expect(result.events).toContain('state.update.before');
      expect(result.events).toContain('state.update.after');
      expect(result.finalState).toBeDefined();
      expect(result.finalState.turn).toBe(1);
      expect(result.finalState.phase).toBe('preparation');
      expect(result.finalState.isStarted).toBe(true);
      expect(result.finalState.roles.list).toEqual(['villager', 'werewolf']);
    });

    test('トランザクションコミットシナリオが正しく実行される', async () => {
      // transactionScenario を直接呼び出す
      const result = await transactionScenario(gameManager, mocks, true);

      expect(result.error).toBeUndefined();
      expect(result.transactionStarted).toBe(true);
      expect(result.transactionEnded).toBe(true);
      expect(result.events).toContain('state.transaction.begin');
      expect(result.events).toContain('state.transaction.commit.before');
      expect(result.events).toContain('state.transaction.commit');

      // コミット後の状態を検証
      expect(result.finalState).toBeDefined();
      expect(result.finalState.turn).toBe(result.stateBeforeTransaction.turn + 1);
      expect(result.finalState.players.find(p => p.id === 1).isAlive).toBe(false);
    });

    test('トランザクションロールバックシナリオが正しく実行される', async () => {
      // transactionScenario を直接呼び出す
      const result = await transactionScenario(gameManager, mocks, false);

      expect(result.error).toBeUndefined();
      expect(result.transactionStarted).toBe(true);
      expect(result.transactionEnded).toBe(true);
      expect(result.events).toContain('state.transaction.begin');
      expect(result.events).toContain('state.transaction.rollback.before');
      expect(result.events).toContain('state.transaction.rollback');

      // ロールバック後の状態がトランザクション前と同じであることを確認
      expect(result.finalState).toBeDefined();
      expect(result.finalState.turn).toBe(gameManager.state.turn);
      expect(result.finalState.players.find(p => p.id === 1).isAlive).toBe(true);
      expect(JSON.stringify(result.finalState)).toBe(JSON.stringify(result.stateBeforeTransaction));
    });

    // saveLoadScenario と gameFlowScenario のテストも同様に修正が必要になる可能性があります
    // (import と呼び出しを修正)
  });

  describe('エッジケースと異常系', () => {
    test('nullやundefinedの値を含む更新が正しく処理される', () => {
      // 初期値を設定
      gameManager.updateState({
        testField: 'value',
        testObj: { a: 1, b: 2 }
      });

      // nullやundefinedを含む更新
      const updatedState = gameManager.updateState({
        testField: null,
        testNull: null,
        testUndefined: undefined,
        testObj: {
          a: undefined,
          c: null
        }
      });

      // 更新結果の検証
      expect(updatedState.testField).toBeNull();
      expect(updatedState.testNull).toBeNull();
      expect(updatedState.testUndefined).toBeUndefined();
      expect(updatedState.testObj.a).toBeUndefined();
      expect(updatedState.testObj.b).toBe(2); // 未変更
      expect(updatedState.testObj.c).toBeNull();
    });

    test('既存フィールドを削除する更新が正しく処理される', () => {
      // 初期値を設定
      gameManager.updateState({
        testField: 'value',
        testObj: { a: 1, b: 2 }
      });

      // 削除のための更新（Javascriptでは真の削除ではなくundefinedに設定）
      const updatedState = gameManager.updateState({
        testField: undefined
      });

      // 更新結果の検証
      expect(updatedState).toHaveProperty('testField');
      expect(updatedState.testField).toBeUndefined();

      // testObjは残っていることを確認
      expect(updatedState.testObj).toBeDefined();
      expect(updatedState.testObj.a).toBe(1);
    });

    test('型が変わる更新が正しく処理される', () => {
      // 初期値を設定
      gameManager.updateState({
        numField: 123,
        strField: 'text',
        boolField: true,
        arrayField: [1, 2, 3],
        objField: { a: 1 }
      });

      // 型が変わる更新
      const updatedState = gameManager.updateState({
        numField: 'now a string',
        strField: 456,
        boolField: { now: 'an object' },
        arrayField: 'not an array anymore',
        objField: [1, 2, 3]
      });

      // 更新結果の検証
      expect(typeof updatedState.numField).toBe('string');
      expect(typeof updatedState.strField).toBe('number');
      expect(typeof updatedState.boolField).toBe('object');
      expect(typeof updatedState.arrayField).toBe('string');
      expect(Array.isArray(updatedState.objField)).toBe(true);
    });
  });

  describe('性能とスケーラビリティ', () => {
    test('大量のフィールド更新が正しく動作する', () => {
      // 100フィールドの更新データを準備
      const manyFields = {};
      for (let i = 0; i < 100; i++) {
        manyFields[`field${i}`] = `value${i}`;
      }

      // 大量フィールドの更新
      const updatedState = gameManager.updateState(manyFields);

      // ランダムに選んだフィールドの検証
      expect(updatedState.field0).toBe('value0');
      expect(updatedState.field50).toBe('value50');
      expect(updatedState.field99).toBe('value99');

      // フィールド数の検証
      expect(Object.keys(updatedState).length).toBeGreaterThanOrEqual(100);
    });

    test('複雑なネスト構造の更新が正しく動作する', () => {
      // 複雑なネスト構造のテスト
      const complexStructure = JSON.parse(JSON.stringify(TestFixtures.complexNestedState));

      // 複雑な構造の更新
      gameManager.state = complexStructure;

      // ネスト構造の一部を更新
      const updatedState = gameManager.updateState({
        nestedStructure: {
          level1: {
            level2: {
              level3: {
                data: '更新されたネストデータ'
              }
            }
          }
        }
      });

      // 更新結果の検証
      expect(updatedState.nestedStructure.level1.level2.level3.data).toBe('更新されたネストデータ');

      // 更新していない部分が保持されていることを確認
      expect(updatedState.nestedStructure.level1.siblingData).toBe('兄弟データ');
      expect(updatedState.nestedStructure.level1.level2.array).toEqual([1, 2, 3, { nestedInArray: "配列内のオブジェクト" }]);
      expect(updatedState.nestedStructure.array.length).toBe(2);
    });

    test('プレイヤー配列の大規模更新が正しく動作する', () => {
      // 大量のプレイヤーを生成
      const manyPlayers = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `プレイヤー${i}`,
        isAlive: true
      }));

      // プレイヤー配列の更新
      const updatedState = gameManager.updateState({
        players: manyPlayers
      });

      // 更新結果の検証
      expect(updatedState.players.length).toBe(100);
      expect(updatedState.players[0].name).toBe('プレイヤー0');
      expect(updatedState.players[99].name).toBe('プレイヤー99');
    });
  });
});
