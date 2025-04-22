# GameManagerEvent.js テスト設計書

## 概要

`GameManagerEvent.js` のテストを設計します。テスト対象のモジュールは、GameManagerのイベント管理機能を提供し、イベントリスナーの登録、発火、管理、デバッグ機能などを実装しています。

## テスト方針

1. **単体テスト中心**: GameManagerEventのメソッドが個別に正しく動作することを確認
2. **Mock活用**: 依存するEventSystemをモック化し、外部依存を隔離
3. **境界値テスト**: エッジケースや無効な入力の処理を検証
4. **機能網羅**: すべての公開APIと内部メソッドの動作を確認
5. **イベントフロー検証**: イベント発火と処理の流れを確認
6. **統合シナリオ**: 実際のユースケースに基づいた統合シナリオの検証

## テスト環境設定

- **テストフレームワーク**: Jest
- **モック**: EventSystem、ErrorHandler、その他依存モジュールをモック
- **テストファイル場所**: `src/service/GameManager/__tests__/GameManagerEvent.test.js`

## テストケース設計

### 1. イベントリスナー登録テスト

#### on() メソッドのテスト

- **正常系**: 
  - イベント名とコールバック関数を正しく渡した場合、リスナーが正常に登録されること
  - 優先度を指定した場合、正しく優先度が設定されること
  - 複数のリスナーを登録した場合、すべて登録されること
  - 同じイベントに複数のリスナーを登録した場合、すべて保持されること

- **異常系**:
  - 無効なイベント名（null、空文字、オブジェクトなど）を渡した場合、適切なエラーが発生すること
  - コールバックが関数でない場合、適切なエラーが発生すること
  - EventSystemでエラーが発生した場合、適切に処理されること
  - リスナー数が上限（実装依存）に達した場合の挙動

#### once() メソッドのテスト

- **正常系**:
  - 一度だけ実行されるリスナーが正しく登録されること
  - イベント発火後にリスナーが自動的に削除されること
  - 複数回イベントが発火しても1回だけ実行されること
  - 優先度指定が正しく機能すること

- **異常系**:
  - 無効なパラメータでエラーが適切に処理されること
  - コールバック内で例外が発生した場合でもリスナーが削除されること

### 2. イベントリスナー削除テスト

#### off() メソッドのテスト

- **正常系**:
  - 特定のイベントのリスナーが正しく削除されること
  - コールバック指定時は該当リスナーのみ削除されること
  - コールバック未指定時は該当イベントの全リスナーが削除されること
  - イベント名にワイルドカード使用時の動作確認
  - リスナー削除後に同じイベントの発火でコールバックが呼ばれないこと

- **異常系**:
  - 無効なイベント名でエラーが適切に処理されること
  - 存在しないリスナーの削除要求が無視されること
  - コールバック関数が元の参照と等価でなくても正しく削除できるか（関数の同一性）

### 3. イベント発火テスト

#### emit() メソッドのテスト

- **正常系**:
  - イベント発火でリスナーが正しく実行されること
  - データが正しくリスナーに渡されること
  - 親イベント（階層構造）に伝播すること（例: `a.b.c`は`a.b.*`と`a.*`にも伝播する）
  - 複数のリスナーが優先度順に実行されること
  - `once`で登録されたリスナーが一度だけ実行されること

- **異常系**:
  - イベント名が不正な場合のエラー処理
  - リスナーが例外を投げた場合、他のリスナーの実行に影響しないこと
  - 大量のリスナーがある場合の性能劣化チェック
  - イベント発火中にリスナーが追加/削除された場合の挙動

- **複雑なイベントチェーン**:
  - イベントAの発火が別のイベントBを発火させる場合の挙動検証
  - 循環的なイベント発火（A→B→A）での無限ループ防止メカニズムの検証
  - 深いイベントチェーン（A→B→C→D→...）の実行順序と深さ制限の確認
  - イベントチェーン中でエラーが発生した場合の伝播と回復

### 4. イベント検索・確認テスト

- **hasListeners() メソッドのテスト**:
  - リスナーが登録されているイベントは true を返すこと
  - リスナーが登録されていないイベントは false を返すこと
  - ワイルドカードパターンでの確認が機能すること
  - 親イベント名での検索が機能すること

- **listenerCount() メソッドのテスト**:
  - 登録リスナー数が正確に返されること
  - リスナーなしの場合は 0 が返されること
  - 複数のリスナーが正確にカウントされること
  - 異なる優先度のリスナーも正しくカウントされること

- **eventNames() メソッドのテスト**:
  - 登録されているすべてのイベント名が返されること
  - イベントが一つもない場合は空配列が返されること
  - 重複なしで正確にイベント名が返されること
  - 階層的イベント名が適切に返されること

### 5. イベント管理機能テスト

#### setupEventListeners() メソッドのテスト

- **内部イベントリスナーのセットアップ**:
  - 必要なゲームイベントのリスナーが正しく設定されること
  - プレイヤー死亡、フェーズ終了、ゲーム終了などのイベントリスナーが機能すること
  - 設定されたリスナーが適切なコンテキストで実行されること
  - リスナーが重複登録されていないこと

