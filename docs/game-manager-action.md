# GameManager - GameManagerAction.js 設計書

## 概要

`GameManagerAction.js` はGameManagerのアクション管理機能を提供するモジュールです。夜フェーズにおける役職能力の使用（占い、護衛、襲撃など）の登録、実行、結果処理を担当します。

## 役割

- アクションの登録と検証
- アクション実行の管理
- アクション間の優先順位と相互作用の処理
- アクション結果の管理と通知
- 夜アクションの自動処理

## 依存モジュール

このファイルはGameManagerのMix-inとして実装され、GameManagerインスタンスのコンテキストで実行されるため、特にActionManagerとRoleManagerとのインタラクションが中心となります。

## Mix-in関数の定義

GameManagerのプロトタイプに以下のメソッドを追加します：

### registerAction(action)
**説明**: アクションを登録します。  
**アクセス**: public  
**パラメータ**:
- action: アクションオブジェクト
  - type: アクションタイプ（'fortune', 'guard', 'attack'など）
  - actor: アクション実行者のプレイヤーID
  - target: アクション対象のプレイヤーID
  - options: アクション固有のオプション  
**戻り値**: 登録されたアクションID  
**処理内容**:
- ゲーム開始状態の確認
- フェーズ確認（夜フェーズのみ許可）
- アクター生存確認
- ターゲット生存確認
- アクター役職確認
- アクション登録前イベントの発火
- アクションの検証と登録
- アクション登録後イベントの発火
- エラー処理

### executeActions()
**説明**: 登録されたアクションを実行します。  
**アクセス**: public  
**戻り値**: 実行結果の配列  
**処理内容**:
- ゲーム開始状態の確認
- フェーズ確認（夜フェーズのみ許可）
- アクション実行前イベントの発火
- アクションの実行
- アクション結果の処理
- アクション実行後イベントの発火
- エラー処理

### processActionResults(results)
**説明**: アクション結果を処理する内部メソッドです。  
**アクセス**: private  
**パラメータ**:
- results: アクション実行結果の配列  
**処理内容**:
- 結果配列の反復処理
- アクションタイプ別の結果処理
- カスタム処理の実行

### processAttackResult(result)
**説明**: 襲撃結果を処理します。  
**アクセス**: private  
**パラメータ**:
- result: 襲撃アクションの結果  
**処理内容**:
- 襲撃成功の確認
- 対象プレイヤーの護衛状態確認
- 襲撃による死亡処理
- 襲撃結果イベントの発火

### processGuardResult(result)
**説明**: 護衛結果を処理します。  
**アクセス**: private  
**パラメータ**:
- result: 護衛アクションの結果  
**処理内容**:
- 護衛成功の確認
- 対象プレイヤーへの護衛状態設定
- 護衛結果イベントの発火

### processCustomActionResult(result)
**説明**: カスタムアクション結果を処理します。  
**アクセス**: private  
**パラメータ**:
- result: カスタムアクションの結果  
**処理内容**:
- プラグインシステム用の拡張ポイント提供
- カスタムアクション結果イベントの発火

### getActionResults(playerId)
**説明**: 特定プレイヤーのアクション結果を取得します。  
**アクセス**: public  
**パラメータ**:
- playerId: プレイヤーID  
**戻り値**: プレイヤーに関連するアクション結果の配列  
**処理内容**:
- ゲーム開始状態の確認
- プレイヤー存在確認
- ActionManagerからアクション結果取得
- エラー処理

### getActionsByTurn(turn)
**説明**: 特定のターンに実行されたアクションを取得します。  
**アクセス**: public  
**パラメータ**:
- turn: ターン数  
**戻り値**: 指定ターンのアクションリスト  
**処理内容**:
- ゲーム開始状態の確認
- ActionManagerからアクション履歴取得
- エラー処理

### cancelAction(actionId)
**説明**: アクションをキャンセルします。  
**アクセス**: public  
**パラメータ**:
- actionId: キャンセルするアクションID  
**戻り値**: キャンセル成功時にtrue  
**処理内容**:
- ゲーム開始状態の確認
- アクションキャンセル前イベントの発火
- アクションのキャンセル
- アクションキャンセル後イベントの発火
- エラー処理

