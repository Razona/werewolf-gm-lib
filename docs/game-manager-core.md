# GameManager - GameManager.js 設計書

## 概要

`GameManager.js` はライブラリの中核となるクラスを定義し、他の全ての機能モジュールを統合します。ゲームインスタンスの作成、初期化、各マネージャーの連携を担当し、外部からの主要APIのエントリーポイントとなります。

## 役割

- GameManagerクラスの基本構造の定義
- 各機能モジュールの統合
- コンストラクタとクラスのコア機能の実装
- 公開APIの提供

## 依存モジュール

### コアモジュール
- EventSystem: イベント管理基盤
- ErrorHandler: エラー処理機構
- 共通ユーティリティ

### ドメインマネージャー
- PlayerManager: プレイヤー管理
- RoleManager: 役職管理
- PhaseManager: フェーズ管理
- ActionManager: アクション管理
- VoteManager: 投票管理
- VictoryManager: 勝利条件管理

### 機能Mix-in
- GameManagerInitializationMixin
- GameManagerPlayerMixin
- GameManagerRoleMixin
- GameManagerPhaseMixin
- GameManagerActionMixin
- GameManagerVoteMixin
- GameManagerStateMixin
- GameManagerEventMixin
- GameManagerVictoryMixin
- GameManagerErrorMixin
- GameManagerPluginMixin

## クラス定義の主要要素

### 静的プロパティ
- version: ライブラリのバージョン情報

### 静的メソッド
- isCompatible(): バージョン互換性チェック

### インスタンスプロパティ
- options: 設定オプション
- eventSystem: イベント管理システム
- errorHandler: エラー処理ハンドラー
- 各種マネージャーインスタンス
- state: ゲーム状態を管理するオブジェクト

### 主要メソッド
コンストラクタ:
- 基本設定の初期化
- コアシステムの初期化
- マネージャーの初期化
- 状態の初期化
- 初期設定実行

## Mix-inの適用

各Mix-inを適用してGameManagerクラスのプロトタイプを拡張し、機能を追加します。

## コア機能と責務

1. **初期化**
   - 各マネージャーのインスタンス化
   - オプション設定の検証と適用
   - イベントリスナーのセットアップ

2. **マネージャー間の連携**
   - 相互参照の設定
   - イベント購読の設定
   - 依存関係の管理

3. **公開API**
   - 外部から利用可能なメソッドの提供
   - API呼び出しの検証と処理
   - エラーハンドリング

## 設計上の考慮事項

1. **依存関係の方向性**
   - GameManagerは各マネージャーに依存する
   - 循環参照を避けるための設計

2. **拡張性**
   - プラグインシステムによる拡張
   - カスタム役職やルールの対応

3. **イベント駆動アーキテクチャ**
   - モジュール間の通信はイベントを介して行う
   - 疎結合な設計を維持

4. **エラー処理**
   - 一貫したエラーハンドリング
   - 状態の整合性の維持

## 使用例

- ゲームインスタンスの作成とオプション設定
- プレイヤーの追加
- 役職の設定と配布
- ゲーム開始と進行
