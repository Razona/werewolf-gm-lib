# GameManager - GameManagerVictory.js 設計書

## 概要

`GameManagerVictory.js` はGameManagerの勝利条件判定機能を提供するモジュールです。ゲームの進行状況を監視し、各陣営の勝利条件達成を判定する役割を担います。村人陣営、人狼陣営、第三陣営（妖狐陣営など）の勝利条件を判定し、ゲームの終了を管理します。

## 役割

- 各陣営の勝利条件の判定
- 勝利条件チェックのタイミング制御
- ゲーム終了時の処理
- 勝利情報の管理と提供
- カスタム勝利条件の処理

## 依存モジュール

このファイルはGameManagerのMix-inとして実装され、GameManagerインスタンスのコンテキストで実行されるため、特にVictoryManagerとの連携が中心となります。

## Mix-in関数の定義

GameManagerのプロトタイプに以下のメソッドを追加します：

### checkWinCondition()
**説明**: 勝利条件をチェックします。  
**アクセス**: public  
**戻り値**: 勝利した陣営の情報、または勝利条件が満たされていない場合はnull  
**処理内容**:
- ゲーム開始状態の確認
- ゲーム終了状態の確認（既に終了している場合は現在の結果を返す）
- 勝利条件チェック前イベントの発火
- 勝利条件のチェック
- 勝利条件が満たされた場合の処理
  - 勝利条件達成イベント発火
  - ゲーム状態の更新
  - ゲーム終了フェーズへの移行
- 勝利条件チェック後イベントの発火
- エラー処理

### getWinResult()
**説明**: ゲームの勝利結果を取得します。  
**アクセス**: public  
**戻り値**: 勝利結果情報、またはゲームが終了していない場合はnull  
**処理内容**:
- ゲーム終了状態の確認
- VictoryManagerから勝利結果取得

### getWinner()
**説明**: 勝利した陣営を取得します。  
**アクセス**: public  
**戻り値**: 勝利した陣営名、またはゲームが終了していない場合はnull  
**処理内容**:
- ゲーム状態から勝者情報を返却

### forceEndGame(result)
**説明**: ゲームを強制的に終了させます。  
**アクセス**: public  
**パラメータ**:
- result: 強制終了の結果情報
  - winner: 勝者陣営
  - reason: 終了理由  
**戻り値**: 終了結果  
**処理内容**:
- ゲーム開始状態の確認
- 強制終了前イベント発火
- ゲーム状態の更新
- 勝利情報の設定
- 強制終了後イベント発火
- ゲーム終了イベント発火
- エラー処理

### registerVictoryCondition(condition)
**説明**: カスタム勝利条件を登録します。  
**アクセス**: public  
**パラメータ**:
- condition: 勝利条件オブジェクト  
**戻り値**: 登録成功時にtrue  
**処理内容**:
- VictoryManagerにカスタム勝利条件登録を委譲
- エラー処理

### getTeamPlayers(team)
**説明**: 特定の陣営に所属するプレイヤーIDのリストを取得します。  
**アクセス**: public  
**パラメータ**:
- team: 陣営名  
**戻り値**: プレイヤーIDのリスト  
**処理内容**:
- RoleManagerから該当プレイヤー取得
- エラー処理

### generateGameStatistics()
**説明**: ゲーム終了時の統計情報を生成します。  
**アクセス**: public  
**戻り値**: ゲーム統計情報  
**処理内容**:
- ゲーム開始状態の確認
- プレイヤー統計の収集
- 陣営統計の収集
- ターン統計の収集
- 統計データの返却
- エラー処理

## 設計上の注意点

1. **勝利条件のチェックタイミング**
   - プレイヤー死亡時
   - フェーズ終了時
   - 特定のアクション完了時
   - 手動チェック時

2. **各陣営の勝利条件**
   - 村人陣営：すべての人狼を排除
   - 人狼陣営：人狼の数が村人陣営と同数以上になる
   - 妖狐陣営：他の陣営の勝利条件達成時に生存している

3. **複雑な勝利条件の処理**
   - 同時達成時の優先順位付け
   - 特殊役職による影響
   - カスタム勝利条件の対応

4. **ゲーム終了処理**
   - 勝利条件達成時の適切なフェーズ遷移
   - 最終結果の正確な集計
   - すべてのプレイヤーへの結果通知

5. **イベント発火**
   - 勝利条件チェック前後のイベント
   - 勝利条件達成時のイベント
   - ゲーム終了時のイベント

## イベントリスト

勝利条件判定に関連するイベント一覧：

| イベント名 | 発火タイミング | データ内容 |
|------------|----------------|------------|
| `victory.check.before` | 勝利条件チェック前 | `{turn, phase}` |
| `victory.check.after` | 勝利条件チェック後 | `{result, turn}` |
| `victory.condition.met` | 勝利条件達成時 | `{winningTeam, condition, reason, turn}` |
| `game.forceEnd.before` | 強制終了前 | `{result, turn}` |
| `game.forceEnd.after` | 強制終了後 | `{result, turn}` |
| `game.end` | ゲーム終了時 | `{winner, reason, forcedEnd, turn}` |

## 使用例

```
// ゲーム進行中...

// 勝利条件チェック（通常は自動的に行われる）
const winResult = game.checkWinCondition();
if (winResult) {
  console.log(`ゲーム終了: ${winResult.winningTeam}陣営の勝利`);
  console.log(`勝利理由: ${winResult.reason}`);
}

// 特定の状況での強制終了
game.forceEndGame({
  winner: 'draw',
  reason: '時間切れ'
});

// ゲーム終了後の統計情報取得
const statistics = game.generateGameStatistics();
console.log(statistics);

// カスタム勝利条件の登録例（ゲーム開始前に行う）
game.registerVictoryCondition({
  id: 'lovers_win',
  team: 'lovers',
  displayName: '恋人陣営勝利',
  description: '恋人同士だけが生き残った',
  condition: (gameState) => {
    // 勝利条件の判定ロジック
    const alivePlayers = gameState.getAlivePlayers();
    const loverPlayers = alivePlayers.filter(p => p.hasStatusEffect('lover'));
    
    return {
      satisfied: loverPlayers.length >= 2 && loverPlayers.length === alivePlayers.length,
      winningTeam: 'lovers',
      reason: '恋人たちだけが生き残った'
    };
  },
  priority: 70 // 優先度
});
```
