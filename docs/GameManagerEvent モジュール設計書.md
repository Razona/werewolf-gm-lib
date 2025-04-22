# GameManagerEvent モジュール設計書

## 1. 概要

`GameManagerEvent.js`は、人狼ゲームGM支援ライブラリのGameManagerに対してイベント管理機能を提供するMix-inモジュールです。このモジュールはイベントリスナーの登録・削除、イベント発火、デバッグ機能などを実装し、ゲーム全体のイベント駆動アーキテクチャを支えます。

## 2. 設計目標

- イベント駆動型アーキテクチャの実現
- GameManagerと各種モジュール間の疎結合な通信の実現
- 拡張性と保守性の高いイベント管理システムの提供
- デバッグと開発支援機能の提供
- 安全性と性能のバランスの取れた実装

## 3. 機能一覧

- イベントリスナーの登録 (`on`, `once`)
- イベントリスナーの削除 (`off`)
- イベントの発火 (`emit`, `emitAsync`)
- イベント伝播の制御 (停止機能)
- リスナー確認 (`hasListeners`, `listenerCount`)
- イベント名の取得 (`eventNames`)
- 内部イベントリスナーの設定 (`setupEventListeners`)
- イベントリスナーのクリーンアップ (`cleanupEventListeners`)
- デバッグ機能 (`enableDebugEvents`, `getEventLog`)
- イベントのパターンマッチング (`eventNameMatches`)
- バッチイベント処理 (`batchEmit`)

## 4. 実装アプローチ

Mix-inパターンを採用し、GameManagerのプロトタイプにイベント関連のメソッドを追加します。このアプローチにより、コードの責務分離と再利用性が高まります。

```javascript
// ファイル: GameManagerEvent.js
export default function GameManagerEventMixin(GameManager) {
  // GameManagerクラスのプロトタイプにメソッドを追加
  // 各メソッドの実装...
}
```

## 5. プロパティ設計

GameManagerに追加するプロパティ:

| プロパティ名 | 型 | 説明 | デフォルト値 |
|--------------|-----|------|------------|
| `_debugMode` | Boolean | デバッグモードの有効/無効状態 | `false` |
| `_eventLog` | Array | イベントログを保持する配列 | `[]` |
| `_eventLogLimit` | Number | イベントログの最大サイズ | `1000` |
| `_temporaryListeners` | Map | 一時的なリスナー参照を保持するマップ | `new Map()` |
| `_eventDepth` | Number | イベント発火の深さを追跡 | `0` |
| `_maxEventDepth` | Number | 許容される最大イベント発火深度 | `10` |

## 6. メソッド詳細設計

### 6.1 イベントリスナー管理

#### on(eventName, callback, priority = 0)

**目的**: イベントリスナーを登録する

**パラメータ**:
- `eventName`: イベント名 (文字列)
- `callback`: コールバック関数
- `priority`: リスナーの優先度 (数値、デフォルト: 0)

**処理内容**:
1. パラメータのバリデーション
2. EventSystemにリスナー登録を委譲
3. リスナー参照をMapに保存（クリーンアップ用）
4. デバッグログの記録（デバッグモード時）
5. エラー発生時の処理

**戻り値**: 登録成功時はtrue、失敗時はfalse

**特徴**:
- 型検証の強化
- リスナー参照の効率的な保存（Mapを使用）
- JSDoc型アノテーションの追加

#### once(eventName, callback, priority = 0)

**目的**: 一度だけ実行されるイベントリスナーを登録する

**パラメータ**:
- `eventName`: イベント名 (文字列)
- `callback`: コールバック関数
- `priority`: リスナーの優先度 (数値、デフォルト: 0)

**処理内容**:
1. パラメータのバリデーション
2. ラッパー関数でリスナーをラップし、一度実行後に自動削除
3. リスナー参照を保存（デバッグ用）
4. エラー発生時の処理も例外安全に設計

**戻り値**: 登録成功時はtrue、失敗時はfalse

