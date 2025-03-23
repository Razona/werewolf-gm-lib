# 人狼ゲームGM支援ライブラリ 役職クラス設計書

## 1. 概要

本設計書では、人狼ゲームGM支援ライブラリの中核要素となる役職クラスのクラス階層、インターフェース、相互作用について定義します。イベント駆動アーキテクチャを前提とした役職能力の実装方法とライフサイクルを詳細に設計します。

## 2. 設計目標

- **一貫性**: 全ての役職が統一された基底クラスとインターフェースを持つ
- **拡張性**: 新しい役職の追加が容易な構造
- **柔軟性**: 様々なレギュレーションに対応できる設計
- **相互作用**: 役職間の複雑な相互作用を明確に定義
- **再利用性**: 役職能力のコンポーネント化による再利用性の向上

## 3. 役職クラス階層

役職はすべて共通の基底クラス（`Role`）を継承し、各役職固有の振る舞いを実装します。

```
             +-------------+
             |    Role     |
             +------+------+
                    |
     +-----------------------------------+
     |              |                    |
+----+----+  +------+------+    +-------+-------+
| Village |  | Werewolf    |    | ThirdParty    |
+----+----+  +------+------+    +-------+-------+
     |              |                    |
     |       +------+------+        +----+----+
     |       |  Madman     |        |   Fox    |
     |       +-------------+        +---------+
     |                              |
     |                         +----+------+
     |                         |  Heretic  |
     |                         +-----------+
     |
+----+------+  +---------+  +----------+  +-------+  +-------+
| Villager  |  |  Seer   |  |  Medium  |  | Knight |  | Mason |
+-----------+  +---------+  +----------+  +-------+  +-------+
```

### 3.1 基底クラス（Role）

全ての役職に共通するプロパティとメソッドを定義します。

**プロパティ**:
- `name`: 役職名（システム内部での識別子）
- `displayName`: 表示名（ユーザー向け表示）
- `team`: 陣営（'village', 'werewolf', 'fox'）
- `playerId`: この役職が割り当てられたプレイヤーID
- `game`: ゲームインスタンスへの参照
- `isAlive`: 生存状態
- `metadata`: 役職に関するメタデータ（説明文など）

**メソッド**:
- `constructor(game)`: コンストラクタ
- `assignToPlayer(playerId)`: プレイヤーへの役職割り当て
- `getFortuneResult()`: 占い結果を返す（'white'/'black'）
- `getMediumResult()`: 霊媒結果を返す（'white'/'black'）
- `canUseAbility(night)`: 能力が使用可能か判定
- `getAbilityTargets()`: 能力の対象となり得るプレイヤーリスト
- `getRoleInfo(viewerId)`: 役職情報（視点付き）

**ライフサイクルフック**:
- `onNightAction(target, night)`: 夜の行動実行時
- `onTargeted(action, source)`: 能力の対象になった時
- `onDeath(cause)`: 死亡時
- `onGameStart()`: ゲーム開始時
- `onPhaseStart(phase)`: フェーズ開始時
- `onPhaseEnd(phase)`: フェーズ終了時
- `onTurnEnd()`: ターン終了時

### 3.2 陣営中間クラス

基底クラスと具体的な役職クラスの間に陣営ごとの中間クラスを設け、陣営共通の振る舞いを定義します。

#### 3.2.1 Village（村人陣営）

**プロパティ**:
- `team = 'village'`: 陣営を村人陣営に設定

**メソッド**:
- `getWinCondition()`: 村人陣営の勝利条件（全人狼の死亡）

#### 3.2.2 Werewolf（人狼陣営）

**プロパティ**:
- `team = 'werewolf'`: 陣営を人狼陣営に設定

**メソッド**:
- `getWinCondition()`: 人狼陣営の勝利条件（村人陣営と第三陣営の人数が人狼以下）

#### 3.2.3 ThirdParty（第三陣営）