- **GameManagerの状態変更**:
  - リスナーによって適切にGameManagerの状態が更新されること
  - 状態更新が成功した場合に適切なフォローアップイベントが発火されること
  - 状態更新が失敗した場合にエラー処理が行われること

#### cleanupEventListeners() メソッドのテスト

- **リスナーのクリーンアップ**:
  - 特定のイベントリスナーが正しく削除されること
  - ゲーム終了時にリソースリークが発生しないこと
  - すべての内部リスナーが削除されたことの確認
  - クリーンアップ後に該当イベントが発火しても処理されないこと

- **メモリリーク検証**:
  - クリーンアップ後にメモリリークが発生していないことの確認
  - リスナー数が0に戻っていることの確認

### 6. デバッグ機能テスト

#### enableDebugEvents() メソッドのテスト

- **デバッグモード有効化**:
  - 有効時にイベントログが記録されること
  - 無効時に記録が停止すること
  - 有効/無効を切り替えた場合の挙動
  - ログバッファのサイズ制限が機能すること

- **パフォーマンス検証**:
  - デバッグモード有効時のパフォーマンス影響測定
  - 大量のイベント発火時のメモリ使用量確認

#### getEventLog() メソッドのテスト

- **イベントログの取得**:
  - フィルタリングが機能すること（特定パターンのイベントのみ取得）
  - 件数制限が機能すること
  - イベントデータの形式が正しいこと
  - タイムスタンプ順で並んでいること
  - フィルタ条件が無効な場合のフォールバック動作

- **大規模ログの処理**:
  - 非常に大きなログでのパフォーマンス確認
  - メモリ効率の確認

#### logEvent() メソッドのテスト

- **ログ記録機能**:
  - イベントが正しく記録されること
  - タイムスタンプや関連情報が含まれること
  - ログサイズ制限が機能すること（古いログが削除される）
  - デバッグモード無効時は記録されないこと
  - 高頻度イベントのログ制限機能（スロットリング）

### 7. イベントパターンマッチングテスト

#### eventNameMatches() メソッドのテスト

- **パターンマッチング**:
  - 完全一致のパターンがマッチすること
  - ワイルドカード(`*`)が機能すること
    - 先頭のワイルドカード: `*.end`
    - 中間のワイルドカード: `game.*.end`
    - 末尾のワイルドカード: `game.*`
    - 複数のワイルドカード: `*.*.end`
  - 階層構造(`a.b.c`)が正しくマッチすること
  - 不一致パターンが正しく判定されること

- **エッジケース**:
  - 空の文字列、特殊文字を含むイベント名
  - 非常に長いイベント名とパターン
  - 多段階の階層構造（例: `a.b.c.d.e.f`）
  - パターンと長さが異なるイベント名の処理

### 8. 統合シナリオテスト

#### 実際のゲームフローシミュレーション

- **ゲーム開始から終了までのシナリオ**:
  - ゲーム開始イベントが適切なリスナーを呼び出し、状態変更が行われること
  - フェーズ変更イベントが連鎖的に処理されること
  - プレイヤー死亡イベントが適切に処理され、勝利条件チェックが行われること
  - ゲーム終了イベントで適切なクリーンアップが行われること

- **エラー回復シナリオ**:
  - イベントチェーン中にエラーが発生した場合の回復処理
  - 重要なイベント処理の失敗時のフォールバック挙動

- **高負荷シナリオ**:
  - 多数のプレイヤー・役職が存在する場合のイベント処理
  - 短時間での多数のイベント発火時のパフォーマンス

## モックの設計

### EventSystem モック

```
// 擬似コード - 実際にはJestモック構文を使用
const mockEventSystem = {
  on: jest.fn().mockReturnValue(true),
  once: jest.fn().mockReturnValue(true),
  off: jest.fn().mockReturnValue(true),
  emit: jest.fn().mockReturnValue(true),
  hasListeners: jest.fn(),
  listenerCount: jest.fn(),
  eventNames: jest.fn()
};
```

### ErrorHandler モック

```
// 擬似コード
const mockErrorHandler = {
  createError: jest.fn().mockImplementation((code, message) => ({
    code,
    message
  })),
  handleError: jest.fn()
};
```

### GameManager状態モック

```
// 擬似コード
const mockGameState = {
  isStarted: false,
  isEnded: false,
  turn: 0,
  phase: null,
  players: [],
  roles: {},
  // その他の状態
};

// モック更新関数
const updateMockState = (partialState) => {
  Object.assign(mockGameState, partialState);
};
```

## テスト実行と状態管理

### テスト設定

