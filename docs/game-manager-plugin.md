# GameManager - GameManagerPlugin.js 設計書

## 概要

`GameManagerPlugin.js` はGameManagerのプラグイン管理機能を提供するモジュールです。カスタム役職、ルール、機能の登録と管理を担当し、ライブラリの拡張性を実現します。

## 役割

- プラグインの登録と管理
- プラグインのライフサイクル管理
- プラグインAPIの提供
- プラグインの依存関係管理
- プラグインの競合解決

## 依存モジュール

このファイルはGameManagerのMix-inとして実装され、GameManagerインスタンスのコンテキストで実行されるため、GameManagerの各種プロパティやメソッドに依存します。

## Mix-in関数の定義

GameManagerのプロトタイプに以下のメソッドを追加します：

### registerPlugin(pluginId, plugin)
**説明**: プラグインを登録します。  
**アクセス**: public  
**パラメータ**:
- pluginId: プラグインの一意なID
- plugin: プラグインオブジェクト  
**戻り値**: 登録成功時にtrue  
**処理内容**:
- プラグインの検証
- プラグインストアの初期化
- 登録前イベントの発火
- プラグインの登録
- 登録後イベントの発火
- エラー処理

### enablePlugin(pluginId, options)
**説明**: プラグインを有効化します。  
**アクセス**: public  
**パラメータ**:
- pluginId: 有効化するプラグインのID
- options: プラグインに渡すオプション  
**戻り値**: 有効化成功時にtrue  
**処理内容**:
- プラグインの存在確認
- プラグイン有効状態の確認
- 有効化前イベントの発火
- 依存関係の確認と有効化
- プラグインの初期化（init呼び出し）
- プラグイン情報の更新
- 有効化後イベントの発火
- エラー処理

### disablePlugin(pluginId)
**説明**: プラグインを無効化します。  
**アクセス**: public  
**パラメータ**:
- pluginId: 無効化するプラグインのID  
**戻り値**: 無効化成功時にtrue  
**処理内容**:
- プラグインの存在確認
- プラグイン有効状態の確認
- 無効化前イベントの発火
- 他のプラグインの依存関係チェック
- プラグインのクリーンアップ（cleanup呼び出し）
- プラグイン情報の更新
- 無効化後イベントの発火
- エラー処理

### getPlugin(pluginId)
**説明**: プラグインを取得します。  
**アクセス**: public  
**パラメータ**:
- pluginId: 取得するプラグインのID  
**戻り値**: プラグインオブジェクト、または存在しない場合はnull  
**処理内容**:
- プラグインの存在確認
- プラグイン情報の取得と整形
- 情報の返却

### getPlugins(enabledOnly)
**説明**: 登録されているすべてのプラグインを取得します。  
**アクセス**: public  
**パラメータ**:
- enabledOnly: trueの場合、有効なプラグインのみ返す  
**戻り値**: プラグイン情報の配列  
**処理内容**:
- プラグインの存在確認
- フィルタリング（有効なプラグインのみ）
- プラグイン情報の収集
- 情報の返却

### isPluginEnabled(pluginId)
**説明**: プラグインが有効かどうかを確認します。  
**アクセス**: public  
**パラメータ**:
- pluginId: 確認するプラグインのID  
**戻り値**: プラグインが登録され有効な場合はtrue  
**処理内容**:
- 有効プラグインリストで確認

### validatePlugin(pluginId, plugin)
**説明**: プラグインを検証します。  
**アクセス**: private  
**パラメータ**:
- pluginId: プラグインID
- plugin: プラグインオブジェクト  
**処理内容**:
- プラグインIDの重複チェック
- プラグインオブジェクトの基本検証
- 必須メソッドの存在確認
- エラー検出時は例外をスロー

### checkAndEnableDependencies(plugin)
**説明**: プラグインの依存関係を確認し、必要なプラグインを有効化します。  
**アクセス**: private  
**パラメータ**:
- plugin: 依存関係を確認するプラグイン  
**処理内容**:
- 依存関係の定義確認
- 各依存プラグインの有効状態確認
- 未有効の依存プラグインを有効化
- 依存関係が満たせない場合はエラー

### checkDependentsBeforeDisable(pluginId)
**説明**: プラグイン無効化前に依存しているプラグインをチェックします。  
**アクセス**: private  
**パラメータ**:
- pluginId: 無効化するプラグインのID  
**処理内容**:
- 有効なプラグインをチェック
- 依存関係の確認
- 他のプラグインが依存している場合はエラー

### registerRolePlugin(roleName, roleClass)
**説明**: カスタム役職を登録するプラグインヘルパーです。  
**アクセス**: public  
**パラメータ**:
- roleName: 役職名
- roleClass: 役職クラス  
**戻り値**: 登録成功時にtrue  
**処理内容**:
- 役職プラグイン登録前イベント発火
- 役職の登録
- 役職プラグイン登録後イベント発火
- エラー処理

### registerRulePlugin(ruleId, ruleDefinition)
**説明**: カスタムルールを登録するプラグインヘルパーです。  
**アクセス**: public  
**パラメータ**:
- ruleId: ルールID
- ruleDefinition: ルール定義  
**戻り値**: 登録成功時にtrue  
**処理内容**:
- ルールプラグイン登録前イベント発火
- ルールの登録
- ルールプラグイン登録後イベント発火
- エラー処理