**プロパティ**:
- `team = 'fox'`: 陣営を第三陣営に設定

**メソッド**:
- `getWinCondition()`: 第三陣営の勝利条件（ゲーム終了時に特定条件を満たす）

## 4. 具体的な役職クラス設計

### 4.1 村人（Villager）

**拡張元**: `Village`

**プロパティ**:
- `name = 'villager'`
- `displayName = '村人'`

**メソッド**:
- `getFortuneResult()`: 常に 'white' を返す
- `getMediumResult()`: 常に 'white' を返す
- `canUseAbility()`: 常に false を返す（能力なし）

### 4.2 占い師（Seer）

**拡張元**: `Village`

**プロパティ**:
- `name = 'seer'`
- `displayName = '占い師'`
- `fortuneResults`: 過去の占い結果を保存する配列

**メソッド**:
- `getFortuneResult()`: 常に 'white' を返す
- `getMediumResult()`: 常に 'white' を返す
- `canUseAbility(night)`: 常に true を返す（毎晩使用可能）
- `getAbilityTargets()`: 生存プレイヤーのリストを返す
- `fortuneTell(targetId)`: 占い実行メソッド
  - アクション登録イベントを発火
  - 占い対象が妖狐なら呪殺フラグを設定
  - 対象の役職に基づいて結果を返す

**ライフサイクルフック**:
- `onNightAction(target, night)`: 
  - 対象プレイヤーの役職を取得
  - 対象の getFortuneResult() を呼び出し結果を取得
  - 結果をfortuneResultsに保存
  - 対象が狐の場合、呪殺イベントを発火
  - 結果通知イベントを発火

### 4.3 霊媒師（Medium）

**拡張元**: `Village`

**プロパティ**:
- `name = 'medium'`
- `displayName = '霊媒師'`
- `mediumResults`: 過去の霊媒結果を保存する配列

**メソッド**:
- `getFortuneResult()`: 常に 'white' を返す
- `getMediumResult()`: 常に 'white' を返す
- `canUseAbility(night)`: 前日に処刑があった場合のみ true
- `getAbilityTargets()`: 前日に処刑されたプレイヤーのリスト
- `performMedium()`: 霊媒実行メソッド

**ライフサイクルフック**:
- `onPhaseStart(phase)`: 
  - 夜フェーズ開始時に自動的に霊媒を実行
  - 前日に処刑されたプレイヤーを取得
  - 対象の getMediumResult() の結果を取得
  - 結果をmediumResultsに保存
  - 結果通知イベントを発火

### 4.4 騎士（Knight）

**拡張元**: `Village`

**プロパティ**:
- `name = 'knight'`
- `displayName = '騎士'`
- `lastGuardedId`: 前回護衛したプレイヤーID

**メソッド**:
- `getFortuneResult()`: 常に 'white' を返す
- `getMediumResult()`: 常に 'white' を返す
- `canUseAbility(night)`: 常に true を返す（毎晩使用可能）
- `getAbilityTargets()`: 
  - 連続ガード禁止の場合、前回の対象を除外した生存プレイヤーリスト
  - それ以外は全生存プレイヤー
- `guard(targetId)`: 護衛実行メソッド

**ライフサイクルフック**:
- `onNightAction(target, night)`: 
  - 護衛対象を記録
  - 護衛成功フラグを設定
- `onGameEvent('werewolf.attack')`: 
  - 護衛対象と襲撃対象が一致した場合、襲撃を無効化

### 4.5 人狼（Werewolf）

**拡張元**: `Werewolf`

**プロパティ**:
- `name = 'werewolf'`
- `displayName = '人狼'`

**メソッド**:
- `getFortuneResult()`: 常に 'black' を返す
- `getMediumResult()`: 常に 'black' を返す
- `canUseAbility(night)`: 生存している人狼がいる場合 true
- `getAbilityTargets()`: 人狼以外の生存プレイヤーリスト
- `attack(targetId)`: 襲撃実行メソッド

