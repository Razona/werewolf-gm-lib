# GameManagerPlayer.js 改善版テスト設計

## 1. テスト対象の概要

`GameManagerPlayer.js`は、人狼ゲームGM支援ライブラリの中核となるGameManagerクラスにプレイヤー管理機能を追加するMixinモジュールです。プレイヤーの追加・削除・状態管理など、プレイヤーに関連する操作を担当します。

## 2. テスト方針

以下の方針でテストを設計します：

1. **単体テスト**: 各メソッドの正常系・異常系の動作を検証
2. **統合テスト**: 他モジュールとの連携（特にEventSystem、PlayerManager、GameManager）を検証
3. **パラメータテスト**: 境界値や無効値のテスト
4. **モック活用**: 依存モジュールをモック化してテストを分離
5. **ステートテスト**: ゲーム状態による動作の変化を検証
6. **シナリオテスト**: 長期的なゲーム進行を通した複合機能の検証

## 3. 単体テスト設計

### 3.1 プレイヤー追加機能のテスト

#### テストケース 1-1: 通常のプレイヤー追加
- **シナリオ**: 有効な名前で通常のプレイヤー追加
- **前提条件**: ゲーム未開始状態
- **アクション**: `addPlayer('プレイヤー1')`を呼び出す
- **期待結果**: 
  - 数値型のプレイヤーIDが返される
  - PlayerManagerの`addPlayer`が呼ばれる
  - `player.add`イベントが発火する
  - 追加したプレイヤーが`getPlayer`で取得できる

#### テストケース 1-2: 無効な名前でのプレイヤー追加
- **シナリオ**: 空文字列や数値など無効な名前でプレイヤー追加
- **前提条件**: ゲーム未開始状態
- **アクション**: `addPlayer('')`、`addPlayer(123)`、`addPlayer(null)`を呼び出す
- **期待結果**: いずれも適切なエラーが発生する（INVALID_PLAYER_NAME等）

#### テストケース 1-3: ゲーム開始後のプレイヤー追加
- **シナリオ**: ゲーム開始後にプレイヤーを追加しようとする
- **前提条件**: ゲーム開始状態（state.isStarted = true）
- **アクション**: `addPlayer('プレイヤー1')`を呼び出す
- **期待結果**: エラーが発生する（GAME_ALREADY_STARTED等）

### 3.2 プレイヤー削除機能のテスト

#### テストケース 2-1: 通常のプレイヤー削除
- **シナリオ**: 存在するプレイヤーを削除
- **前提条件**: ゲーム未開始状態、プレイヤーが存在する
- **アクション**: `removePlayer(playerId)`を呼び出す
- **期待結果**: 
  - trueが返される
  - PlayerManagerの`removePlayer`が呼ばれる
  - `player.remove`イベントが発火する
  - 削除したプレイヤーが`getPlayer`で取得できなくなる

#### テストケース 2-2: 存在しないプレイヤーの削除
- **シナリオ**: 存在しないIDのプレイヤーを削除
- **前提条件**: ゲーム未開始状態
- **アクション**: `removePlayer(999)`を呼び出す
- **期待結果**: エラーが発生する（PLAYER_NOT_FOUND等）

#### テストケース 2-3: ゲーム開始後のプレイヤー削除
- **シナリオ**: ゲーム開始後にプレイヤーを削除しようとする
- **前提条件**: ゲーム開始状態（state.isStarted = true）
- **アクション**: `removePlayer(playerId)`を呼び出す
- **期待結果**: エラーが発生する（GAME_ALREADY_STARTED等）

### 3.3 プレイヤー情報取得のテスト

#### テストケース 3-1: IDによるプレイヤー取得
- **シナリオ**: 存在するプレイヤーをIDで取得
- **前提条件**: プレイヤーが追加されている
- **アクション**: `getPlayer(playerId)`を呼び出す
- **期待結果**: 正しいプレイヤーオブジェクトが返される

