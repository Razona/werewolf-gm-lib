# GameManager - GameManagerVote.js 設計書

## 概要

`GameManagerVote.js` はGameManagerの投票管理機能を提供するモジュールです。昼フェーズにおける処刑者決定のための投票プロセスを管理し、プレイヤーの投票の受付から集計、処刑対象の決定までの一連の流れを制御します。

## 役割

- 投票の受付と管理
- 投票結果の集計
- 同数得票時の処理
- 決選投票の管理
- 処刑対象の決定と処刑実行

## 依存モジュール

このファイルはGameManagerのMix-inとして実装され、GameManagerインスタンスのコンテキストで実行されるため、特にVoteManagerとPlayerManagerとのインタラクションが中心となります。

## Mix-in関数の定義

GameManagerのプロトタイプに以下のメソッドを追加します：

### vote(voterId, targetId)
**説明**: プレイヤーの投票を登録します。  
**アクセス**: public  
**パラメータ**:
- voterId: 投票者のプレイヤーID
- targetId: 投票先のプレイヤーID  
**戻り値**: 投票登録結果  
**処理内容**:
- ゲーム開始状態の確認
- フェーズ確認（投票・決選投票フェーズのみ許可）
- 投票者生存確認
- 投票対象生存確認
- 自己投票確認（レギュレーションで禁止の場合）
- 投票登録前イベントの発火
- 投票の登録
- 投票登録後イベントの発火
- エラー処理

### countVotes()
**説明**: 投票結果を集計します。  
**アクセス**: public  
**戻り値**: 集計結果  
**処理内容**:
- ゲーム開始状態の確認
- フェーズ確認（投票・決選投票フェーズのみ許可）
- 投票集計前イベントの発火
- 投票を集計
- 投票集計後イベントの発火
- エラー処理

### executeVote()
**説明**: 投票結果に基づいて処刑を実行します。  
**アクセス**: public  
**戻り値**: 処刑結果  
**処理内容**:
- ゲーム開始状態の確認
- フェーズ確認（投票・決選投票フェーズのみ許可）
- 投票を集計
- 処刑対象の決定
- 決選投票が必要な場合は決選投票フェーズに移行
- 処刑対象がない場合はイベント発火と次フェーズへ移行
- 全員処刑の特殊ケース処理
- 通常の処刑実行
- エラー処理

### determineExecutionTarget(voteResult)
**説明**: 処刑対象を決定する内部メソッドです。  
**アクセス**: private  
**パラメータ**:
- voteResult: 投票集計結果  
**戻り値**: 処刑対象決定結果  
**処理内容**:
- 同数得票時のルール適用
- フェーズに応じたルールの選択
- 決選投票・ランダム・処刑なし・全員処刑などの処理
- 同数得票がない場合は最多得票者を選択

### executePlayer(playerId)
**説明**: 特定のプレイヤーを処刑します。  
**アクセス**: private  
**パラメータ**:
- playerId: 処刑対象のプレイヤーID  
**戻り値**: 処刑結果  
**処理内容**:
- 処刑前イベントの発火
- プレイヤーの死亡処理
- 役職情報の取得（公開設定に応じて）
- 処刑後イベントの発火
- 勝利条件チェック
- 次フェーズへの移行

### executeAllTiedPlayers(playerIds)
**説明**: 同数得票の全プレイヤーを処刑します。  
**アクセス**: private  
**パラメータ**:
- playerIds: 処刑対象のプレイヤーIDリスト  
**戻り値**: 処刑結果  
**処理内容**:
- 全体の処刑前イベント発火
- 各プレイヤーの死亡処理
- 処刑情報の記録
- 全体の処刑後イベント発火
- 勝利条件チェック
- 次フェーズへの移行

### getCurrentVotes()
**説明**: 現在の投票状況を取得します。  
**アクセス**: public  
**戻り値**: 現在の投票リスト  
**処理内容**:
- ゲーム開始状態の確認
- VoteManagerから現在の投票状況取得
- エラー処理

### getVoteTarget(voterId)
**説明**: 特定プレイヤーの投票先を取得します。  
**アクセス**: public  
**パラメータ**:
- voterId: 投票者のプレイヤーID  
**戻り値**: 投票先のプレイヤーID、未投票の場合はnull  
**処理内容**:
- ゲーム開始状態の確認
- プレイヤー存在確認
- VoteManagerから投票先取得
- エラー処理

