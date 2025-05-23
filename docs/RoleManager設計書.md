## 11. 実装例とベストプラクティス

### 11.1 役職登録のベストプラクティス

役職の登録は以下のパターンで実装することを推奨します：

- **標準役職の一括登録**: ライブラリの初期化時に標準役職をまとめて登録
- **役職の依存関係の自動解決**: 依存する役職を自動的に登録する仕組み
- **登録の冪等性確保**: 重複登録のチェックと適切なエラー処理
- **メタデータの充実**: 表示名やアイコンなど、UIに必要な情報を含める

### 11.2 役職割り当ての推奨パターン

役職の割り当ては以下のパターンで実装することを推奨します：

- **トランザクショナルな割り当て**: 全ての役職割り当てが成功するか、全て失敗するかの一貫性保証
- **バリデーション優先**: 割り当て前に全ての検証を完了させる設計
- **イベント先行通知**: 割り当て前に通知イベントを発火して拒否権を与える
- **結果一括通知**: 全ての割り当てが完了した後にまとめて結果を通知

### 11.3 役職情報管理のパターン

役職情報の管理は以下のパターンで実装することを推奨します：

- **階層的情報構造**: 基本情報、詳細情報、内部情報などの階層化
- **視点ベースのフィルタリング**: 閲覧者の視点に基づいた情報フィルタリング
- **情報キャッシュ**: 頻繁にアクセスされる情報のキャッシング
- **変更通知の最小化**: 必要な情報変更のみを通知する最適化

### 11.4 イベント処理のベストプラクティス

イベント処理は以下のパターンで実装することを推奨します：

- **名前空間の活用**: `role.*` のようなプレフィックスによる名前空間管理
- **バブリングパターン**: 具体的なイベントから抽象的なイベントへのバブリング
- **優先度制御**: リスナーの実行順序を制御するための優先度設定
- **コンテキスト情報の充実**: イベントデータに十分なコンテキスト情報を含める

### 11.5 パフォーマンス最適化の指針

RoleManagerの実装では以下のパフォーマンス最適化を考慮すべきです：

- **役職インスタンスの遅延生成**: 必要になるまで役職インスタンスを生成しない
- **イベントリスナーの最適化**: 不要なイベント購読を避け、必要なものだけを登録
- **参照マップの活用**: プレイヤーID→役職のマッピングなど、高速アクセスのためのインデックス
- **バッチ処理**: 複数の役職に関する操作をバッチ処理することで、オーバーヘッドを削減

### 11.6 エラー処理とリカバリー

堅牢なエラー処理とリカバリーのために以下の方針を推奨します：

- **段階的な検証**: 早期に基本的な検証を行い、複雑な検証は必要になった時点で実施
- **回復可能なエラー処理**: 可能な場合はデフォルト値や代替手段を提供
- **状態の一貫性保証**: エラー発生時に一貫した状態を維持するためのロールバックメカニズム
- **詳細なエラー情報**: デバッグを容易にするための詳細なエラーコンテキスト

### 11.7 拡張性を考慮した設計パターン

将来の拡張を容易にするために以下の設計パターンを推奨します：

- **ストラテジーパターン**: 役職能力の実装に柔軟性を持たせる
- **オブザーバーパターン**: 役職状態の変化を監視する仕組み
- **デコレーターパターン**: 既存の役職能力を拡張する機構
- **ファクトリーパターン**: 役職インスタンスの生成を抽象化# RoleManager 設計書

## 1. 概要

RoleManagerは人狼ゲームGM支援ライブラリの中核コンポーネントとして、役職の管理と操作を担当します。役職の登録、プレイヤーへの役職割り当て、役職間の相互作用の管理、および役職情報の制御を行います。このモジュールは、イベント駆動型アーキテクチャの原則に従い、他のモジュールとの連携を容易にします。

RoleManagerは、「役職クラス階層設計」に基づく役職オブジェクトのライフサイクル全体を管理し、ゲームの進行状況に応じた役職間の相互作用を調整します。

## 2. 責務

RoleManagerの主な責務は以下の通りです：

