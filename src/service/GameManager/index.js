/**
 * GameManager Module - 人狼ゲームGM支援ライブラリのコアモジュール
 * 
 * このファイルはGameManagerモジュールのエントリーポイントとして機能し、
 * 各サブモジュールを統合して単一のGameManagerクラスをエクスポートします。
 * 
 * @module GameManager
 */

import GameManager from '../GameManager.js';

export default GameManager;

// バージョン情報をエクスポート
export const version = GameManager.version;