**特徴**:
- 型検証の強化
- ワンタイムリスナーの適切な追跡
- 例外発生時の自動クリーンアップ保証

#### off(eventName, callback)

**目的**: イベントリスナーを削除する

**パラメータ**:
- `eventName`: イベント名 (文字列)
- `callback`: 削除するコールバック関数（省略時は全リスナー削除）

**処理内容**:
1. パラメータのバリデーション
2. ワイルドカードを使用した削除のサポート
3. Mapから該当リスナー参照の削除
4. デバッグログの記録

**戻り値**: 削除成功時はtrue、失敗時はfalse

**特徴**:
- ワイルドカードサポートの強化
- Map構造を使用した効率的なリスナー削除
- クリーンアップ処理の最適化

### 6.2 イベント発火

#### emit(eventName, data, options)

**目的**: イベントを発火する

**パラメータ**:
- `eventName`: イベント名 (文字列)
- `data`: イベントデータ (任意)
- `options`: 発火オプション (オプショナル)
  - `stopOnFalse`: リスナーがfalseを返したら伝播を停止
  - `depth`: 発火深度（内部使用）

**処理内容**:
1. 循環イベント検出（深度チェック）
2. イベントデータの不変化（Object.freezeで凍結）
3. メタデータの付加
4. イベント発火と伝播制御
5. デバッグログの記録
6. 深度カウンターの管理

**戻り値**: 発火成功時はtrue、失敗時はfalse

**特徴**:
- イベント伝播制御の追加（リスナーがfalseを返すと伝播停止）
- 循環イベント検出
- イベントデータの不変性確保

#### emitAsync(eventName, data, options)

**目的**: イベントを非同期で発火し、すべてのリスナー処理完了を待機する

**パラメータ**:
- `eventName`: イベント名 (文字列)
- `data`: イベントデータ (任意)
- `options`: 発火オプション (オプショナル)
  - `parallel`: 並列実行するか (デフォルト: true)
  - `timeout`: タイムアウト時間 (ミリ秒)

**処理内容**:
1. イベントリスナーの取得
2. 各リスナーをPromiseでラップ
3. Promise.allで並列実行または逐次実行
4. 結果の集約と返却

**戻り値**: Promise<Array> - 各リスナーの実行結果を含む配列のPromise

**特徴**:
- 非同期イベントリスナーをサポート
- Promiseベースの処理
- 並列または順次実行のオプション

#### batchEmit(events)

**目的**: 複数のイベントを効率的にまとめて発火する

**パラメータ**:
- `events`: イベント配列 (各要素は { eventName, data, options } の形式)

**処理内容**:
1. イベントの検証とグループ化
2. 効率的なバッチ処理
3. 結果の集約

**戻り値**: 各イベントの発火結果を含む配列

**特徴**:
- 複数イベントのバッチ処理による効率化
- 関連イベントのグループ化
- パフォーマンス最適化

### 6.3 イベント情報取得

#### hasListeners(eventName)

**目的**: 特定のイベントにリスナーが登録されているか確認する

**パラメータ**:
- `eventName`: イベント名 (文字列)

**処理内容**:
1. パラメータのバリデーション
2. EventSystemに確認を委譲
3. エラー発生時の処理

**戻り値**: リスナーが登録されていればtrue、そうでなければfalse

**特徴**:
- ワイルドカードマッチングのサポート
- より堅牢なエラーハンドリング

#### listenerCount(eventName)

**目的**: 特定のイベントに登録されているリスナーの数を取得する

**パラメータ**:
- `eventName`: イベント名 (文字列)

**処理内容**:
1. パラメータのバリデーション
2. EventSystemに確認を委譲
3. エラー発生時の処理

**戻り値**: リスナーの数 (数値)

**特徴**:
- ワイルドカードによる集計サポート
- 性能最適化

#### eventNames()

**目的**: 登録されているすべてのイベント名を取得する

**処理内容**:
1. EventSystemにイベント名の取得を委譲
2. エラー発生時の処理

**戻り値**: イベント名の配列

