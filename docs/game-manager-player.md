# GameManager - GameManagerPlayer.js 設計書

## 概要

`GameManagerPlayer.js` はGameManagerのプレイヤー管理機能を提供するモジュールです。プレイヤーの追加、削除、取得、状態変更など、プレイヤーに関連する操作を担当します。

## 役割

- プレイヤーの追加と削除
- プレイヤー情報の取得
- プレイヤー状態の管理と変更
- プレイヤー関連のイベント処理
- プレイヤーリストの提供

## 依存モジュール

このファイルはGameManagerのMix-inとして実装され、GameManagerインスタンスのコンテキストで実行されるため、特にPlayerManagerとのインタラクションが中心となります。

## Mix-in関数の定義

GameManagerのプロトタイプに以下のメソッドを追加します：

### addPlayer(name)
**説明**: 新しいプレイヤーをゲームに追加します。  
**アクセス**: public  
**パラメータ**:
- name: プレイヤー名  
**戻り値**: 追加されたプレイヤーのID  
**処理内容**:
- ゲーム開始前のみ追加可能かチェック
- PlayerManagerにプレイヤー追加を委譲
- プレイヤー追加イベントの発火
- エラー処理

### removePlayer(id)
**説明**: 指定したIDのプレイヤーをゲームから削除します。  
**アクセス**: public  
**パラメータ**:
- id: 削除するプレイヤーのID  
**戻り値**: 削除成功時にtrue  
**処理内容**:
- ゲーム開始前のみ削除可能かチェック
- PlayerManagerにプレイヤー削除を委譲
- プレイヤー削除イベントの発火
- エラー処理

### getPlayer(id)
**説明**: 指定したIDのプレイヤー情報を取得します。  
**アクセス**: public  
**パラメータ**:
- id: プレイヤーID  
**戻り値**: プレイヤーオブジェクト  
**処理内容**:
- PlayerManagerからプレイヤー情報取得
- エラー処理（プレイヤーが存在しない場合）

### getPlayerByName(name)
**説明**: 名前からプレイヤーを検索して取得します。  
**アクセス**: public  
**パラメータ**:
- name: プレイヤー名  
**戻り値**: プレイヤーオブジェクト、または存在しない場合はnull

### getAlivePlayers()
**説明**: 生存しているプレイヤーのリストを取得します。  
**アクセス**: public  
**戻り値**: 生存プレイヤーの配列

### getAllPlayers()
**説明**: すべてのプレイヤーのリストを取得します。  
**アクセス**: public  
**戻り値**: 全プレイヤーの配列

### getPlayerCount()
**説明**: 総プレイヤー数を取得します。  
**アクセス**: public  
**戻り値**: プレイヤーの総数

### getAlivePlayerCount()
**説明**: 生存プレイヤー数を取得します。  
**アクセス**: public  
**戻り値**: 生存プレイヤーの数

### killPlayer(playerId, cause)
**説明**: 指定したプレイヤーを死亡させます。  
**アクセス**: public  
**パラメータ**:
- playerId: 対象プレイヤーID
- cause: 死因（'execution', 'attack', 'curse'など）  
**戻り値**: 処理成功時にtrue  
**処理内容**:
- 死亡前イベントの発火
- プレイヤーの死亡処理
- 役職の死亡ハンドラ呼び出し
- 死亡後イベントの発火
- 勝利条件のチェック
- エラー処理

### isPlayerAlive(playerId)
**説明**: プレイヤーが生存しているか確認します。  
**アクセス**: public  
**パラメータ**:
- playerId: 確認するプレイヤーID  
**戻り値**: 生存していればtrue  
**処理内容**:
- PlayerManagerに生存確認を委譲
- エラー処理

### setPlayerStatusEffect(playerId, effectType, value)
**説明**: プレイヤーに状態効果を設定します。  
**アクセス**: public  
**パラメータ**:
- playerId: 対象プレイヤーID
- effectType: 効果タイプ（'guarded', 'poisoned'など）
- value: 効果の値  
**戻り値**: 処理成功時にtrue  
**処理内容**:
- 状態効果の設定
- 状態効果イベントの発火
- エラー処理

### getPlayerStatusEffect(playerId, effectType)
**説明**: プレイヤーの状態効果を取得します。  
**アクセス**: public  
**パラメータ**:
- playerId: 対象プレイヤーID
- effectType: 効果タイプ  
**戻り値**: 効果の値、または効果がない場合はnull  
**処理内容**:
- PlayerManagerから状態効果取得
- エラー処理

### clearPlayerStatusEffects(playerId, effectType)
**説明**: プレイヤーの状態効果をクリアします。  
**アクセス**: public  
**パラメータ**:
- playerId: 対象プレイヤーID
- effectType: クリアする効果タイプ（省略時は全効果をクリア）  
**戻り値**: 処理成功時にtrue  
**処理内容**:
- PlayerManagerに状態効果クリアを委譲
- エラー処理

## 設計上の注意点

1. **状態一貫性の確保**
   - プレイヤー状態変更時にイベント発火を確実に行う
   - 死亡処理と勝利条件チェックを連動させる

2. **エラー処理**
   - プレイヤー操作のすべてのエラーを適切に捕捉
   - 明確なエラーメッセージでデバッグを容易にする

3. **ゲームフェーズとの連携**
   - ゲーム開始前のみプレイヤーの追加/削除を許可
   - ゲーム進行中はプレイヤーの状態変更のみ許可

4. **イベント駆動アーキテクチャ**
   - 状態変更はすべてイベントとして伝播
   - 前後のイベント（before/after）を提供し拡張性を確保

5. **プライバシー考慮**
   - 役職公開設定に基づいた情報開示
   - 重要な操作は検証と確認のメカニズムを導入

## イベントリスト

プレイヤー管理に関連するイベント一覧：

| イベント名 | 発火タイミング | データ内容 |
|------------|----------------|------------|
| `player.add` | プレイヤー追加時 | `{playerId, name}` |
| `player.remove` | プレイヤー削除時 | `{playerId, name}` |
| `player.death.before` | プレイヤー死亡処理前 | `{playerId, cause, turn}` |
| `player.death.after` | プレイヤー死亡処理後 | `{playerId, player, cause, turn, role}` |
| `player.statusEffect` | 状態効果設定時 | `{playerId, effectType, value, turn}` |

## 使用例

```
// プレイヤーの追加
const player1Id = game.addPlayer('アリス');
const player2Id = game.addPlayer('ボブ');

// プレイヤー情報の取得
const alice = game.getPlayer(player1Id);
console.log(alice.name); // "アリス"

// 状態効果の設定
game.setPlayerStatusEffect(player1Id, 'guarded', true);

// 状態確認
if (game.isPlayerAlive(player1Id)) {
  console.log('アリスは生存しています');
}

// 死亡処理
game.killPlayer(player2Id, 'execution');
console.log(game.getAlivePlayerCount()); // 1
```