#### テストケース 3-2: 存在しないIDによるプレイヤー取得
- **シナリオ**: 存在しないIDのプレイヤーを取得
- **前提条件**: なし
- **アクション**: `getPlayer(999)`を呼び出す
- **期待結果**: エラーが発生する（PLAYER_NOT_FOUND等）

#### テストケース 3-3: 名前によるプレイヤー取得
- **シナリオ**: 存在するプレイヤーを名前で取得
- **前提条件**: 指定した名前のプレイヤーが追加されている
- **アクション**: `getPlayerByName('プレイヤー1')`を呼び出す
- **期待結果**: 正しいプレイヤーオブジェクトが返される

#### テストケース 3-4: 存在しない名前によるプレイヤー取得
- **シナリオ**: 存在しない名前のプレイヤーを取得
- **前提条件**: なし
- **アクション**: `getPlayerByName('存在しない名前')`を呼び出す
- **期待結果**: nullが返される

### 3.4 プレイヤーリスト取得のテスト

#### テストケース 4-1: 全プレイヤー取得
- **シナリオ**: すべてのプレイヤーリストを取得
- **前提条件**: 複数のプレイヤーが追加されている
- **アクション**: `getAllPlayers()`を呼び出す
- **期待結果**: 追加したすべてのプレイヤーを含む配列が返される

#### テストケース 4-2: 生存プレイヤー取得
- **シナリオ**: 生存しているプレイヤーリストを取得
- **前提条件**: 一部のプレイヤーが死亡している
- **アクション**: `getAlivePlayers()`を呼び出す
- **期待結果**: 生存中のプレイヤーのみを含む配列が返される

#### テストケース 4-3: プレイヤー数取得
- **シナリオ**: 総プレイヤー数を取得
- **前提条件**: 複数のプレイヤーが追加されている
- **アクション**: `getPlayerCount()`を呼び出す
- **期待結果**: 正確なプレイヤー数（数値）が返される

#### テストケース 4-4: 生存プレイヤー数取得
- **シナリオ**: 生存プレイヤー数を取得
- **前提条件**: 一部のプレイヤーが死亡している
- **アクション**: `getAlivePlayerCount()`を呼び出す
- **期待結果**: 生存中のプレイヤー数（数値）が返される

### 3.5 プレイヤー死亡処理のテスト

#### テストケース 5-1: 通常の死亡処理
- **シナリオ**: プレイヤーを死亡させる
- **前提条件**: ゲーム開始状態、対象プレイヤーが生存している
- **アクション**: `killPlayer(playerId, 'execution')`を呼び出す
- **期待結果**: 
  - 処理結果オブジェクトが返される
  - `player.death.before`イベントが発火する
  - PlayerManagerの死亡処理メソッドが呼ばれる
  - プレイヤーの状態が死亡に変わる
  - `player.death.after`イベントが発火する
  - `isPlayerAlive(playerId)`がfalseを返す

#### テストケース 5-2: 既に死亡しているプレイヤーの死亡処理
- **シナリオ**: 既に死亡しているプレイヤーを死亡させようとする
- **前提条件**: ゲーム開始状態、対象プレイヤーが死亡している
- **アクション**: `killPlayer(playerId, 'attack')`を呼び出す
- **期待結果**: エラーが発生する（PLAYER_ALREADY_DEAD等）

#### テストケース 5-3: 死亡処理のトランザクション
- **シナリオ**: 死亡処理中にエラーが発生した場合のロールバック
- **前提条件**: ゲーム開始状態、処理途中でエラーが発生するよう設定
- **アクション**: `killPlayer(playerId, 'poison')`を呼び出す
- **期待結果**: 
  - エラーが発生する
  - 状態変更がロールバックされる
  - プレイヤーは生存状態のままである