**ライフサイクルフック**:
- `onNightAction(target, night)`: 
  - 襲撃対象を記録
  - 襲撃イベントを発火
  - 護衛と狐の耐性をチェック
  - 襲撃成功時は対象プレイヤーを死亡フラグを設定
  - 襲撃結果イベントを発火

### 4.6 狂人（Madman）

**拡張元**: `Werewolf`

**プロパティ**:
- `name = 'madman'`
- `displayName = '狂人'`

**メソッド**:
- `getFortuneResult()`: 常に 'white' を返す
- `getMediumResult()`: 常に 'white' を返す
- `canUseAbility()`: 常に false を返す（能力なし）

### 4.7 妖狐（Fox）

**拡張元**: `ThirdParty`

**プロパティ**:
- `name = 'fox'`
- `displayName = '妖狐'`
- `cursed`: 呪殺フラグ

**メソッド**:
- `getFortuneResult()`: 常に 'white' を返す
- `getMediumResult()`: 常に 'white' を返す
- `canUseAbility()`: 常に false を返す（能動的な能力はない）

**ライフサイクルフック**:
- `onTargeted(action, source)`: 
  - action が 'fortune' の場合、呪殺フラグを立てる
  - action が 'attack' の場合、人狼の襲撃を無効化（耐性）
- `onPhaseEnd(phase)`: 
  - 夜フェーズ終了時に呪殺フラグが立っていれば死亡処理
- `onDeath(cause)`: 
  - 死亡時に関連する背徳者にイベントを通知

### 4.8 背徳者（Heretic）

**拡張元**: `ThirdParty`

**プロパティ**:
- `name = 'heretic'`
- `displayName = '背徳者'`
- `foxPlayerId`: 関連付けられた妖狐のプレイヤーID

**メソッド**:
- `getFortuneResult()`: 常に 'white' を返す
- `getMediumResult()`: 常に 'white' を返す
- `canUseAbility()`: 常に false を返す（能力なし）
- `linkToFox(foxPlayerId)`: 妖狐との関連付け

**ライフサイクルフック**:
- `onGameEvent('player.death')`: 
  - 死亡したプレイヤーが関連する妖狐の場合、自身も死亡処理

### 4.9 共有者（Mason）

**拡張元**: `Village`

**プロパティ**:
- `name = 'mason'`
- `displayName = '共有者'`

**メソッド**:
- `getFortuneResult()`: 常に 'white' を返す
- `getMediumResult()`: 常に 'white' を返す
- `canUseAbility()`: 常に false を返す（能力なし）
- `getPartners()`: 他の共有者のプレイヤーIDリスト

**ライフサイクルフック**:
- `onGameStart()`: 
  - 他の共有者との相互認識を設定
  - 共有者リスト情報イベントを発火

## 5. 役職間の相互作用

役職間の相互作用は主にイベントシステムを通じて実現します。

### 5.1 アクション登録と実行の流れ

1. プレイヤーが役職アクションを選択（UI操作）
2. 役職の対応するメソッドが呼ばれる（例: `seer.fortuneTell(targetId)`）
3. `role.action.register` イベントが発火され、アクションが登録される
4. 夜フェーズ終了時に `role.action.resolve` イベントが発火される
5. 登録されたアクションが優先順位に従って順次処理される
6. 各アクションごとに対応する役職の `onNightAction` メソッドが呼ばれる
7. 対象となるプレイヤーの役職の `onTargeted` メソッドが呼ばれる
8. アクション結果が計算され、`role.action.result` イベントが発火される
9. 結果に基づく状態変更（死亡など）が適用される

### 5.2 アクション処理の優先順位

夜アクションは以下の優先順位で処理されます:

1. **占い師の占い** (優先度: 100)
   - 対象が妖狐の場合は呪殺フラグを設定

2. **騎士の護衛** (優先度: 80)
   - 対象プレイヤーに護衛フラグを設定

