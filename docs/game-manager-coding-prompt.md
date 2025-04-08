# GameManager 実装プロンプト

以下は人狼ゲームGM支援ライブラリの GameManager クラスを実装するためのプロンプトです。

## プロジェクト背景

人狼ゲーム配信コミュニティのGM向けに、ゲーム進行の核となる処理を提供するJavaScriptライブラリを開発しています。このライブラリはNode.jsとブラウザの両環境で動作し、DiscordボットやOBS連携ツールなど様々なGMツールに組み込むことができます。

## GameManager の役割

GameManager はライブラリの中心的なコンポーネントで、以下の責務を持ちます：

1. ゲームインスタンスの作成と初期化
2. 各モジュール間の調整
3. ゲーム状態の保持
4. 公開APIの提供

## 技術要件

- ES6モジュール形式（CommonJSではなく）
- モジュール間の依存関係を適切に管理
- イベント駆動型アーキテクチャに準拠
- 拡張性を考慮した設計

## コード実装に関する指示

### ファイル情報

```
ファイルパス: src/service/GameManager.js
```

### 依存するモジュール

```javascript
// コアモジュール
import EventSystem from '../core/event/EventSystem';
import ErrorHandler from '../core/error/ErrorHandler';
import * as utils from '../core/common/utils';

// ドメインモジュール
import PlayerManager from '../domain/player/PlayerManager';
import RoleManager from '../domain/role/RoleManager';
import PhaseManager from '../domain/phase/PhaseManager';
import ActionManager from '../domain/action/ActionManager';
import VoteManager from '../domain/vote/VoteManager';
import VictoryManager from '../domain/victory/VictoryManager';
```

### クラス構造

GameManager クラスは以下の基本構造で実装してください：

```javascript
export default class GameManager {
  constructor(options = {}) {
    // 初期化処理
    // ...
  }
  
  // 公開API
  // ...
  
  // プライベートメソッド
  // ...
}
```

### 実装すべき機能

以下の機能を実装してください：

1. **初期化と設定**
   - コンストラクタでのオプション処理
   - 各マネージャーの初期化
   - レギュレーション設定

2. **プレイヤー管理**
   - プレイヤーの追加/削除
   - プレイヤー情報の取得

3. **役職管理**
   - 役職リストの設定
   - 役職の割り当て

4. **ゲーム進行**
   - ゲーム開始
   - フェーズ遷移
   - アクション登録
   - 投票処理

5. **状態管理**
   - 現在のゲーム状態取得
   - 勝利条件チェック
   - ゲーム終了処理

6. **イベント処理**
   - イベントリスナーの設定
   - イベントリスナーの登録/削除

7. **エラー処理**
   - エラーハンドリング
   - 状態の整合性維持

### 具体的な実装例

以下は実装すべきメソッドの例です：

```javascript
// プレイヤー追加
addPlayer(name) {
  return this.playerManager.addPlayer(name);
}

// 役職設定
setRoles(roleList) {
  return this.roleManager.setRoles(roleList);
}

// ゲーム開始
start() {
  // 実装例：ゲーム開始の条件確認と初期フェーズへの移行
}

// 次のフェーズへ移行
nextPhase() {
  return this.phaseManager.moveToNextPhase();
}

// 投票処理
vote(voterId, targetId) {
  return this.voteManager.registerVote(voterId, targetId);
}

// アクション登録
registerAction(action) {
  return this.actionManager.registerAction(action);
}

// 勝利条件チェック
checkWinCondition() {
  return this.victoryManager.checkVictoryConditions();
}

// イベントリスナー登録（公開API）
on(eventName, callback) {
  return this.eventSystem.on(eventName, callback);
}
```

### 要件詳細

1. **マネージャー間の相互参照設定**
   - 各マネージャーの初期化後、必要に応じて相互参照を設定する機能
   - マネージャー間の依存関係が循環しないよう注意

2. **状態の一貫性管理**
   - 複数のマネージャーにまたがる状態変更をトランザクション的に扱う方法
   - 状態変更イベントの適切な発火

3. **エラー処理の組み込み**
   - マネージャーからのエラーを適切に処理
   - ゲーム状態の整合性を維持するエラーリカバリー機能

4. **イベント処理の最適化**
   