**特徴**:
- キャッシング機構の検討（頻繁に呼ばれる場合）
- 整理されたソート順での返却

### 6.4 内部イベント管理

#### setupEventListeners()

**目的**: 内部イベントリスナーの設定を行う

**処理内容**:
1. _temporaryListenersをMap構造で初期化
2. 機能別のリスナーグループを定義
3. 各リスナーをMapに保存（効率的なクリーンアップのため）
4. 条件付きリスナー登録（設定に応じて）

**特徴**:
- Map構造を使用したリスナー参照の管理
- イベントグループ化による管理性向上
- 条件付きリスナー登録の最適化

#### cleanupEventListeners(groupName)

**目的**: イベントリスナーをクリーンアップする

**パラメータ**:
- `groupName`: クリーンアップするリスナーグループ名 (省略時は全グループ)

**処理内容**:
1. Map構造からリスナーの取得と削除
2. グループ別クリーンアップのサポート
3. 完全なリソース解放の保証

**特徴**:
- Map構造を使用した効率的なクリーンアップ
- 部分的クリーンアップのサポート

### 6.5 デバッグ機能

#### enableDebugEvents(enabled, options)

**目的**: デバッグイベントリスナーの有効/無効を切り替える

**パラメータ**:
- `enabled`: 有効にするかどうか (真偽値)
- `options`: デバッグオプション (オプショナル)
  - `logLimit`: ログエントリの最大数
  - `eventFilter`: ログに記録するイベントパターン
  - `detailedLogging`: 詳細ログを有効にするか

**処理内容**:
1. デバッグモードの設定
2. 有効化時にイベントログの初期化
3. イベントロギングリスナーの設定または削除
4. オプションの適用

**戻り値**: 設定後のデバッグモード状態 (真偽値)

**特徴**:
- ログローテーション機能の強化
- 条件付きロギングオプション
- パフォーマンス最適化

#### getEventLog(filter, limit, options)

**目的**: イベントログを取得する

**パラメータ**:
- `filter`: イベント名でフィルタリング (文字列またはパターン配列)
- `limit`: 取得する最大件数 (数値)
- `options`: 追加オプション (オプショナル)
  - `offset`: 開始位置
  - `sortOrder`: ソート順（昇順/降順）
  - `includeData`: データ本体を含めるか

**処理内容**:
1. デバッグモードが有効かチェック
2. フィルターのパターンマッチング処理
3. 制限件数の適用
4. フィルタリングされたログの返却

**戻り値**: イベントログエントリの配列

**特徴**:
- フィルタリング機能の強化（複数パターン、正規表現）
- ログ分析機能の追加
- ページング対応

#### logEvent(eventName, data)

**目的**: イベントをログに記録する（内部メソッド）

**パラメータ**:
- `eventName`: イベント名 (文字列)
- `data`: イベントデータ (任意)

**処理内容**:
1. ログエントリの作成（メモリ効率を考慮）
2. ログローテーション（古いエントリの効率的な削除）
3. 重複イベントのカウントと最適化

**特徴**:
- ログサイズ管理の効率化
- 重複イベントの適切な処理
- メモリ使用量の最適化

### 6.6 ユーティリティ

#### eventNameMatches(eventName, pattern)

**目的**: イベント名がパターンにマッチするかを確認する

**パラメータ**:
- `eventName`: イベント名 (文字列)
- `pattern`: マッチングパターン (文字列またはRegExp)

**処理内容**:
1. パターンマッチングの最適化
2. 頻出パターンのキャッシング
3. 複雑なマッチングパターンのサポート

**戻り値**: マッチする場合はtrue、そうでなければfalse

**特徴**:
- パターンマッチングの効率化
- 正規表現サポートの検討
- キャッシング機構

## 7. イベント命名規則

イベント名の一貫した命名規則:

### カテゴリー別イベント