3. **人狼の襲撃** (優先度: 60)
   - 護衛されていない対象を死亡させる
   - 妖狐は襲撃耐性があるため死亡しない

4. **その他の効果適用** (優先度: 40)
   - 妖狐の呪殺処理
   - 背徳者の連動死処理

### 5.3 イベントを利用した役職間の連携

```
// 占い師が妖狐を占った場合の処理フロー
1. 占い師: fortuneTell(foxId) を実行
2. イベント: role.action.register
   - { type: 'fortune', actor: seerId, target: foxId }
3. 夜フェーズ終了時にイベント: role.action.resolve
4. 占い師: onNightAction(foxId, 1) が呼ばれる
5. 妖狐: onTargeted('fortune', seerId) が呼ばれる
   - 呪殺フラグを設定: this.cursed = true
6. 占い師: fortune.result イベントを発火
   - { actor: seerId, target: foxId, result: 'white' }
7. 夜フェーズの終了処理で呪殺チェック
8. 妖狐: onPhaseEnd('night') で呪殺処理
   - this.cursed が true なら死亡処理
9. イベント: player.death
   - { playerId: foxId, cause: 'curse' }
10. 背徳者: onGameEvent('player.death') でリンクした妖狐の死亡を検知
    - 自身も死亡処理
```

### 5.4 死亡処理の流れ

1. 死亡条件が発生（襲撃、処刑、呪殺など）
2. `player.death` イベントが発火される
   - 原因情報を含む（execution/attack/curse）
3. 死亡プレイヤーの役職の `onDeath` メソッドが呼ばれる
4. 関連する役職のハンドラが処理を行う（背徳者の連動死など）
5. 勝利条件のチェックが行われる

## 6. 役職情報の視点管理

プレイヤーごとに開示される役職情報を管理します。

### 6.1 基本方針

- 各プレイヤーは原則として自分の役職のみ知る
- 特定の役職は他の役職の情報を一部知ることができる
  - 人狼は他の人狼を知る
  - 共有者は他の共有者を知る
  - 背徳者は妖狐を知る

### 6.2 情報開示メソッド

```javascript
// 役職情報取得（視点付き）
getRoleInfo(viewerId) {
  // 自分自身の場合は完全な情報
  if (this.playerId === viewerId) {
    return {
      name: this.name,
      displayName: this.displayName,
      team: this.team
    };
  }
  
  // 他のプレイヤーの場合は制限された情報
  const viewer = this.game.getPlayer(viewerId);
  const viewerRole = viewer ? viewer.role : null;
  
  // 人狼同士は互いを認識
  if (this.name === 'werewolf' && viewerRole === 'werewolf') {
    return {
      name: this.name,
      displayName: this.displayName,
      isWerewolf: true
    };
  }
  
  // 共有者同士は互いを認識
  if (this.name === 'mason' && viewerRole === 'mason') {
    return {
      name: this.name,
      displayName: this.displayName,
      isMason: true
    };
  }
  
  // 背徳者は妖狐を認識
  if (this.name === 'fox' && viewerRole === 'heretic') {
    return {
      name: this.name,
      displayName: this.displayName,
      isFox: true
    };
  }
  
  // 死亡時の役職公開設定があれば
  if (!this.isAlive && this.game.options.regulations.revealRoleOnDeath) {
    return {
      name: this.name,
      displayName: this.displayName,
      revealed: true
    };
  }
  
  // 通常は役職情報を開示しない
  return {
    name: 'unknown',
    displayName: '不明'
  };
}
```

## 7. 役職拡張システム

新しい役職を追加するための拡張機構を設計します。

### 7.1 カスタム役職の登録方法

