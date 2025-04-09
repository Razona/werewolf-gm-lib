# GameManager - GameManagerRole.js 設計書

## 概要

`GameManagerRole.js` はGameManagerの役職管理機能を提供するモジュールです。役職の設定、配布、割り当て、情報取得など、役職に関連する操作を担当します。

## 役割

- 使用する役職リストの設定
- プレイヤーへの役職割り当て
- 役職情報の取得と管理
- 役職関連のイベント処理
- 役職の依存関係と検証の処理

## 依存モジュール

このファイルはGameManagerのMix-inとして実装され、GameManagerインスタンスのコンテキストで実行されるため、特にRoleManagerとのインタラクションが中心となります。

## Mix-in関数の定義

GameManagerのプロトタイプに以下のメソッドを追加します：

### setRoles(roleList)
**説明**: 使用する役職リストを設定します。  
**アクセス**: public  
**パラメータ**:
- roleList: 役職名の配列（'villager', 'werewolf'など）  
**戻り値**: 設定成功時にtrue  
**処理内容**:
- ゲーム開始前のみ設定可能かチェック
- 役職リストの検証と設定
- 役職リスト設定イベントの発火
- エラー処理

### distributeRoles(options)
**説明**: 役職をプレイヤーに配布します。  
**アクセス**: public  
**パラメータ**:
- options: 配布オプション
  - shuffle: 役職をシャッフルするかどうか
  - customDistribution: カスタム配布関数  
**戻り値**: プレイヤーIDと割り当てられた役職のマッピング  
**処理内容**:
- ゲーム開始前のみ配布可能かチェック
- 配布前イベントの発火
- 役職配布の実行
- 配布後イベントの発火
- エラー処理

### assignRole(playerId, roleName)
**説明**: 特定の役職を特定のプレイヤーに割り当てます。  
**アクセス**: public  
**パラメータ**:
- playerId: プレイヤーID
- roleName: 役職名  
**戻り値**: 割り当て成功時にtrue  
**処理内容**:
- ゲーム開始前のみ割り当て可能かチェック
- 役職割り当て前イベントの発火
- 役職の割り当て
- 役職割り当て後イベントの発火
- エラー処理

### getRoleInfo(playerId)
**説明**: プレイヤーの役職情報を取得します。  
**アクセス**: public  
**パラメータ**:
- playerId: プレイヤーID  
**戻り値**: 役職情報オブジェクト  
**処理内容**:
- RoleManagerから役職情報取得
- エラー処理

### getRoleName(playerId)
**説明**: プレイヤーの役職名を取得します。  
**アクセス**: public  
**パラメータ**:
- playerId: プレイヤーID  
**戻り値**: 役職名  
**処理内容**:
- 役職情報から役職名を抽出
- エラー処理

### getPlayerTeam(playerId)
**説明**: プレイヤーの所属陣営を取得します。  
**アクセス**: public  
**パラメータ**:
- playerId: プレイヤーID  
**戻り値**: 陣営名（'village', 'werewolf', 'fox'など）  
**処理内容**:
- 役職情報から陣営を抽出
- エラー処理

### getPlayersByRole(roleName)
**説明**: 特定の役職を持つプレイヤーを取得します。  
**アクセス**: public  
**パラメータ**:
- roleName: 役職名  
**戻り値**: 該当するプレイヤーIDの配列  
**処理内容**:
- RoleManagerから該当プレイヤー取得

### getPlayersByTeam(team)
**説明**: 特定の陣営に属するプレイヤーを取得します。  
**アクセス**: public  
**パラメータ**:
- team: 陣営名  
**戻り値**: 該当するプレイヤーIDの配列  
**処理内容**:
- RoleManagerから該当プレイヤー取得

### areAllRolesAssigned()
**説明**: すべてのプレイヤーに役職が割り当てられているかを確認します。  
**アクセス**: public  
**戻り値**: すべてのプレイヤーに役職が割り当てられていればtrue  
**処理内容**:
- 全プレイヤーの役職割り当て状況確認

### getFortuneResult(targetId)
**説明**: 占い結果を取得します。  
**アクセス**: public  
**パラメータ**:
- targetId: 占い対象のプレイヤーID  
**戻り値**: 占い結果（'village', 'werewolf'など）  
**処理内容**:
- RoleManagerから占い結果取得
- エラー処理

### getMediumResult(targetId)
**説明**: 霊媒結果を取得します。  
**アクセス**: public  
**パラメータ**:
- targetId: 霊媒対象のプレイヤーID  
**戻り値**: 霊媒結果（'village', 'werewolf'など）  
**処理内容**:
- プレイヤーが死亡しているか確認
- RoleManagerから霊媒結果取得
- エラー処理

### registerRole(roleName, roleClass)
**説明**: カスタム役職を登録します。  
**アクセス**: public  
**パラメータ**:
- roleName: 役職名
- roleClass: 役職クラス  
**戻り値**: 登録成功時にtrue  
**処理内容**:
- RoleManagerに役職登録を委譲
- エラー処理

## 設計上の注意点

1. **役職配布のタイミング**
   - 役職の設定と配布はゲーム開始前のみ許可
   - 配布後の変更は原則として禁止

2. **依存関係管理**
   - 役職間の依存関係を適切に管理（例: 背徳者には妖狐が必要）
   - 役職欠けルールの適用

3. **エラー処理**
   - 役職設定・配布時のエラーを適切に捕捉
   - 明確なエラーメッセージでデバッグを容易に

4. **拡張性**
   - カスタム役職の登録メカニズムの提供
   - ルールに基づいた役職効果の柔軟な設定

5. **イベント駆動アーキテクチャ**
   - 役職関連の変更はすべてイベントとして伝播
   - 前後のイベント（before/after）を提供し拡張性を確保

## イベントリスト

役職管理に関連するイベント一覧：

| イベント名 | 発火タイミング | データ内容 |
|------------|----------------|------------|
| `role.list.set` | 役職リスト設定時 | `{roles}` |
| `role.distribution.before` | 役職配布前 | `{playerCount, options}` |
| `role.distribution.after` | 役職配布後 | `{distribution}` |
| `role.assigned.before` | 役職割り当て前 | `{playerId, roleName}` |
| `role.assigned.after` | 役職割り当て後 | `{playerId, roleName, player}` |
| `role.ability.used` | 役職能力使用時 | `{playerId, ability, target, result}` |
| `role.revealed` | 役職公開時 | `{playerId, roleName, cause}` |

## 使用例

```
// 役職リストの設定
game.setRoles(['villager', 'villager', 'werewolf', 'seer', 'medium']);

// 役職の配布
const distribution = game.distributeRoles();
console.log(distribution); // {0: 'villager', 1: 'werewolf', 2: 'seer', ...}

// 特定のプレイヤーに役職を割り当て
game.assignRole(0, 'werewolf');

// 役職情報の取得
const roleInfo = game.getRoleInfo(1);
console.log(roleInfo.name); // 'seer'
console.log(game.getPlayerTeam(1)); // 'village'

// 占い結果の取得
const fortuneResult = game.getFortuneResult(0);
console.log(fortuneResult); // 'werewolf'

// 特定の役職を持つプレイヤーの取得
const werewolves = game.getPlayersByRole('werewolf');
console.log(werewolves); // [0]
```