- **ゲームライフサイクル**: `game.start`, `game.end`
- **フェーズ関連**: `phase.start.[phaseId]`, `phase.end.[phaseId]`, `phase.transition`
- **プレイヤー関連**: `player.add`, `player.remove`, `player.death`
- **役職関連**: `role.assigned`, `role.revealed`, `role.ability.used`
- **アクション関連**: `action.register`, `action.execute`, `action.[type].result`
- **投票関連**: `vote.register`, `vote.count`, `vote.execute`, `execution`
- **システム関連**: `error`, `warning`, `debug`, `state.change`

### イベントタイミング

- 処理前: `[category].[action].before`
- 処理後: `[category].[action].after`
- 処理完了: `[category].[action].complete`

### ワイルドカードマッチング

- すべてのイベント: `*`
- カテゴリー内すべて: `player.*`
- 特定アクション（すべてのカテゴリー）: `*.death`
- 特定パターン: `phase.*.night`

## 8. プラグインサポート

### イベント名前空間

- プラグイン専用の名前空間: `plugin.[pluginId].*`
- イベントフィルタリングによるプラグイン間の分離
- イベントバブリングの制御

### プラグインイベントフック

- ライフサイクルイベント: `plugin.register`, `plugin.enable`, `plugin.disable`
- カスタムイベント登録メカニズム
- イベント優先度の制御

## 9. 安全性と堅牢性

### 循環イベント防止

- イベント発火深度の追跡
- 最大深度の制限と警告
- 循環検出時の処理中断

### イベント処理の安全性

- リスナー内例外のキャッチと隔離
- 不変データによる副作用の防止
- 非同期リスナーのタイムアウト処理

### リソース管理

- リスナー参照の適切な管理と解放
- メモリリーク防止のクリーンアップ機構
- ログサイズの制限とローテーション

## 10. パフォーマンス最適化

### イベント発火の最適化

- 頻出イベントのファストパス処理
- リスナー実行の効率化
- ワイルドカードマッチングの最適化

### メモリ管理

- リスナー参照の効率的な保存（Map構造の活用）
- ログローテーションの最適化
- 不要なオブジェクト作成の最小化

### スケーリング戦略

- 多数のイベントやリスナーがある場合の最適化
- バルク操作のサポート
- デバウンス/スロットリング機構

## 11. テスト容易性

### テスト支援メソッド

- イベント発火のモック化
- リスナー実行の検証
- イベントシーケンスの記録と検証

### 分離可能な設計

- 外部依存の分離（EventSystem）
- テスト用設定の注入
- 部分的なテスト実行のサポート

## 12. 将来的な拡張性

### 分散イベント

- 将来的な分散システム対応の下準備
- リモートイベント発火の仕組み
- イベントの永続化と再生機能

### カスタムイベントタイプ

- イベントの優先度ベースの伝播
- イベントのキャンセル可能性
- バブリング・キャプチャリングフェーズの概念

## 13. インターフェース定義