#### テストケース 5-4: 死亡処理における役職効果の連鎖
- **シナリオ**: プレイヤー死亡時に連鎖的な役職効果が発動
- **前提条件**: ゲーム開始状態、連鎖効果を持つ役職（例：猫又）の設定
- **アクション**: `killPlayer(playerId, 'execution')`を呼び出す
- **期待結果**: 
  - 死亡処理が成功する
  - 連鎖効果がトランザクション内で正しく処理される
  - すべての効果が適用された状態が反映される

### 3.6 状態効果管理のテスト

#### テストケース 6-1: 状態効果の設定
- **シナリオ**: プレイヤーに状態効果を設定する
- **前提条件**: ゲーム開始状態
- **アクション**: `setPlayerStatusEffect(playerId, 'guarded', true, 1)`を呼び出す
- **期待結果**: 
  - trueが返される
  - PlayerManagerの状態効果設定メソッドが呼ばれる
  - `player.statusEffect.add`イベントが発火する
  - `hasPlayerStatusEffect(playerId, 'guarded')`がtrueを返す

#### テストケース 6-2: 状態効果のクリア
- **シナリオ**: プレイヤーの状態効果をクリアする
- **前提条件**: ゲーム開始状態、プレイヤーに状態効果が設定されている
- **アクション**: `clearPlayerStatusEffects(playerId, 'guarded')`を呼び出す
- **期待結果**: 
  - trueが返される
  - PlayerManagerの状態効果クリアメソッドが呼ばれる
  - `player.statusEffect.remove`イベントが発火する
  - `hasPlayerStatusEffect(playerId, 'guarded')`がfalseを返す

#### テストケース 6-3: すべての状態効果のクリア
- **シナリオ**: プレイヤーのすべての状態効果をクリアする
- **前提条件**: ゲーム開始状態、プレイヤーに複数の状態効果が設定されている
- **アクション**: `clearPlayerStatusEffects(playerId)`を呼び出す（効果タイプを指定しない）
- **期待結果**: 
  - trueが返される
  - すべての状態効果がクリアされる
  - 各効果について`player.statusEffect.remove`イベントが発火する

#### テストケース 6-4: 状態効果の確認
- **シナリオ**: プレイヤーが特定の状態効果を持っているか確認する
- **前提条件**: 一部のプレイヤーに特定の状態効果が設定されている
- **アクション**: `hasPlayerStatusEffect(playerId, 'guarded')`を呼び出す
- **期待結果**: 状態効果の有無に応じて正しい真偽値が返される

#### テストケース 6-5: 状態効果の持続期間と有効期限
- **シナリオ**: 期限付き状態効果の有効期限切れ処理
- **前提条件**: プレイヤーに持続期間1ターンの状態効果が設定されている
- **アクション**: 
  1. ターンを進める（フェーズ遷移イベントを発火）
  2. 状態効果の確認
- **期待結果**: 
  - ターン終了時に状態効果が自動的に解除される
  - `player.statusEffect.expired`イベントが発火する
  - `hasPlayerStatusEffect`がfalseを返す

#### テストケース 6-6: 競合する状態効果の優先順位処理
- **シナリオ**: 互いに競合する複数の状態効果を同時に設定
- **前提条件**: ゲーム開始状態
- **アクション**: 
  1. `setPlayerStatusEffect(playerId, 'guarded', true, 1)`
  2. `setPlayerStatusEffect(playerId, 'targeted', true, 1)`（護衛と相反する効果）
- **期待結果**: 
  - 両方の効果が設定される
  - 優先順位に従って効果が適用される（例：護衛が優先）
  - 競合解決イベントが発火する

### 3.7 情報可視性制御のテスト

#### テストケース 7-1: 公開情報の取得
- **シナリオ**: すべてのプレイヤーに対して公開される情報を取得
- **前提条件**: プレイヤーが追加されている
- **アクション**: `getVisiblePlayerInfo(playerId, viewerId)`を呼び出す（異なるプレイヤー間）
- **期待結果**: 公開情報（名前、生死状態など）のみを含むオブジェクトが返される

