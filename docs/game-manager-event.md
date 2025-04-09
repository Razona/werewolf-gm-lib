# GameManager - GameManagerEvent.js 設計書

## 概要

`GameManagerEvent.js` はGameManagerのイベント管理機能を提供するモジュールです。ゲーム内で発生するイベントの登録、購読、発火を管理し、モジュール間の疎結合な通信を実現します。

## 役割

- イベントリスナーの登録と管理
- イベント発火の管理
- イベントの伝播と処理
- イベントログの記録（デバッグ用）
- イベントパターンのマッチング

## 依存モジュール

このファイルはGameManagerのMix-inとして実装され、GameManagerインスタンスのコンテキストで実行されるため、特にEventSystemとのインタラクションが中心となります。

## Mix-in関数の定義

GameManagerのプロトタイプに以下のメソッドを追加します：

### on(eventName, callback, priority)
**説明**: イベントリスナーを登録します。  
**アクセス**: public  
**パラメータ**:
- eventName: イベント名（階層構造可: 'phase.start.night'）
- callback: イベント発生時に呼び出されるコールバック関数
- priority: リスナーの優先度（高いほど先に実行）  
**戻り値**: 登録成功時にtrue  
**処理内容**:
- EventSystemにイベントリスナー登録を委譲
- エラー処理

### once(eventName, callback, priority)
**説明**: 一度だけ呼び出されるイベントリスナーを登録します。  
**アクセス**: public  
**パラメータ**:
- eventName: イベント名
- callback: イベント発生時に呼び出されるコールバック関数
- priority: リスナーの優先度  
**戻り値**: 登録成功時にtrue  
**処理内容**:
- EventSystemにワンタイムリスナー登録を委譲
- エラー処理

### off(eventName, callback)
**説明**: イベントリスナーを削除します。  
**アクセス**: public  
**パラメータ**:
- eventName: イベント名
- callback: 削除するリスナー（省略時は該当イベントのすべてのリスナーを削除）  
**戻り値**: 削除成功時にtrue  
**処理内容**:
- EventSystemにイベントリスナー削除を委譲
- エラー処理

### emit(eventName, data)
**説明**: イベントを発火します。  
**アクセス**: public  
**パラメータ**:
- eventName: 発火するイベント名
- data: イベントデータ  
**戻り値**: 発火成功時にtrue  
**処理内容**:
- EventSystemにイベント発火を委譲
- エラー処理

### hasListeners(eventName)
**説明**: 特定のイベントに対してリスナーが登録されているか確認します。  
**アクセス**: public  
**パラメータ**:
- eventName: 確認するイベント名  
**戻り値**: リスナーが登録されていればtrue  
**処理内容**:
- EventSystemにリスナー確認を委譲

### listenerCount(eventName)
**説明**: 特定のイベントに登録されているリスナーの数を取得します。  
**アクセス**: public  
**パラメータ**:
- eventName: 確認するイベント名  
**戻り値**: リスナーの数  
**処理内容**:
- EventSystemにリスナー数取得を委譲

### eventNames()
**説明**: 登録されているすべてのイベント名を取得します。  
**アクセス**: public  
**戻り値**: イベント名の配列  
**処理内容**:
- EventSystemにイベント名取得を委譲

### setupEventListeners()
**説明**: 内部イベントリスナーのセットアップを行います。  
**アクセス**: private  
**処理内容**:
- 各種イベントの内部リスナー設定
- プレイヤー死亡時の処理
- フェーズ終了時の処理
- ゲーム終了時の処理
- エラー発生時の処理
- デバッグモード時のリスナー設定

### cleanupEventListeners()
**説明**: イベントリスナーのクリーンアップを行います。  
**アクセス**: private  
**処理内容**:
- 特定のイベントリスナーの削除
- ゲーム終了時やリセット時の呼び出し

### logEvent(eventName, data)
**説明**: イベントをログに記録します（デバッグ用）。  
**アクセス**: private  
**パラメータ**:
- eventName: イベント名
- data: イベントデータ  
**処理内容**:
- イベントログへの追加
- タイムスタンプ、ターン、フェーズ情報の記録
- ログサイズの制限管理

### outputEventLog()
**説明**: イベントログを出力します（デバッグ用）。  
**アクセス**: private  
**戻り値**: イベントログ  
**処理内容**:
- イベントログの返却

### enableDebugEvents(enabled)
**説明**: デバッグイベントリスナーの有効/無効を切り替えます。  
**アクセス**: public  
**パラメータ**:
- enabled: 有効にするかどうか  
**戻り値**: 設定成功時にtrue  
**処理内容**:
- デバッグリスナーの有効化または無効化
- イベントログの初期化
- すべてのイベントをログに記録するリスナーの設定

