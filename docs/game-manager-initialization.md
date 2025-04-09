# GameManager - GameManagerInitialization.js 設計書

## 概要

`GameManagerInitialization.js` はGameManagerの初期化と設定に関連する機能を提供します。ゲームインスタンスの初期化、レギュレーション設定、マネージャー間の相互参照設定など、ゲーム起動時に必要な処理を担当します。

## 役割

- ゲームインスタンスの初期化処理
- レギュレーションの設定と検証
- マネージャー間の相互参照設定
- 初期ゲーム状態の構築
- オプションの検証と適用

## 依存モジュール

このファイルはGameManagerのMix-inとして実装され、GameManagerインスタンスのコンテキストで実行されるため、GameManagerの各種プロパティやメソッドに依存します。

## Mix-in関数の定義

GameManagerのプロトタイプに以下のメソッドを追加します：

### initialize()
**説明**: ゲームインスタンスの初期化処理を行います。  
**アクセス**: private  
**処理内容**:
- オプションの検証
- レギュレーションの設定
- マネージャー間の相互参照設定
- イベントリスナーのセットアップ
- 乱数生成器の初期化
- 初期状態の設定
- 初期化完了イベントの発火

### setRegulations(regulations)
**説明**: ゲームレギュレーションを設定します。  
**アクセス**: public  
**パラメータ**:
- regulations: レギュレーション設定オブジェクト  
**処理内容**:
- デフォルトレギュレーションとマージ
- レギュレーション設定イベントの発火
- 設定されたレギュレーションの返却

### setupCrossReferences()
**説明**: マネージャー間の相互参照を設定します。  
**アクセス**: private  
**処理内容**:
- マネージャー間の依存関係設定
- PhaseManagerが他マネージャーを参照
- VoteManagerがPlayerManagerを参照
- ActionManagerが他マネージャーを参照
- VictoryManagerが他マネージャーを参照
- RoleManagerがPlayerManagerを参照

### validateOptions(options)
**説明**: オプションの検証を行います。  
**アクセス**: private  
**パラメータ**:
- options: 検証するオプションオブジェクト  
**処理内容**:
- オプション値の型と範囲の検証
- 無効なオプションの検出
- エラーの生成と処理

### resetGameState()
**説明**: ゲーム状態を初期状態にリセットします。  
**アクセス**: private  
**処理内容**:
- ゲーム状態の初期化（未開始状態）
- ターンとフェーズのリセット
- 勝者情報のクリア

### reset()
**説明**: ゲーム全体をリセットし、再利用できるようにします。  
**アクセス**: public  
**処理内容**:
- ゲーム状態のリセット
- 各マネージャーのリセット
- リセットイベントの発火

## デフォルトレギュレーション設定

```
{
  // 基本ルール
  allowConsecutiveGuard: false,     // 連続ガードの可否
  allowRoleMissing: false,          // 役職欠けの可否
  firstDayExecution: false,         // 初日処刑の有無
  
  // 投票関連
  executionRule: 'runoff',          // 同数時処理方法
  runoffTieRule: 'random',          // 決選投票同数時処理
  allowSelfVote: false,             // 自己投票の可否
  
  // 占い関連
  firstNightFortune: 'free',        // 初日占いルール
  seerResultType: 'team',           // 占い結果タイプ
  
  // 公開情報
  revealRoleOnDeath: true,          // 死亡時役職公開
  revealVotes: true,                // 投票内容公開
}
```

## 設計上の注意点

1. **初期化順序**
   - 正しい順序で初期化を行うことが重要
   - 依存関係を考慮した初期化フロー

2. **レギュレーション検証**
   - 矛盾するレギュレーション設定の検出
   - 不正な設定値のチェック

3. **相互参照の管理**
   - 循環参照を避ける設計
   - 適切なインターフェースを通じた参照

4. **エラーハンドリング**
   - 初期化時のエラーを適切に捕捉
   - わかりやすいエラーメッセージの提供

## イベント発火

- `game.initialized`: 初期化完了時
- `game.regulations.set`: レギュレーション設定時
- `game.reset`: ゲームリセット時