#### テストケース 7-2: 同じ陣営内での情報取得
- **シナリオ**: 同じ陣営のプレイヤー情報を取得
- **前提条件**: 同じ陣営に属する複数のプレイヤーが存在する
- **アクション**: `getVisiblePlayerInfo(playerId1, playerId2)`を呼び出す（同じ陣営のプレイヤー間）
- **期待結果**: 陣営内で共有される情報（役職など）を含むオブジェクトが返される

#### テストケース 7-3: GM視点での情報取得
- **シナリオ**: GM（システム管理者）視点でのプレイヤー情報取得
- **前提条件**: プレイヤーが追加されている
- **アクション**: `getVisiblePlayerInfo(playerId, null)`を呼び出す（viewerIdをnullに）
- **期待結果**: すべての情報を含む完全なプレイヤーオブジェクトが返される

#### テストケース 7-4: 情報漏洩防止の検証
- **シナリオ**: 異なる陣営間での情報漏洩防止
- **前提条件**: 異なる陣営に属するプレイヤーが存在する
- **アクション**: 陣営固有の情報を含むプレイヤーを別陣営のプレイヤーから閲覧
- **期待結果**: 陣営固有の情報（役職詳細など）が閲覧できない

#### テストケース 7-5: レギュレーションに基づく情報開示
- **シナリオ**: 死亡プレイヤーの役職公開設定による情報開示の違い
- **前提条件**: レギュレーションが設定され、プレイヤーが死亡している
- **アクション**: 
  1. `revealRoleOnDeath: true`設定で死亡プレイヤーの情報を取得
  2. `revealRoleOnDeath: false`設定で死亡プレイヤーの情報を取得
- **期待結果**: 設定に応じて適切な情報が公開/非公開になる

### 3.8 プライベートメソッドの振る舞いテスト

#### テストケース 8-1: validatePlayerIdの間接的検証
- **シナリオ**: プライベートメソッド`#validatePlayerId`の振る舞いを検証
- **前提条件**: なし
- **アクション**: 存在しないプレイヤーIDで各種操作メソッドを呼び出す
- **期待結果**: 一貫したエラー（PLAYER_NOT_FOUND等）が発生する

#### テストケース 8-2: checkGameStateの間接的検証
- **シナリオ**: プライベートメソッド`#checkGameState`の振る舞いを検証
- **前提条件**: 様々なゲーム状態の設定
- **アクション**: 
  1. ゲーム開始前に`addPlayer`を呼び出す（成功すべき）
  2. ゲーム開始後に`addPlayer`を呼び出す（失敗すべき）
  3. ゲーム終了後に`killPlayer`を呼び出す（失敗すべき）
- **期待結果**: 各ゲーム状態に応じた正しい振る舞いとエラーメッセージ

## 4. 統合テスト設計

### 4.1 GameManagerとの統合テスト

#### テストケース 9-1: GameManagerへのMixin適用
- **シナリオ**: GameManagerPlayerMixinがGameManagerに正しく適用される
- **前提条件**: GameManagerとGameManagerPlayerMixinが準備されている
- **アクション**: GameManagerPlayerMixinを適用してGameManagerインスタンスを生成
- **期待結果**: 
  - GameManagerインスタンスに全てのプレイヤー管理メソッドが存在する
  - 公開APIが期待通りの型と振る舞いを持つ

#### テストケース 9-2: GameManager状態との連携
- **シナリオ**: ゲーム状態に基づく操作制限が機能する
- **前提条件**: GameManagerインスタンスが生成されている
- **アクション**: 
  1. ゲーム開始前にプレイヤーを追加・削除
  2. ゲームを開始
  3. ゲーム開始後にプレイヤーを追加・削除しようとする
- **期待結果**: 
  1. プレイヤーの追加・削除が成功
  2. ゲーム開始が成功
  3. プレイヤーの追加・削除時にエラーが発生

### 4.2 EventSystemとの統合テスト