### getFortuneResult(targetId)
**説明**: 占い結果を取得します。  
**アクセス**: public  
**パラメータ**:
- targetId: 占われたプレイヤーID  
**戻り値**: 占い結果（'village', 'werewolf'など）  
**処理内容**:
- ゲーム開始状態の確認
- プレイヤー存在確認
- RoleManagerから占い結果取得
- エラー処理

### processFoxCurse(targetId)
**説明**: 狐への占いによる呪殺を処理します。  
**アクセス**: private  
**パラメータ**:
- targetId: 占われたプレイヤーID  
**戻り値**: 呪殺が発生した場合にtrue  
**処理内容**:
- 対象が存在し、生存している狐であるか確認
- 狐の呪殺処理
- 処理結果の返却

### applyFirstNightFortuneRule()
**説明**: 初日占いルールを適用します。  
**アクセス**: private  
**処理内容**:
- レギュレーションに応じた処理分岐
- ランダム白/ランダム占いの設定
- 初日占いルール適用イベントの発火

### checkConsecutiveGuardRule(guarderId, targetId)
**説明**: 連続ガードルールを適用します。  
**アクセス**: private  
**パラメータ**:
- guarderId: 騎士のプレイヤーID
- targetId: 護衛対象のプレイヤーID  
**戻り値**: ガードが許可される場合にtrue  
**処理内容**:
- 連続ガード禁止ルールの確認
- 前回の護衛対象との比較
- ガード可否の判定

## 設計上の注意点

1. **アクションの優先順位管理**
   - 役職能力の実行順序の適切な管理
   - 依存関係のあるアクション間の処理順序の保証

2. **規則の適用**
   - レギュレーション設定に基づいた制約の適用（連続ガード禁止など）
   - 初日占いルールの適用

3. **アクション結果の処理**
   - 役職能力の効果の適切な適用
   - 副作用（呪殺など）の処理

4. **状態の整合性維持**
   - アクション実行前後の状態チェック
   - プレイヤー状態の適切な更新

5. **イベント駆動**
   - アクション登録や実行時のイベント発火
   - 結果処理との連携

6. **エラー処理**
   - アクション登録時の検証と詳細なエラーメッセージ
   - エッジケースの適切な処理

## イベントリスト

アクション管理に関連するイベント一覧：

| イベント名 | 発火タイミング | データ内容 |
|------------|----------------|------------|
| `action.register.before` | アクション登録前 | `{action, turn, phase}` |
| `action.register.after` | アクション登録後 | `{actionId, action, turn, phase}` |
| `action.execute.before` | アクション実行前 | `{turn, phase}` |
| `action.execute.after` | アクション実行後 | `{results, turn, phase}` |
| `action.cancel.before` | アクションキャンセル前 | `{actionId, turn}` |
| `action.cancel.after` | アクションキャンセル後 | `{actionId, result, turn}` |
| `action.[type].result` | 各アクションタイプの結果時 | `{actorId, targetId, success, outcome, turn}` |
| `firstNight.fortune.rule` | 初日占いルール適用時 | `{rule, turn}` |

## 使用例

```
// ゲーム準備と開始
// ...

// 夜フェーズへの移行
game.moveToPhase('night');

// 占い師のアクション登録
const fortuneActionId = game.registerAction({
  type: 'fortune',
  actor: 0, // 占い師プレイヤーID
  target: 2, // 占われるプレイヤーID
});

// 騎士のアクション登録
const guardActionId = game.registerAction({
  type: 'guard',
  actor: 1, // 騎士プレイヤーID
  target: 0, // 護衛される占い師プレイヤーID
});

// 人狼の襲撃アクション登録
const attackActionId = game.registerAction({
  type: 'attack',
  actor: 3, // 人狼プレイヤーID
  target: 0, // 襲撃される占い師プレイヤーID
});

// アクションのキャンセル（例：人狼が襲撃対象を変更）
game.cancelAction(attackActionId);

// 新たな襲撃先でアクション登録
const newAttackActionId = game.registerAction({
  type: 'attack',
  actor: 3, // 人狼プレイヤーID
  target: 1, // 襲撃される騎士プレイヤーID
});

// アクションの実行
const results = game.executeActions();
console.log(results);

// 占い師プレイヤーの占い結果の確認
const fortuneResults = game.getActionResults(0);
console.log(`占い結果: ${fortuneResults[0].outcome.result}`);

// 次のフェーズへ移行
game.nextPhase();
```