### getVotersOf(targetId)
**説明**: 特定のプレイヤーに投票したプレイヤー一覧を取得します。  
**アクセス**: public  
**パラメータ**:
- targetId: 対象プレイヤーID  
**戻り値**: 投票者のプレイヤーIDリスト  
**処理内容**:
- ゲーム開始状態の確認
- プレイヤー存在確認
- VoteManagerから投票者リスト取得
- エラー処理

### getVoteHistory(turn)
**説明**: 投票履歴を取得します。  
**アクセス**: public  
**パラメータ**:
- turn: 特定のターンの履歴を取得する場合は指定（省略時は全ターン）  
**戻り値**: 投票履歴  
**処理内容**:
- ゲーム開始状態の確認
- VoteManagerから投票履歴取得
- エラー処理

## 設計上の注意点

1. **投票の検証**
   - 適切なフェーズでのみ投票を許可
   - 生存プレイヤーのみが投票可能
   - 生存プレイヤーのみが投票対象
   - 自己投票のレギュレーションに基づいた検証

2. **同数投票の処理**
   - レギュレーション設定に従った適切な同数処理
   - 決選投票フェーズへの移行管理
   - ランダム選出のための乱数生成器の活用

3. **処刑処理の連携**
   - プレイヤー死亡処理との連携
   - 役職公開設定の反映
   - 勝利条件チェックの連動

4. **イベント駆動アーキテクチャ**
   - 投票プロセス各段階でのイベント発火
   - フェーズ遷移との連携

5. **エラー処理**
   - 投票時のエラーを適切に捕捉
   - 不正な操作の防止

## イベントリスト

投票管理に関連するイベント一覧：

| イベント名 | 発火タイミング | データ内容 |
|------------|----------------|------------|
| `vote.before` | 投票登録前 | `{voterId, targetId, turn, phase}` |
| `vote.after` | 投票登録後 | `{voterId, targetId, turn, phase, isChange, previousTarget}` |
| `vote.count.before` | 投票集計前 | `{turn, phase}` |
| `vote.count.after` | 投票集計後 | `{result, turn, phase}` |
| `vote.runoff.start` | 決選投票開始時 | `{candidates, turn}` |
| `execution.before` | 処刑実行前 | `{targetId, playerName, turn}` |
| `execution.after` | 処刑実行後 | `{targetId, playerName, role, turn}` |
| `execution.none` | 処刑なし時 | `{reason, turn}` |
| `execution.all.before` | 複数処刑実行前 | `{targetIds, turn}` |
| `execution.all.after` | 複数処刑実行後 | `{executed, turn}` |

## 使用例

```
// ゲーム準備と開始
// ...

// 投票フェーズへの移行
game.moveToPhase('vote');

// プレイヤーの投票
game.vote(0, 2); // プレイヤー0がプレイヤー2に投票
game.vote(1, 2); // プレイヤー1がプレイヤー2に投票
game.vote(2, 1); // プレイヤー2がプレイヤー1に投票

// 投票状況の確認
const currentVotes = game.getCurrentVotes();
console.log(currentVotes);

// 特定プレイヤーへの投票者確認
const votersOfPlayer2 = game.getVotersOf(2);
console.log(`プレイヤー2への投票者: ${votersOfPlayer2.length}人`);

// 集計のみを行う（処刑は実行しない）
const voteResult = game.countVotes();
console.log(`最多得票: ${voteResult.maxVoted}`);

// 処刑の実行
const executionResult = game.executeVote();
console.log(executionResult);

// 決選投票が必要な場合
if (executionResult.result === 'runoff') {
  console.log(`決選投票開始: ${executionResult.candidates.join(', ')}`);
  
  // 決選投票
  game.vote(0, executionResult.candidates[0]);
  game.vote(1, executionResult.candidates[1]);
  
  // 決選投票の実行
  const runoffResult = game.executeVote();
  console.log(runoffResult);
}

// 投票履歴の取得
const voteHistory = game.getVoteHistory(1); // 1ターン目の履歴
console.log(voteHistory);
```