#### テストケース 10-1: イベント発火
- **シナリオ**: プレイヤー操作に伴うイベントが正しく発火する
- **前提条件**: GameManagerインスタンスとイベントリスナーが設定されている
- **アクション**: 様々なプレイヤー操作（追加、削除、死亡処理など）を実行
- **期待結果**: 各操作に対応する正しいイベントが発火し、正しいデータが渡される

#### テストケース 10-2: イベントからの処理
- **シナリオ**: イベントに応じた処理が正しく実行される
- **前提条件**: GameManagerインスタンスが生成されている
- **アクション**: プレイヤーに影響を与えるイベント（例: phase.change）を発火
- **期待結果**: イベントに対応する処理（例: 状態効果のクリア）が実行される

#### テストケース 10-3: イベント連鎖の処理
- **シナリオ**: あるイベントが連鎖的に他のイベントを発生させる
- **前提条件**: イベント連鎖をトリガーする状況が設定されている
- **アクション**: 最初のイベントをトリガーする操作を実行
- **期待結果**: 
  - イベントが連鎖的に発火する
  - すべてのイベントハンドラが正しい順序で実行される
  - 最終的な状態が期待通りになる

### 4.3 PlayerManagerとの統合テスト

#### テストケース 11-1: メソッド委譲
- **シナリオ**: GameManagerPlayerがPlayerManagerに正しく処理を委譲する
- **前提条件**: GameManagerインスタンスとPlayerManagerのスパイが設定されている
- **アクション**: 様々なプレイヤー操作メソッドを呼び出す
- **期待結果**: 対応するPlayerManagerのメソッドが正しいパラメータで呼び出される

#### テストケース 11-2: PlayerManagerのエラー伝播
- **シナリオ**: PlayerManagerで発生したエラーが適切に処理される
- **前提条件**: PlayerManagerがエラーを発生させるよう設定されている
- **アクション**: エラーが発生するプレイヤー操作を実行
- **期待結果**: PlayerManagerのエラーがGameManagerのエラーとして適切に変換され伝播する

### 4.4 RoleManagerとの統合テスト

#### テストケース 12-1: 役職情報と情報可視性
- **シナリオ**: RoleManagerから取得した役職情報に基づく情報可視性制御
- **前提条件**: 役職と陣営が設定されたプレイヤーが存在する
- **アクション**: 異なる役職/陣営間での情報取得
- **期待結果**: RoleManagerの設定に基づいて正しい情報フィルタリングが行われる

#### テストケース 12-2: 役職効果とプレイヤー状態
- **シナリオ**: 役職効果がプレイヤー状態に影響する
- **前提条件**: 特殊効果を持つ役職（例：妖狐）が設定されている
- **アクション**: 役職効果を発動する（例：妖狐を占う）
- **期待結果**: 役職ロジックに基づいて正しくプレイヤー状態が変更される

## 5. 複合的なトランザクションテスト

### 5.1 単一操作のトランザクション

#### テストケース 13-1: 単一プレイヤーのトランザクション
- **シナリオ**: 単一プレイヤーに対する操作のトランザクション
- **前提条件**: トランザクション処理が実装されている
- **アクション**: トランザクション内でプレイヤー状態を変更
- **期待結果**: 
  - 変更が正しく適用される
  - 状態変更が原子的に行われる

#### テストケース 13-2: トランザクションのロールバック
- **シナリオ**: エラー発生時のトランザクションロールバック
- **前提条件**: エラーが発生するように設定されている
- **アクション**: トランザクション内で操作を実行
- **期待結果**: 
  - エラーが発生する
  - 途中までの変更がすべてロールバックされる
  - 元の状態に戻る

### 5.2 複合操作のトランザクション

#### テストケース 14-1: 複数プレイヤー操作のトランザクション
- **シナリオ**: 複数プレイヤーに対する一括操作のトランザクション
- **前提条件**: 複数のプレイヤーが存在する
- **アクション**: トランザクション内で複数プレイヤーの状態を変更
- **期待結果**: 
  - すべての変更が成功するか、すべて失敗する
  - 部分的な適用が発生しない

