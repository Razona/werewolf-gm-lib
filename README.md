# 人狼ゲーム GM サポートライブラリ

GM（ゲームマスター）のための人狼ゲームのロジックを管理するための JavaScript ライブラリ

## 機能

- プレイヤー管理
- 役職の配布と管理
- ゲームフェーズの管理
- アクション処理
- 投票管理
- 勝利条件のチェック
- 拡張可能なプラグインシステム

### 詳細なドキュメントはいずれ追加

## インストール


```
bash
npm install werewolf-gm-lib

const werewolf = require('werewolf-gm-lib');

// Create a game instance
const game = werewolf.createGame();

// Add players
game.addPlayer("Player 1");
game.addPlayer("Player 2");
// ...

// Set roles
game.setRoles(['villager', 'werewolf', 'seer']);

// Start the game
game.start();

```