### getEventLog(filter, limit)
**説明**: イベントログを取得します（デバッグ用）。  
**アクセス**: public  
**パラメータ**:
- filter: イベント名でフィルタリング（オプション）
- limit: 取得する最大件数（オプション）  
**戻り値**: イベントログ  
**処理内容**:
- イベントログの取得
- フィルタリング処理
- 件数制限処理

### eventNameMatches(eventName, pattern)
**説明**: 特定のイベントパターンがマッチするかを確認します。  
**アクセス**: private  
**パラメータ**:
- eventName: イベント名
- pattern: パターン（ワイルドカード '*' を含む）  
**戻り値**: マッチする場合はtrue  
**処理内容**:
- イベント名の分割
- パターンマッチング処理

## 設計上の注意点

1. **イベント命名規則**
   - 階層構造: ドット(.)区切りの階層的な命名（例: `player.death.after`）
   - 接頭辞: モジュール名で始めて分類を明確に
   - before/after: 処理前後のイベントを区別

2. **リスナーの優先順位**
   - 重要なリスナーには高い優先度を設定
   - 基本リスナーとカスタムリスナーの実行順の調整

3. **パフォーマンス考慮**
   - リスナー数の管理（過多なリスナーによるパフォーマンス低下防止）
   - イベントログのサイズ制限（メモリ使用量の抑制）
   - 頻繁に発火するイベントの最適化

4. **メモリリーク防止**
   - 不要になったリスナーの適切な削除
   - ゲーム終了時のリスナークリーンアップ

5. **デバッグ機能**
   - イベントログの記録と分析機能
   - 選択的なイベントフィルタリング

## イベントリスト

主要なイベント一覧：

| カテゴリ | イベント名 | 発火タイミング | データ例 |
|---------|----------|--------------|---------|
| **ゲーム全体** | game.start.before | ゲーム開始前 | `{}` |
| | game.start.after | ゲーム開始後 | `{playerCount, turn, phase}` |
| | game.end | ゲーム終了時 | `{winner, reason, turn}` |
| **フェーズ** | phase.transition.before | フェーズ遷移前 | `{fromPhase, toPhaseId, turn}` |
| | phase.transition.after | フェーズ遷移後 | `{fromPhase, toPhase, turn}` |
| | phase.start.* | 各フェーズ開始時 | `{phase, turn}` |
| | phase.end.* | 各フェーズ終了時 | `{phase, turn}` |
| **プレイヤー** | player.add | プレイヤー追加時 | `{playerId, name}` |
| | player.death.before | プレイヤー死亡前 | `{playerId, cause, turn}` |
| | player.death.after | プレイヤー死亡後 | `{playerId, player, cause, turn, role}` |
| **役職** | role.list.set | 役職リスト設定時 | `{roles}` |
| | role.distribution.after | 役職配布後 | `{distribution}` |
| | role.assigned.after | 役職割り当て後 | `{playerId, roleName, player}` |
| **投票** | vote.before | 投票前 | `{voterId, targetId, turn, phase}` |
| | vote.after | 投票後 | `{voterId, targetId, turn, phase}` |
| | vote.count.after | 投票集計後 | `{result, turn, phase}` |
| | execution.before | 処刑前 | `{targetId, playerName, turn}` |
| | execution.after | 処刑後 | `{targetId, playerName, role, turn}` |
| **アクション** | action.register.after | アクション登録後 | `{actionId, action, turn, phase}` |
| | action.execute.after | アクション実行後 | `{results, turn, phase}` |
| | action.*.result | 各アクション結果 | `{actorId, targetId, success, turn}` |
| **エラー** | error | エラー発生時 | `{code, message, level, context}` |

## 使用例

```
// イベントリスナーの登録
game.on('player.death', (data) => {
  console.log(`プレイヤー${data.playerId}が死亡しました: ${data.cause}`);
});

// 高優先度のリスナー（先に実行される）
game.on('phase.start.night', (data) => {
  console.log('夜フェーズを先に処理');
}, 10);

// 一度だけ実行されるリスナー
game.once('game.end', (data) => {
  console.log(`ゲーム終了: ${data.winner}陣営の勝利`);
});

// カスタムイベントの発火
game.emit('custom.event', { data: 'カスタムデータ' });

// イベントリスナーの削除
const myListener = (data) => { console.log(data); };
game.on('custom.event', myListener);
game.off('custom.event', myListener);

// デバッグモード有効化（イベントログの記録開始）
game.enableDebugEvents(true);

// イベントログの取得
const phaseEvents = game.getEventLog('phase.*', 10);
console.log('最近の10件のフェーズイベント:', phaseEvents);

// デバッグモード無効化
game.enableDebugEvents(false);
```