#### テストケース 14-2: ネストしたトランザクション
- **シナリオ**: トランザクション内で別のトランザクションが開始される
- **前提条件**: ネストしたトランザクションをサポートする実装
- **アクション**: 
  1. 外部トランザクションを開始
  2. 内部でさらに別のトランザクションを開始
  3. 内部または外部でエラーを発生させる
- **期待結果**: 
  - ネストの扱いに応じた正しい動作（フラット化またはネスト対応）
  - 一貫した状態が維持される

#### テストケース 14-3: イベント内トランザクション
- **シナリオ**: イベントハンドラ内でのトランザクション処理
- **前提条件**: イベントハンドラがトランザクションを使用する
- **アクション**: トランザクションを使用するイベントをトリガー
- **期待結果**: 
  - イベントハンドラ内のトランザクションが適切に処理される
  - イベント処理の成功/失敗に応じて状態が一貫して維持される

## 6. エッジケースとエラー処理のテスト

### 6.1 境界値テスト

#### テストケース 15-1: プレイヤー数の上限
- **シナリオ**: 上限を超えるプレイヤーを追加しようとする
- **前提条件**: プレイヤー数が上限近くまで追加されている
- **アクション**: さらにプレイヤーを追加しようとする
- **期待結果**: 上限に達した後はエラーが発生する

#### テストケース 15-2: 長い名前のプレイヤー
- **シナリオ**: 非常に長い名前でプレイヤーを追加
- **前提条件**: なし
- **アクション**: 非常に長い文字列（例:1000文字）でプレイヤーを追加
- **期待結果**: エラーが発生するか、名前が適切に処理される

### 6.2 同時実行テスト

#### テストケース 16-1: 複数の状態変更
- **シナリオ**: 複数のプレイヤー状態を同時に変更
- **前提条件**: 複数のプレイヤーが存在する
- **アクション**: 複数のプレイヤーの状態効果を一度に設定する
- **期待結果**: すべての変更が正しく適用される

#### テストケース 16-2: 競合する状態効果
- **シナリオ**: 競合する複数の状態効果を設定
- **前提条件**: ゲーム開始状態
- **アクション**: 相互に競合する効果（例: 'guarded'と'targeted'）を同じプレイヤーに設定
- **期待結果**: 優先順位に従って効果が適用される

#### テストケース 16-3: 並行トランザクション
- **シナリオ**: 複数のトランザクションが並行して実行される
- **前提条件**: 並行実行をシミュレートできる環境
- **アクション**: 複数のプレイヤー操作を異なるトランザクションで同時に実行
- **期待結果**: 
  - トランザクションが適切に分離される
  - 一方のトランザクションの失敗が他方に影響しない
  - データの整合性が維持される

### 6.3 特殊エラーケース

#### テストケース 17-1: 無効な状態効果タイプ
- **シナリオ**: サポートされていない状態効果タイプを設定
- **前提条件**: ゲーム開始状態
- **アクション**: `setPlayerStatusEffect(playerId, '存在しない効果', true)`を呼び出す
- **期待結果**: エラーが発生する

#### テストケース 17-2: 破損した状態からの回復
- **シナリオ**: 内部状態に矛盾がある場合の処理
- **前提条件**: 意図的に矛盾した状態を作る（例: 死亡フラグはtrueだが死亡リストにない）
- **アクション**: 状態チェックが行われるメソッドを呼び出す
- **期待結果**: エラーが検出されるか、状態が修復される

#### テストケース 17-3: 循環参照の検出
- **シナリオ**: プレイヤー状態の循環参照を検出
- **前提条件**: 意図的に循環参照を作成（例：相互依存する状態効果）
- **アクション**: プレイヤー情報の取得や状態変更操作を実行
- **期待結果**: 循環参照が検出され、適切に処理される