- 役職クラスの登録と管理
- 役職のプレイヤーへの割り当て
- 役職配布の管理（ランダム配布含む）
- 役職間の依存関係とバランスの検証
- 役職間の相互参照設定
- 役職情報の取得と視点管理（情報可視性制御）
- 役職固有のイベント処理の調整
- 役職ライフサイクルの管理
- 陣営管理と勝利条件判定のサポート

## 3. クラス設計

```
class RoleManager {
  // プロパティ
  eventSystem       // イベント管理システム
  errorHandler      // エラー処理システム
  random            // 乱数生成関数
  roleRegistry      // 登録された役職クラスのマップ
  roleInstances     // プレイヤーIDと役職インスタンスのマップ
  teamRegistry      // 登録された陣営情報のマップ
  roleDistributed   // 役職が配布済みかのフラグ
  game              // ゲームインスタンスへの参照（オプション）
  visibilityRules   // 役職情報の可視性ルール
  
  // メソッド
  // 初期化
  constructor(eventSystem, errorHandler, random = null)

  // 役職管理
  registerRole(roleName, roleClass)
  unregisterRole(roleName)
  hasRole(roleName)
  getRoleInstance(roleName)
  getRoleClass(roleName)
  
  // プレイヤーと役職の関連付け
  getPlayerRole(playerId)
  assignRole(playerId, roleName)
  distributeRoles(playerIds, roleList, options = {})
  
  // 検証
  validateRoleDependencies(roleList)
  validateRoleBalance(roleList)
  validateRoleCompatibility(roleList)
  
  // 役職ライフサイクル管理
  triggerRoleLifecycleMethod(methodName, ...args)
  initializeAllRoles()
  notifyGameStart()
  notifyPhaseChange(phase, data)
  notifyTurnEnd(turnData)
  
  // 役職参照
  setupRoleReferences(playerIds)
  getPlayersByRole(roleName)
  getPlayersInTeam(teamName)
  
  // 陣営管理
  registerTeam(teamId, teamData)
  getTeam(teamId)
  getTeamInfo(teamId)
  getTeamsWinStatus()
  
  // 役職情報と視点管理
  getRoleInfo(playerId, viewerId = null)
  getAllRolesInfo(viewerId = null)
  getVisibleRoles(viewerId)
  setVisibilityRules(rules)
  updateRoleState(playerId, stateChanges)
  
  // イベント処理
  initializeEventListeners()
  handlePlayerDeath(data)
  handlePhaseStart(phase, data)
  handleTargetedAction(data)
  handleGameStart(data)
  
  // 内部ユーティリティ
  _createRoleInstance(roleName)
  _validateRoleAssignment(playerId, roleName)
  _applyRoleEffects(role, playerId)
}
```

## 4. 主要インターフェース

### 4.1 コンストラクタ

```javascript
constructor(eventSystem, errorHandler, random = null)
```

**パラメータ**:
- `eventSystem`: イベント管理システム
- `errorHandler`: エラー処理システム
- `random`: 乱数生成関数（省略時はMath.randomを使用）

**説明**:
RoleManagerを初期化し、必要な依存コンポーネントを設定します。

### 4.2 役職管理

#### 役職の登録

```javascript
registerRole(roleName, roleClass)
```

**パラメータ**:
- `roleName`: 役職の一意識別子
- `roleClass`: 役職クラス（Role基底クラスを継承したもの）

**戻り値**:
- 成功時: true
- 失敗時: エラーオブジェクト

**説明**:
新しい役職クラスをシステムに登録します。登録された役職は、後で `createRoleInstance` メソッドによってインスタンス化できます。

#### 役職の取得

```javascript
getRoleClass(roleName)
```

**パラメータ**:
- `roleName`: 役職名

**戻り値**:
- 役職クラス、未登録の場合はnull

**説明**:
登録された役職クラスを取得します。

### 4.3 プレイヤーと役職の関連付け

#### プレイヤーの役職取得

```javascript
getPlayerRole(playerId)
```

**パラメータ**:
- `playerId`: プレイヤーID

**戻り値**:
- プレイヤーの役職インスタンス、未割り当ての場合はnull

**説明**:
指定されたプレイヤーIDに割り当てられた役職インスタンスを取得します。

#### 役職の割り当て

```javascript
assignRole(playerId, roleName)
```