```javascript
// カスタム役職クラス定義
class CustomRole extends werewolf.Role {
  constructor(game) {
    super(game);
    this.name = "customRole";
    this.displayName = "カスタム役職";
    this.team = "village";
    
    // メタデータ
    this.metadata = {
      description: "カスタム役職の説明",
      abilities: ["夜に特殊能力を使用可能"]
    };
  }
  
  // 占い結果
  getFortuneResult() {
    return 'white';
  }
  
  // 霊媒結果
  getMediumResult() {
    return 'white';
  }
  
  // 夜行動処理
  onNightAction(target, night) {
    // カスタム処理
    return { success: true, result: "customResult" };
  }
  
  // 対象になった時の処理
  onTargeted(action, source) {
    // カスタム処理
  }
  
  // 死亡時の処理
  onDeath(cause) {
    // カスタム処理
  }
}

// ライブラリに役職を登録
werewolf.registerRole("customRole", CustomRole);
```

### 7.2 役職の依存関係

一部の役職は他の役職の存在に依存します（例: 背徳者は妖狐が必要）。これらの依存関係はRoleManagerで管理します。

```javascript
// 役職の依存関係定義
const roleDependencies = {
  'heretic': ['fox'], // 背徳者は妖狐が必要
};

// 役職の依存関係チェック
function validateRoleDependencies(roles) {
  for (const role of roles) {
    const dependencies = roleDependencies[role];
    if (dependencies) {
      for (const dependency of dependencies) {
        if (!roles.includes(dependency)) {
          throw new Error(`役職 ${role} には ${dependency} が必要です`);
        }
      }
    }
  }
  return true;
}
```

### 7.3 役職バランス制限

役職構成のバランスを確保するための制約も設定します。

```javascript
// 役職バランスチェック
function validateRoleBalance(roles) {
  // 人狼は最低1人必要
  const werewolfCount = roles.filter(r => r === 'werewolf').length;
  if (werewolfCount === 0) {
    throw new Error('人狼が必要です');
  }
  
  // 妖狐と背徳者の数の制限
  const foxCount = roles.filter(r => r === 'fox').length;
  const hereticCount = roles.filter(r => r === 'heretic').length;
  
  if (foxCount > 1) {
    throw new Error('妖狐は1人までです');
  }
  
  if (hereticCount > 0 && foxCount === 0) {
    throw new Error('背徳者がいる場合、妖狐が必要です');
  }
  
  // その他のバランス制約...
  
  return true;
}
```

## 8. 役職配布システム

役職の配布は以下の手順で行います。

### 8.1 役職配布アルゴリズム

```javascript
// 役職の配布関数
function distributeRoles(players, roleList, options = {}) {
  // 役職リストのコピー
  const roles = [...roleList];
  
  // 役職とプレイヤーの数が一致するか確認
  if (players.length !== roles.length) {
    throw new Error('プレイヤー数と役職数が一致しません');
  }
  
  // 役職の依存関係チェック
  validateRoleDependencies(roles);
  
  // 役職バランスチェック
  validateRoleBalance(roles);
  
  // ランダムに役職を配布
  const shuffledRoles = shuffle(roles, options.randomSeed);
  
  // プレイヤーに役職を割り当て
  const assignments = [];
  for (let i = 0; i < players.length; i++) {
    assignments.push({
      playerId: players[i].id,
      role: shuffledRoles[i]
    });
  }
  
  // 役職間の相互参照を設定
  setupRoleReferences(assignments);
  
  return assignments;
}

// 役職間の相互参照設定
function setupRoleReferences(assignments) {
  // 妖狐と背徳者の関連付け
  const fox = assignments.find(a => a.role === 'fox');
  const heretics = assignments.filter(a => a.role === 'heretic');
  
  if (fox && heretics.length > 0) {
    for (const heretic of heretics) {
      heretic.relatedRoles = { fox: fox.playerId };
    }
  }
  
  // 人狼同士の関連付け
  const wolves = assignments.filter(a => a.role === 'werewolf');
  if (wolves.length > 1) {
    for (const wolf of wolves) {
      wolf.relatedRoles = { 
        otherWolves: wolves.filter(w => w.playerId !== wolf.playerId).map(w => w.playerId) 
      };
    }
  }
  
  // 共有者同士の関連付け
  const masons = assignments.filter(a => a.role === 'mason');
  if (masons.length > 1) {
    for (const mason of masons) {
      mason.relatedRoles = { 
        otherMasons: masons.filter(m => m.playerId !== mason.playerId).map(m => m.playerId) 
      };
    }
  }
}
```

