# GameManager - index.js 設計書

## 概要

`index.js` はGameManagerモジュールのエントリーポイントとして機能し、他のすべてのGameManager関連モジュールを統合して単一のGameManagerクラスをエクスポートします。

## 役割

- GameManagerモジュールの単一エントリーポイントとして機能
- 分割された各機能モジュールの集約
- 外部からのインポートを簡素化

## 依存モジュール

- GameManager.js: コアのGameManagerクラス定義

## エクスポート内容

- デフォルトエクスポート: GameManagerクラス
- 名前付きエクスポート: GameManagerクラスとバージョン情報など

## 実装方針

- シンプルなエントリーポイントとして、GameManagerクラスをそのままエクスポート
- ライブラリ利用者がインポートする際のパスを簡素化
- フォルダ内の実装の詳細を隠蔽

## 利用例

ライブラリ利用者からのインポート例:
- `import GameManager from 'werewolf-gm-lib/service/gameManager';`
- `const game = new GameManager({ /* オプション */ });`

## 注意点

- このファイルはロジックを持たず、単にエクスポートを担当
- バージョニングやエクスポート形式の変更があった場合は、このファイルを通じて対応