**パラメータ**:
- `playerId`: プレイヤーID
- `roleName`: 割り当てる役職名

**戻り値**:
- 成功時: `{ success: true, role: roleInstance }`
- 失敗時: `{ success: false, error: errorObject }`

**説明**:
指定されたプレイヤーに役職を割り当てます。役職インスタンスを作成し、プレイヤーに関連付けます。

#### 役職の一括配布

```javascript
distributeRoles(playerIds, roleList, options = {})
```

**パラメータ**:
- `playerIds`: プレイヤーIDの配列
- `roleList`: 配布する役職のリスト
- `options`: 配布オプション
  - `shuffle`: シャッフルするかどうか（デフォルト: true）
  - `seed`: 乱数シード（再現性確保のため）

**戻り値**:
- 割り当て結果の配列 `[{ playerId, role, success }, ...]`

**説明**:
複数のプレイヤーに役職をまとめて配布します。オプションでシャッフル可否や乱数シードを指定できます。

### 4.4 検証

#### 役職の依存関係検証

```javascript
validateRoleDependencies(roleList)
```

**パラメータ**:
- `roleList`: 検証する役職のリスト

**戻り値**:
- 成功時: true
- 失敗時: エラーオブジェクト

**説明**:
役職の依存関係をチェックします。例えば「背徳者」は「妖狐」が必要といった依存関係を検証します。

#### 役職バランスの検証

```javascript
validateRoleBalance(roleList)
```

**パラメータ**:
- `roleList`: 検証する役職のリスト

**戻り値**:
- 成功時: true
- 失敗時: エラーオブジェクト

**説明**:
役職構成のバランスをチェックします。例えば「人狼が最低1人必要」「妖狐は最大1人まで」といった制約を検証します。

#### 役職互換性の検証

```javascript
validateRoleCompatibility(roleList)
```

**パラメータ**:
- `roleList`: 検証する役職のリスト

**戻り値**:
- 成功時: true
- 失敗時: エラーオブジェクト

**説明**:
特定の役職組み合わせの互換性をチェックします。例えば「カスタム役職A」と「カスタム役職B」が競合する場合などを検証します。これは特にプラグインで追加された役職の検証に重要です。

### 4.5 役職ライフサイクル管理

#### 役職ライフサイクルメソッドの一括実行

```javascript
triggerRoleLifecycleMethod(methodName, ...args)
```

**パラメータ**:
- `methodName`: 実行するライフサイクルメソッド名（例: `onGameStart`, `onPhaseStart`, `onTurnEnd` など）
- `...args`: メソッドに渡す引数

**戻り値**:
- 実行結果の配列（各役職インスタンスの戻り値）

**説明**:
すべての役職インスタンスに対して指定されたライフサイクルメソッドを一括で呼び出します。これにより役職の状態更新を一貫して処理できます。

#### 役職の初期化

```javascript
initializeAllRoles()
```

**説明**:
すべての役職インスタンスの初期化処理を行います。役職配布後に一度だけ呼び出されます。

#### ゲーム開始通知

```javascript
notifyGameStart()
```

**説明**:
すべての役職にゲーム開始を通知します。各役職の `onGameStart` メソッドが呼び出され、初期設定が実行されます。

#### フェーズ変更通知

```javascript
notifyPhaseChange(phase, data)
```

**パラメータ**:
- `phase`: フェーズ名（例: `night`, `day`, `vote` など）
- `data`: フェーズに関連するデータ

**説明**:
すべての役職にフェーズの変更を通知します。各役職の `onPhaseStart` メソッドが呼び出され、フェーズに応じた処理が実行されます。

#### ターン終了通知

```javascript
notifyTurnEnd(turnData)
```

**パラメータ**:
- `turnData`: ターン情報

**説明**:
すべての役職にターンの終了を通知します。各役職の `onTurnEnd` メソッドが呼び出され、ターン終了時の処理が実行されます。

### 4.6 役職参照

#### 役職間の相互参照設定

```javascript
setupRoleReferences(playerIds)
```

**パラメータ**:
- `playerIds`: プレイヤーIDのリスト

**説明**:
役職間の相互参照を設定します。例えば「人狼同士が互いを認識」「共有者同士が互いを認識」「背徳者が妖狐を認識」などの参照関係を設定します。

