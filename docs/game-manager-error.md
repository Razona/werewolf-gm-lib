# GameManager - GameManagerError.js 設計書

## 概要

`GameManagerError.js` はGameManagerのエラー処理機能を提供するモジュールです。ゲーム進行中のエラーの検出、分類、処理、報告を担当し、一貫したエラーハンドリングと適切な回復メカニズムを提供します。

## 役割

- エラーの検出と分類
- エラーメッセージの生成
- エラー処理ポリシーの管理
- エラー発生時の状態回復
- デバッグ情報の提供

## 依存モジュール

このファイルはGameManagerのMix-inとして実装され、GameManagerインスタンスのコンテキストで実行されるため、特にErrorHandlerとのインタラクションが中心となります。

## Mix-in関数の定義

GameManagerのプロトタイプに以下のメソッドを追加します：

### setErrorPolicy(policy)
**説明**: エラー処理ポリシーを設定します。  
**アクセス**: public  
**パラメータ**:
- policy: エラー処理ポリシー
  - logLevel: ログに記録するエラーレベル（'debug', 'info', 'warning', 'error', 'fatal'）
  - throwLevel: 例外をスローするエラーレベル
  - emitEvents: エラー発生時にイベントを発火するか  
**戻り値**: 設定されたポリシー  
**処理内容**:
- ErrorHandlerにポリシー設定を委譲
- エラー処理（基本的なエラー処理）

### validateOperation(operation, context)
**説明**: 操作の妥当性を検証します。  
**アクセス**: private  
**パラメータ**:
- operation: 検証する操作名
- context: 操作のコンテキスト情報  
**処理内容**:
- 操作に応じた検証ロジックの実行
- ゲーム開始状態、プレイヤー存在、フェーズ適合性などの検証
- 不正な操作検出時のエラー生成

### handleGameError(error, context)
**説明**: エラーをハンドリングします。  
**アクセス**: private  
**パラメータ**:
- error: 処理するエラー
- context: 追加のコンテキスト情報  
**処理内容**:
- ErrorHandlerにエラー処理を委譲
- トランザクション中の場合はロールバック
- エラー後の状態検証
- エラーハンドリング中のエラー処理（致命的）

### verifyStateAfterError()
**説明**: エラー発生後の状態整合性を検証します。  
**アクセス**: private  
**処理内容**:
- ゲーム開始済みかつ未終了の場合のみ検証
- プレイヤー状態の整合性確認
- 陣営バランスの確認（人狼全滅時は村人勝利など）
- 状態異常検出時の強制ゲーム終了

### getDiagnostics()
**説明**: デバッグ用にエラー情報を取得します。  
**アクセス**: public  
**戻り値**: 診断情報  
**処理内容**:
- ゲーム状態情報の収集
- 最近のエラー情報の取得
- トランザクション状態の確認
- 診断情報の返却

### logErrorDetails(error)
**説明**: エラー詳細をログ出力します（デバッグ用）。  
**アクセス**: public  
**パラメータ**:
- error: 出力するエラー  
**処理内容**:
- エラーメッセージ、コード、コンテキスト、スタックトレースの出力
- コンソールへのグループ化出力

### safeExecute(operation, operationName, context)
**説明**: 操作を安全に実行します（エラーハンドリング付き）。  
**アクセス**: public  
**パラメータ**:
- operation: 実行する操作関数
- operationName: 操作名（エラーコンテキスト用）
- context: 追加のコンテキスト情報  
**戻り値**: 操作の戻り値、またはエラー時はnull  
**処理内容**:
- try-catchでの操作実行
- エラー発生時のエラーハンドリング
- エラー時はnullを返却

## エラーコード一覧

主要なエラーコードと意味：

| エラーコード | 説明 | レベル |
|------------|------|-------|
| `GAME_NOT_STARTED` | ゲームが開始されていない | error |
| `GAME_ALREADY_STARTED` | ゲームが既に開始されている | error |
| `GAME_ALREADY_ENDED` | ゲームが既に終了している | error |
| `INVALID_PHASE` | 現在のフェーズでは操作が無効 | error |
| `PLAYER_NOT_FOUND` | プレイヤーが見つからない | error |
| `DEAD_PLAYER_CANNOT_ACT` | 死亡プレイヤーは行動できない | error |
| `INVALID_TARGET` | 無効な対象 | error |
| `INVALID_ACTION` | 無効なアクション | error |
| `INVALID_VOTE` | 無効な投票 | error |
| `ROLES_NOT_ASSIGNED` | 役職が割り当てられていない | error |
| `INCOMPATIBLE_VERSION` | 互換性のないバージョン | error |
| `INTERNAL_ERROR` | 内部エラー | fatal |

## 設計上の注意点

1. **エラー分類の明確化**
   - エラーの種類や重大度に基づく分類
   - エラーコードによる体系的な管理
   - コンテキスト情報の充実

2. **状態整合性の確保**
   - エラー発生時の状態回復メカニズム
   - トランザクション処理との連携
   - 常に安定した状態に復帰する機構

3. **柔軟な対応ポリシー**
   - 状況に応じたエラー処理ポリシーの適用
   - エラーレベルによる処理の差別化
   - イベント発火とロギングの制御

4. **デバッグ情報の充実**
   - 詳細な診断情報の提供
   - エラー履歴の管理
   - 開発者向けのデバッグツール

5. **安全な実行モデル**
   - エラーハンドリング付きの操作実行機構
   - 致命的でないエラーからの回復
   - グレースフルデグラデーション

## イベントリスト

エラー処理に関連するイベント一覧：

| イベント名 | 発火タイミング | データ内容 |
|------------|----------------|------------|
| `error` | 一般エラー発生時 | `{code, message, level, context}` |
| `error.fatal` | 致命的エラー発生時 | `{code, message, context}` |
| `error.warning` | 警告レベルのエラー発生時 | `{code, message, context}` |
| `error.validation` | 検証エラー発生時 | `{code, message, operation, context}` |
| `error.recovery` | エラー回復処理時 | `{code, message, actions}` |

## 使用例

```
// エラー処理ポリシーの設定
game.setErrorPolicy({
  logLevel: 'warning', // warning以上のレベルをログに記録
  throwLevel: 'error', // error以上のレベルで例外をスロー
  emitEvents: true     // すべてのエラーでイベント発火
});

// エラーイベントの購読
game.on('error', (errorData) => {
  console.error(`エラー発生: ${errorData.code} - ${errorData.message}`);
  
  // UIへのエラー通知
  displayErrorToUser(errorData.message);
});

// 安全な操作実行
game.safeExecute(
  () => game.vote(3, 1),
  'vote',
  { voterId: 3, targetId: 1 }
);

// try-catchによる明示的なエラーハンドリング
try {
  game.registerAction({
    type: 'fortune',
    actor: 0,
    target: 2
  });
} catch (error) {
  // エラー詳細の出力
  game.logErrorDetails(error);
  
  // 対応可能なエラーの場合は代替処理
  if (error.code === 'INVALID_TARGET') {
    console.warn('無効なターゲットです。別のプレイヤーを選択してください。');
  }
}

// デバッグ情報の取得
const diagnostics = game.getDiagnostics();
console.log('ゲームの診断情報:', diagnostics);
```