```
// 擬似コード - 実際にはJestテスト構文を使用
describe('GameManagerEvent', () => {
  let gameManager;
  let eventMixin;
  
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // GameManagerモックの設定
    gameManager = {
      eventSystem: mockEventSystem,
      errorHandler: mockErrorHandler,
      state: { ...mockGameState },
      // その他必要なプロパティ
    };
    
    // テスト対象モジュールの適用
    eventMixin = GameManagerEventMixin(gameManager.constructor);
    // または: Object.assign(gameManager, GameManagerEventMixin.methods);
  });
  
  afterEach(() => {
    // クリーンアップ
  });
  
  // 各メソッドのテスト
});
```

### モックリセット戦略

- 各テスト前にすべてのモックをリセット
- 複雑なテストではテスト中にモック応答を動的に変更
- 非同期テストでは適切な待機処理の実装

## テスト検証ポイント

1. **関数呼び出し検証**: モックの関数が正しいパラメータで呼ばれたか
   ```
   // 擬似コード
   expect(mockEventSystem.on).toHaveBeenCalledWith('player.death', expect.any(Function), 0);
   ```

2. **戻り値検証**: 関数が期待される値を返すか
   ```
   // 擬似コード
   expect(gameManager.on('event', callback)).toBe(true);
   ```

3. **エラー発生検証**: 異常系で正しくエラーが発生するか
   ```
   // 擬似コード
   expect(() => gameManager.on(null, callback)).toThrow();
   ```

4. **状態変化検証**: オブジェクトの状態が期待通りに変わるか
   ```
   // 擬似コード
   gameManager.enableDebugEvents(true);
   expect(gameManager.debugMode).toBe(true);
   ```

5. **イベントフロー検証**: イベントの連鎖が想定通りに動作するか
   ```
   // 擬似コード
   const callback = jest.fn();
   gameManager.on('player.death', callback);
   gameManager.emit('player.death', { playerId: 1 });
   expect(callback).toHaveBeenCalledWith({ playerId: 1 });
   ```

6. **パフォーマンス検証**: 処理時間やメモリ使用量が許容範囲内か
   ```
   // 擬似コード
   const startTime = performance.now();
   // 大量のイベント発火
   const endTime = performance.now();
   expect(endTime - startTime).toBeLessThan(maxAllowedTime);
   ```

## 非同期処理の検証

イベント処理が非同期の場合、以下のアプローチでテストします：

```
// 擬似コード
it('handles async event listeners', async () => {
  const asyncCallback = jest.fn().mockImplementation(() => Promise.resolve());
  
  gameManager.on('async.event', asyncCallback);
  
  await gameManager.emit('async.event', { data: 'test' });
  
  expect(asyncCallback).toHaveBeenCalled();
});
```

Promise.allを使用して複数の非同期イベントを処理：

```
// 擬似コード
it('handles multiple async events', async () => {
  const results = [];
  const asyncCallback1 = jest.fn().mockImplementation(() => {
    return new Promise(resolve => {
      setTimeout(() => {
        results.push(1);
        resolve();
      }, 100);
    });
  });
  
  const asyncCallback2 = jest.fn().mockImplementation(() => {
    return new Promise(resolve => {
      setTimeout(() => {
        results.push(2);
        resolve();
      }, 50);
    });
  });
  
  gameManager.on('async.event', asyncCallback1);
  gameManager.on('async.event', asyncCallback2);
  
  await gameManager.emit('async.event', { data: 'test' });
  
  // 優先順序通りに実行されたか検証
  expect(results).toEqual([2, 1]);
});
```

## 考慮すべき点

1. **イベントの非同期性**: イベント処理が非同期の場合、適切なPromise処理とasync/awaitを使用
2. **複雑なイベントチェーン**: イベントが連鎖的に発火するケースでは専用のスタブを準備
3. **モック復元**: テスト間でのモックのリセットを確実に行う
4. **メモリリーク検証**: 特にイベントリスナーの追加と削除のバランスを確認
5. **カバレッジ**: 条件分岐や例外ルートを含むすべてのコードパスをカバー
6. **パフォーマンステスト**: 高負荷状況（多数のリスナーや頻繁なイベント発火）での性能を検証

## テスト作成優先度

1. 基本的なイベント登録・発火機能 (on, emit) - **最優先**
2. イベントリスナー管理機能 (off, once) - **高優先度**
3. 内部イベントリスナー設定 (setupEventListeners) - **中優先度**
4. イベント検索・確認機能 (hasListeners, listenerCount) - **中優先度**
5. デバッグ機能 (enableDebugEvents, getEventLog) - **中優先度**
6. 特殊機能 (eventNameMatches) - **低優先度**
7. 統合シナリオテスト - **最後に実装**

## テスト実装ステップ

1. 基本的なモックとテスト環境の設定
2. 最優先メソッドのユニットテスト実装
3. 残りのメソッドをカテゴリごとに実装
4. エッジケースとエラーケースの追加
5. 非同期処理と複雑なイベントチェーンのテスト
6. パフォーマンスとメモリリーク検証
7. 統合シナリオテストの実装

以上のテスト設計に基づいて、GameManagerEventの機能を網羅的にテストすることが可能です。このアプローチにより、コードの品質、信頼性、保守性が向上するでしょう。