#### 特定の役職を持つプレイヤーの取得

```javascript
getPlayersByRole(roleName)
```

**パラメータ**:
- `roleName`: 役職名

**戻り値**:
- その役職を持つプレイヤーIDの配列

**説明**:
指定された役職を持つすべてのプレイヤーのIDリストを取得します。

### 4.7 陣営管理

#### 陣営の登録

```javascript
registerTeam(teamId, teamData)
```

**パラメータ**:
- `teamId`: 陣営の一意識別子
- `teamData`: 陣営データ（表示名、説明、勝利条件など）

**戻り値**:
- 成功時: true
- 失敗時: エラーオブジェクト

**説明**:
ゲームで使用する陣営を登録します。標準陣営（村人陣営、人狼陣営、第三陣営）に加えて、カスタム陣営も登録可能です。

#### 陣営情報の取得

```javascript
getTeamInfo(teamId)
```

**パラメータ**:
- `teamId`: 陣営ID

**戻り値**:
- 陣営の詳細情報（所属プレイヤー、勝利条件情報を含む）

**説明**:
指定された陣営の情報を取得します。勝利条件の判定に必要な情報も含まれるため、VictoryManagerと連携して使用されます。

#### 陣営の勝利状態確認

```javascript
getTeamsWinStatus()
```

**戻り値**:
- 各陣営の勝利条件状態を含むオブジェクト

**説明**:
各陣営の現在の勝利条件の達成状況を確認するための情報を提供します。VictoryManagerがこの情報を使用して勝利判定を行います。

### 4.8 役職情報と視点管理

#### 役職情報の取得（視点付き）

```javascript
getRoleInfo(playerId, viewerId = null)
```

**パラメータ**:
- `playerId`: 情報を取得するプレイヤーID
- `viewerId`: 情報を見るプレイヤーID（省略時は制限なし＝GM視点）

**戻り値**:
- 役職情報オブジェクト（視点に基づきフィルタリング済み）

**説明**:
指定したプレイヤーの役職情報を、指定した視点からフィルタリングして返します。特殊なケースとして以下があります：
1. 自分自身の役職情報は常に完全に見える
2. 人狼は他の人狼を認識できる
3. 共有者は他の共有者を認識できる
4. 背徳者は妖狐を認識できる
5. 死亡したプレイヤーの役職は設定により公開される場合がある

#### 可視性ルールの設定

```javascript
setVisibilityRules(rules)
```

**パラメータ**:
- `rules`: 可視性ルールのオブジェクト

**説明**:
役職情報の可視性に関するルールを設定します。例えば「死亡時に役職を公開するか」「GM以外に全役職情報を見せるプレイヤーがいるか」などの設定が可能です。

#### 役職状態の更新

```javascript
updateRoleState(playerId, stateChanges)
```

**パラメータ**:
- `playerId`: 状態を更新するプレイヤーID
- `stateChanges`: 更新する状態データ

**戻り値**:
- 成功時: true
- 失敗時: false

**説明**:
プレイヤーの状態変化（死亡、状態効果付与など）に応じて役職インスタンスの状態を更新します。この処理は通常、イベントを通じて自動的に呼び出されます。