```typescript
interface GameManagerEventInterface {
  /**
   * イベントリスナーを登録する
   * @param eventName イベント名
   * @param callback コールバック関数
   * @param priority 優先度（オプション、デフォルト: 0）
   * @returns 登録成功時はtrue
   */
  on(eventName: string, callback: Function, priority?: number): boolean;
  
  /**
   * 一度だけ実行されるイベントリスナーを登録する
   * @param eventName イベント名
   * @param callback コールバック関数
   * @param priority 優先度（オプション、デフォルト: 0）
   * @returns 登録成功時はtrue
   */
  once(eventName: string, callback: Function, priority?: number): boolean;
  
  /**
   * イベントリスナーを削除する
   * @param eventName イベント名
   * @param callback 削除するコールバック関数（省略時は全リスナー削除）
   * @returns 削除成功時はtrue
   */
  off(eventName: string, callback?: Function): boolean;
  
  /**
   * イベントを発火する
   * @param eventName イベント名
   * @param data イベントデータ（オプション）
   * @param options 発火オプション（オプション）
   * @returns 発火成功時はtrue
   */
  emit(eventName: string, data?: any, options?: EmitOptions): boolean;
  
  /**
   * イベントを非同期で発火する
   * @param eventName イベント名
   * @param data イベントデータ（オプション）
   * @param options 発火オプション（オプション）
   * @returns 各リスナーの実行結果を含む配列のPromise
   */
  emitAsync(eventName: string, data?: any, options?: AsyncEmitOptions): Promise<Array<any>>;
  
  /**
   * 複数のイベントをバッチ処理する
   * @param events イベント配列
   * @returns 各イベントの発火結果を含む配列
   */
  batchEmit(events: Array<{eventName: string, data?: any, options?: EmitOptions}>): Array<boolean>;
  
  /**
   * 特定のイベントにリスナーが登録されているか確認する
   * @param eventName イベント名
   * @returns リスナーが登録されていればtrue
   */
  hasListeners(eventName: string): boolean;
  
  /**
   * 特定のイベントに登録されているリスナーの数を取得する
   * @param eventName イベント名
   * @returns リスナーの数
   */
  listenerCount(eventName: string): number;
  
  /**
   * 登録されているすべてのイベント名を取得する
   * @returns イベント名の配列
   */
  eventNames(): string[];
  
  /**
   * 内部イベントリスナーを設定する
   */
  setupEventListeners(): void;
  
  /**
   * イベントリスナーをクリーンアップする
   * @param groupName クリーンアップするリスナーグループ名（省略時は全グループ）
   */
  cleanupEventListeners(groupName?: string): void;
  
  /**
   * デバッグイベントリスナーの有効/無効を切り替える
   * @param enabled 有効にするかどうか
   * @param options デバッグオプション
   * @returns 設定後のデバッグモード状態
   */
  enableDebugEvents(enabled: boolean, options?: DebugOptions): boolean;
  
  /**
   * イベントログを取得する
   * @param filter イベント名でフィルタリング
   * @param limit 取得する最大件数
   * @param options 追加オプション
   * @returns イベントログエントリの配列
   */
  getEventLog(filter?: string | string[], limit?: number, options?: LogOptions): Array<EventLogEntry>;
  
  /**
   * イベント名がパターンにマッチするかを確認する
   * @param eventName イベント名
   * @param pattern マッチングパターン
   * @returns マッチする場合はtrue
   */
  eventNameMatches(eventName: string, pattern: string | RegExp): boolean;
}

// 型定義
type EmitOptions = {
  stopOnFalse?: boolean;
  depth?: number;
};

type AsyncEmitOptions = {
  parallel?: boolean;
  timeout?: number;
};

type DebugOptions = {
  logLimit?: number;
  eventFilter?: string | string[];
  detailedLogging?: boolean;
};

type LogOptions = {
  offset?: number;
  sortOrder?: 'asc' | 'desc';
  includeData?: boolean;
};

type EventLogEntry = {
  timestamp: number;
  eventName: string;
  data: any;
  turn?: number;
  phase?: string | null;
};
```

## 14. 実装の注意点

- **EventSystemとの連携**: 既存のEventSystemを最大限活用し、拡張する
- **エラー処理**: 一貫したエラー処理アプローチを適用
- **メモリ管理**: 適切なリソース解放とメモリリーク防止
- **型安全性**: JSDocを使用した型アノテーションの充実
- **テスト容易性**: テスト可能な設計と単体テストのサポート
- **パフォーマンス**: 高頻度イベントの効率的な処理

## 15. まとめ

GameManagerEventモジュールは、人狼ゲームGM支援ライブラリにおけるイベント管理の中核を担います。Mix-inパターンによる実装で、基本的なイベント登録・発火機能から高度なデバッグ機能、非同期処理、安全性対策まで幅広い機能を提供します。特にメモリ管理、循環検出、イベント伝播制御などの安全性機能と、バッチ処理や非同期イベント処理などの性能最適化により、堅牢で拡張性の高いイベントシステムを実現します。

本設計に基づいた実装により、ゲーム状態の変更やアクションをイベントとして適切に管理し、モジュール間の疎結合なコミュニケーションを実現することで、保守性と拡張性に優れたライブラリを構築できます。