## 9. 実装ガイドライン

### 9.1 役職クラス実装のポイント

1. **基底クラスを継承**: すべての役職は `Role` 基底クラスを継承する
2. **適切なライフサイクルフックを実装**: 役職の能力に応じて必要なフックメソッドをオーバーライド
3. **イベント駆動**: 状態変化はイベントを通じて通知
4. **情報の非対称性**: 視点に応じた情報開示に注意
5. **エラー処理**: 無効な操作に対する堅牢な検証と例外処理

### 9.2 役職実装例

```javascript
// 占い師役職の実装例
class Seer extends Village {
  constructor(game) {
    super(game);
    this.name = 'seer';
    this.displayName = '占い師';
    this.fortuneResults = [];
    
    // イベントリスナー登録
    this.game.eventSystem.on('phase.end.night', this.handleNightEnd.bind(this));
  }
  
  // 能力使用可能判定
  canUseAbility(night) {
    return this.isAlive;
  }
  
  // 能力対象取得
  getAbilityTargets() {
    // 自分以外の生存プレイヤー
    return this.game.getAlivePlayers()
      .filter(p => p.id !== this.playerId)
      .map(p => p.id);
  }
  
  // 占い実行
  fortuneTell(targetId) {
    // プレイヤーが生存しているか確認
    if (!this.isAlive) {
      return { success: false, reason: 'DEAD_PLAYER' };
    }
    
    // 対象が有効か確認
    const target = this.game.getPlayer(targetId);
    if (!target || !target.isAlive) {
      return { success: false, reason: 'INVALID_TARGET' };
    }
    
    // アクション登録
    const actionId = this.game.generateActionId();
    this.game.eventSystem.emit('role.action.register', {
      id: actionId,
      type: 'fortune',
      actor: this.playerId,
      target: targetId,
      night: this.game.getCurrentTurn(),
      priority: 100
    });
    
    return { success: true, actionId };
  }
  
  // 夜の行動処理
  onNightAction(target, night) {
    // 占い対象の役職取得
    const targetPlayer = this.game.getPlayer(target);
    if (!targetPlayer) return null;
    
    // 占い結果取得
    const result = targetPlayer.role.getFortuneResult();
    
    // 結果をプレイヤーの履歴に保存
    this.fortuneResults.push({
      night,
      targetId: target,
      result,
      targetName: targetPlayer.name
    });
    
    // 妖狐の呪殺処理
    if (targetPlayer.role.name === 'fox') {
      this.game.eventSystem.emit('fox.curse', {
        foxId: target,
        seerId: this.playerId,
        night
      });
    }
    
    // 結果イベント発火
    this.game.eventSystem.emit('role.action.result', {
      type: 'fortune',
      actor: this.playerId,
      target,
      result,
      night
    });
    
    return result;
  }
  
  // 夜フェーズ終了ハンドラ
  handleNightEnd(event) {
    // 占い結果を通知するなどの処理
  }
}
```

## 10. まとめ

この設計書では、人狼ゲームGM支援ライブラリの中核となる役職クラスの階層構造、インターフェース、相互作用方法を詳細に定義しました。イベント駆動型のアーキテクチャを活用し、各役職の能力や特性を柔軟かつ拡張性のある形で実装することができます。

基底クラスと継承構造を活用することで、新しい役職の追加が容易になり、役職間の複雑な相互作用もイベントシステムを通じて明確に定義されています。この設計に基づいて実装することで、様々な人狼ゲームのバリエーションに対応できる柔軟なライブラリが構築できます。