d` | プレイヤーが能力のターゲットになったときの処理 |
| `game.start` | ゲーム開始時の役職初期化処理 |

## 6. エラー処理

RoleManagerは以下のエラーケースを処理します：

| エラーコード                   | 説明                                                           | レベル  |
| ------------------------------ | -------------------------------------------------------------- | ------- |
| `ROLE_ALREADY_REGISTERED`      | 既に登録されている役職を再登録しようとした                     | error   |
| `INVALID_ROLE_CLASS`           | Role基底クラスを継承していないクラスを登録しようとした         | error   |
| `ROLE_NOT_FOUND`               | 存在しない役職を参照しようとした                               | error   |
| `PLAYER_ROLE_COUNT_MISMATCH`   | プレイヤー数と役職数が一致しない                               | error   |
| `ROLE_DEPENDENCY_NOT_MET`      | 役職の依存関係が満たされていない                               | error   |
| `INVALID_ROLE_BALANCE`         | 役職バランスが不正                                             | error   |
| `PLAYER_ALREADY_HAS_ROLE`      | 既に役職が割り当てられているプレイヤーに再割り当てしようとした | error   |
| `ROLE_LIFECYCLE_ERROR`         | 役職のライフサイクルメソッド実行中にエラーが発生した           | error   |
| `ROLE_COMPATIBILITY_ERROR`     | 互換性のない役職の組み合わせが検出された                       | error   |
| `TEAM_ALREADY_REGISTERED`      | 既に登録されている陣営を再登録しようとした                     | error   |
| `INVALID_ROLE_STATE_UPDATE`    | 役職の状態更新が無効な形式で行われた                           | error   |
| `INVALID_VISIBILITY_RULE`      | 無効な可視性ルールが指定された                                 | warning |
| `ROLE_REFERENCE_ERROR`         | 役職間の相互参照設定に失敗した                                 | error   |
| `ROLE_PLUGIN_VALIDATION_ERROR` | 役職プラグインのバリデーションに失敗した                       | error   |

### 6.1 エラー処理の戦略

RoleManagerは以下の戦略でエラー処理を行います：

1. **早期検証**: 操作実行前に可能な限りバリデーションを行い、不正な状態になることを防ぎます
2. **階層的なエラー報告**: エラーの重大度に応じて適切なレベル（fatal/error/warning/info）を設定します
3. **詳細なコンテキスト情報**: エラーオブジェクトに詳細なコンテキスト情報を含めて、デバッグを容易にします
4. **回復可能性**: 可能な場合はデフォルト値や回避策を提供し、操作の完全な失敗を防ぎます
5. **エラーイベントの発火**: エラー発生時には適切なイベントを発火し、UI層などが適切に対応できるようにします

### 6.2 エラー通知の例

```javascript
// エラー通知の例
{
  code: "ROLE_DEPENDENCY_NOT_MET",
  message: "役職「背徳者」には役職「妖狐」が必要です",
  level: "error",
  context: {
    role: "heretic",
    dependency: "fox",
    roleList: ["villager", "werewolf", "heretic", "seer"],
    missingRoles: ["fox"]
  },
  suggestions: [
    "役職リストに「妖狐」を追加してください",
    "背徳者を別の役職に変更してください"
  ]
}
```

## 7. 他モジュールとの連携

### 7.1 依存するモジュール

- **EventSystem**: イベントの発火と購読
- **ErrorHandler**: エラー処理と検証
- **Common/Utils**: 共通ユーティリティ関数（特にバリデーションと乱数生成）

### 7.2 連携するモジュール

- **PlayerManager**: プレイヤー情報の取得と検証
  - プレイヤーの存在確認
  - プレイヤーの状態変化を役職に通知
  - 役職情報をプレイヤーに関連付け

- **ActionManager**: 役職アクションの実行と結果処理
  - 役職能力の実行処理
  - アクション結果の役職への通知
  - 役職の能力使用可否判定

- **PhaseManager**: フェーズに応じた役職能力の制御
  - フェーズ変更時の役職への通知
  - 役職能力の使用タイミング制御
  - フェーズごとの特殊効果管理

- **VictoryManager**: 陣営と勝利条件の連携
  - 陣営情報の提供
  - 陣営別の勝利条件判定に必要なデータ提供
  - 役職に基づく勝利チームの特定

- **VisibilityManager** (オプション): 情報可視性との連携
  - 役職情報の視点に基づくフィルタリング
  - 特殊な役職間の情報共有制御
  - 役職公開ルールの適用

### 7.3 連携の実装パターン

RoleManagerは以下のパターンで他モジュールと連携します：

1. **イベントベースの連携**
   - 状態変化をイベントとして発火し、他モジュールが購読
   - 他モジュールが発火したイベントを購読して役職に伝達

2. **サービス提供**
   - 役職情報の取得メソッドを他モジュールに提供
   - 役職の状態確認や能力チェックのAPIを提供

3. **データ変換**
   - 役職データを他モジュールが使いやすい形式に変換
   - 他モジュールから受け取ったデータを役職が理解できる形式に変換

4. **委譲パターン**
   - 特定の処理を適切な役職インスタンスに委譲
   - 役職固有のロジックを役職クラスに委ね、結果を他モジュールに提供

## 8. 実装の優先順位と段階的アプローチ

### 8.1 実装の優先順位

1. **基本的な役職登録と管理機能**
   - 役職クラスの登録/取得の基本機能
   - 役職インスタンスの生成と保持

2. **役職のプレイヤーへの割り当て機能**
   - 個別の役職割り当て
   - ランダム配布機能
   - 役職/プレイヤー間のマッピング

3. **役職の依存関係とバランスの検証**
   - 依存関係の検証ロジック
   - 役職バランスの検証ロジック
   - 互換性チェック

4. **役職間の相互参照設定**
   - 狼/共有者など同種役職の相互参照
   - 妖狐/背徳者など異種役職の相互参照
   - 参照関係の初期化

5. **役職ライフサイクル管理**
   - 一括ライフサイクルメソッド呼び出し
   - フェーズ変更通知
   - 状態変更処理

6. **役職情報の取得と視点管理**
   - 視点ベースの情報フィルタリング
   - 情報可視性ルールの適用
   - 特殊な相互参照の情報処理

7. **陣営管理と勝利条件サポート**
   - 陣営の登録と管理
   - 陣営情報の提供
   - VictoryManagerとの連携

8. **イベント処理の連携**
   - イベントリスナーの設定
   - イベント発火処理
   - 役職固有イベントの処理

### 8.2 段階的実装アプローチ

各優先順位項目を以下の段階で実装することを推奨します：

#### 8.2.1 MVPフェーズ（最小実装）

- 基本的な役職の登録と取得
- シンプルな役職割り当て
- 基本的な役職/プレイヤーマッピング
- 最小限のイベント発火/購読

#### 8.2.2 基本機能フェーズ

- 役職の依存関係検証
- ランダム配布と相互参照
- 基本的な視点管理
- 主要イベントの発火/購読

#### 8.2.3 拡張機能フェーズ

- 詳細な役職情報とフィルタリング
- 完全なライフサイクル管理
- 陣営管理と勝利条件サポート
- すべてのイベント連携

#### 8.2.4 高度機能フェーズ

- カスタム役職プラグインサポート
- 拡張可能な可視性ルール
- 高度な相互作用メカニズム
- パフォーマンス最適化

### 8.3 テスト戦略

各実装フェーズでは以下のテストを行うことを推奨します：

1. **単体テスト**
   - 各メソッドの基本機能テスト
   - エラーケースのテスト
   - 境界条件のテスト

2. **統合テスト**
   - 他モジュールとの連携テスト
   - イベント連携のテスト
   - 一連の操作シーケンスのテスト

3. **シナリオテスト**
   - 実際のゲーム進行を模したテスト
   - 特殊な役職組み合わせのテスト
   - エッジケースのテスト

## 9. 拡張ポイント

### 9.1 カスタム役職プラグイン

RoleManagerは役職プラグインシステムを通じて拡張できます：

- **プラグイン登録インターフェース**: 外部から新しい役職を登録するための標準化されたAPI
- **メタデータサポート**: 役職の表示名、説明、アイコンなどのメタデータ管理
- **役職の検証機構**: 新規役職が基本要件を満たしているかの検証
- **能力のカスタマイズ**: 標準的な能力パターン（占い、護衛など）の再利用と拡張
- **パラメータ設定**: 役職の振る舞いをカスタマイズするためのパラメータ設定

### 9.2 陣営拡張

基本陣営（村人、人狼、第三陣営）以外のカスタム陣営を追加できます：

- **陣営定義API**: 新しい陣営を定義・登録するインターフェース
- **勝利条件連携**: カスタム陣営の勝利条件を定義できる仕組み
- **陣営間の関係定義**: 陣営間の友好/敵対関係の設定機能
- **陣営固有の特殊効果**: 陣営に属する役職全体に適用される効果の定義

### 9.3 役職特性のカスタマイズ

既存役職の振る舞いを変更するための拡張ポイント：

- **役職バリエーション**: 同じ役職の異なるバリエーションの定義
- **能力パラメータ調整**: 能力の使用回数、効果、タイミングなどの調整
- **条件付き能力**: 特定条件下でのみ発動する特殊能力の定義
- **役職コンビネーション**: 複数の役職能力を組み合わせた新しい役職の作成

### 9.4 情報可視性の拡張

役職情報の可視性制御を拡張するポイント：

- **カスタム視点ルール**: 特定の役職間での情報共有ルールのカスタマイズ
- **時間制約つき情報**: 特定のタイミングでのみ有効な情報開示
- **条件付き公開**: 特定の条件が満たされた時のみ情報を公開
- **役職公開ポリシー**: 死亡時や特定イベント時の役職公開ルールのカスタマイズ

### 9.5 イベント拡張

役職関連のイベントシステムを拡張するポイント：

- **カスタムイベント**: 新しい役職固有のイベントの定義
- **イベント修飾子**: 既存イベントの振る舞いを変更する仕組み
- **イベントフィルター**: 特定条件下でイベントを無効化/変更する機能
- **イベント連鎖**: 一つのイベントが別のイベントを引き起こす連鎖の定義

## 10. 関連する設計書とその影響

### 10.1 直接関連する設計書

- **role-class-design.md**: 役職クラスの階層構造と基底クラスの設計
  - RoleManagerが管理する役職クラスの構造を定義
  - 役職のライフサイクルフック（onGameStart, onPhaseStart など）を規定
  - 役職間の相互作用パターンを定義

- **werewolf-architecture.md**: 全体アーキテクチャにおけるRoleModuleの位置づけ
  - イベント駆動型アーキテクチャの原則を定義
  - RoleModuleの責務と他モジュールとの関係を規定
  - 拡張性と疎結合設計の基本原則を提供

- **role-plugin-specification.md**: 役職プラグインシステムの詳細仕様
  - プラグインの構造と登録メカニズムを定義
  - プラグイン間の依存関係と競合解決のルールを規定
  - カスタム役職の拡張ポイントとインターフェースを定義

### 10.2 間接的に関連する設計書

- **werewolf-library-enhanced-spec.md**: ライブラリ全体の拡張仕様
  - RoleManagerに求められる機能と要件の概要を提供
  - 全体的な拡張性の要件と方針を規定

- **人狼ゲーム_ルール設計.md**: ゲームルールとレギュレーションの定義
  - 役職のバランスと組み合わせルールの基準を提供
  - 標準的な役職の振る舞いと効果を定義

- **phase-management-design.md**: フェーズ管理システムの設計
  - フェーズの変化に対する役職の反応方法を規定
  - フェーズと役職能力の関係を定義

- **victory-condition-design.md**: 勝利条件判定システムの設計
  - 陣営と勝利条件の関係を定義
  - 役職が勝利条件に与える影響を規定

- **information-visibility-design-updated.md**: 情報可視性管理システムの設計
  - 役職情報の視点管理の原則と方法を定義
  - 特殊な役職間の情報共有ルールを規定

### 10.3 設計書間の整合性

RoleManagerの設計は上記の設計書と整合性を持ち、特に以下の点に注意して実装する必要があります：

1. **役職クラス階層との整合性**: role-class-design.mdで定義された役職階層構造と継承関係を尊重する
2. **イベント駆動アーキテクチャとの整合性**: werewolf-architecture.mdで規定されたイベント駆動原則に従う
3. **プラグインシステムとの整合性**: role-plugin-specification.mdに準拠したプラグイン拡張機構を提供する
4. **フェーズシステムとの整合性**: phase-management-design.mdと連携したフェーズ処理を実装する
5. **勝利条件システムとの整合性**: victory-condition-design.mdに基づいた陣営と勝利条件の連携を行う
6. **情報可視性システムとの整合性**: information-visibility-design-updated.mdに準拠した視点管理を実装する

### 10.4 実装時の参照優先順位

実装を進める際には、以下の優先順位で設計書を参照することを推奨します：

1. role-class-design.md: 役職クラスの基本構造と振る舞いを理解する
2. werewolf-architecture.md: 全体アーキテクチャにおける位置づけを確認する
3. role-plugin-specification.md: 拡張メカニズムの要件を把握する
4. 他の関連設計書: 特定機能の実装時に必要に応じて参照する