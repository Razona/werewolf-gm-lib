# 人狼ゲームGM支援ライブラリ 開発ガイド

## 1. プロジェクト概要

このプロジェクトは、人狼ゲーム配信コミュニティのGM向けに、ゲーム進行の核となる処理を提供するJavaScriptライブラリを開発することを目的としています。Node.jsとブラウザの両環境で動作し、DiscordボットやOBS連携ツールなど様々なGMツールに組み込み可能なモジュール構造を持ちます。

### 1.1 主要な目標

- ゲームロジックをモジュール化し、開発者が人狼ゲームの基本処理を再実装する手間を省く
- 様々な形態のGMツールに組み込める柔軟性を提供する
- 拡張性の高い設計で、カスタム役