## プラグイン構造

### 標準プラグインインターフェース

```
{
  // メタデータ（必須）
  metadata: {
    name: String,        // プラグイン名
    description: String, // 説明
    version: String,     // バージョン
    author: String,      // 作者
    compatibility: {     // 互換性情報（オプション）
      minVersion: String,
      maxVersion: String
    }
  },
  
  // 依存プラグインのリスト（オプション）
  dependencies: String[],
  
  // 初期化関数（必須）
  init: Function(game, options),
  
  // クリーンアップ関数（オプション）
  cleanup: Function(game),
  
  // 各種拡張ポイント（すべてオプション）
  onGameStart: Function(game),
  onGameEnd: Function(game, result),
  onPhaseChange: Function(game, fromPhase, toPhase),
  customApiFunctions: Object  // ゲームに追加するAPIメソッド
}
```

## 設計上の注意点

1. **プラグインのライフサイクル管理**
   - 登録、有効化、無効化のフローを明確に
   - 初期化とクリーンアップの適切な実行
   - 状態変更時のイベント発火

2. **依存関係の管理**
   - プラグイン間の依存関係の検証
   - 循環依存の検出と防止
   - 依存プラグインの自動有効化

3. **拡張ポイントの提供**
   - 役職、ルール、機能などの拡張ポイント
   - 一貫したプラグインAPIの提供
   - 既存機能との統合

4. **競合解決**
   - 競合するプラグイン間の優先順位付け
   - 同名の役職やルールの衝突解決
   - 互換性の検証

5. **エラー処理**
   - プラグイン操作の妥当性検証
   - わかりやすいエラーメッセージ
   - 障害からの回復メカニズム

## イベントリスト

プラグイン管理に関連するイベント一覧：

| イベント名 | 発火タイミング | データ内容 |
|------------|----------------|------------|
| `plugin.register.before` | プラグイン登録前 | `{pluginId, metadata}` |
| `plugin.register.after` | プラグイン登録後 | `{pluginId, metadata}` |
| `plugin.enable.before` | プラグイン有効化前 | `{pluginId, options}` |
| `plugin.enable.after` | プラグイン有効化後 | `{pluginId, options}` |
| `plugin.disable.before` | プラグイン無効化前 | `{pluginId}` |
| `plugin.disable.after` | プラグイン無効化後 | `{pluginId}` |
| `plugin.role.register.before` | 役職プラグイン登録前 | `{roleName}` |
| `plugin.role.register.after` | 役職プラグイン登録後 | `{roleName, success}` |
| `plugin.rule.register.before` | ルールプラグイン登録前 | `{ruleId}` |
| `plugin.rule.register.after` | ルールプラグイン登録後 | `{ruleId}` |

## 使用例

```
// カスタム役職プラグインの例
const catPlugin = {
  metadata: {
    name: "猫又プラグイン",
    description: "猫又役職を追加するプラグイン",
    version: "1.0.0",
    author: "開発者名"
  },
  
  // 初期化メソッド
  init: function(game, options) {
    // 猫又役職クラスの定義
    class Nekomata extends game.Role {
      constructor(gameInstance) {
        super(gameInstance);
        this.name = "nekomata";
        this.team = "village";
        
        this.metadata = {
          displayName: "猫又",
          description: "処刑されると投票者の中から1人を道連れにする"
        };
      }
      
      // 死亡時の処理
      onDeath(player, cause) {
        if (cause === "execution") {
          // 投票者から1人を選んで道連れに
          const voters = game.getVotersOf(player.id);
          if (voters.length > 0) {
            const randomIndex = Math.floor(game.random.random() * voters.length);
            game.killPlayer(voters[randomIndex], "nekomata_curse");
          }
        }
      }
    }
    
    // 役職の登録
    game.registerRolePlugin("nekomata", Nekomata);
    
    // オプションに基づく設定
    if (options.enableCurseMessage) {
      // 道連れメッセージのイベントリスナー登録
      game.on('player.death', (data) => {
        if (data.cause === "nekomata_curse") {
          game.emit('nekomata.curse.message', {
            playerId: data.playerId,
            message: "猫又の呪いにより道連れになりました"
          });
        }
      });
    }
  },
  
  // クリーンアップメソッド
  cleanup: function(game) {
    // リスナーの削除など必要なクリーンアップ
    game.off('player.death');
  }
};

// プラグインの登録
game.registerPlugin("nekomata", catPlugin);

// プラグインの有効化（オプション付き）
game.enablePlugin("nekomata", {
  enableCurseMessage: true
});

// プラグイン情報の取得
const pluginInfo = game.getPlugin("nekomata");
console.log(`猫又プラグイン: ${pluginInfo.metadata.name} (有効: ${pluginInfo.enabled})`);

// 有効なプラグイン一覧の取得
const enabledPlugins = game.getPlugins(true);
console.log(`有効なプラグイン数: ${enabledPlugins.length}`);

// 不要になったプラグインの無効化
game.disablePlugin("nekomata");
```