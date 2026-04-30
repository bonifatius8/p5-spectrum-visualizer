# p5-spectrum-visualizer

p5.js v2（WEBGL）+ TypeScript + Vite によるリアルタイム・オーディオビジュアライザ。

`VisualLayer` インターフェースによる疎結合レイヤー構成・毎フレーム `AudioData` スナップショットによるオーディオ分離・P2D オフスクリーンバッファと WEBGL コンポジットを組み合わせたグラフィック描画パターンをフルスクラッチで実装したプロジェクトです。ライブコーディング用途を想定した拡張しやすい構成を示すポートフォリオとして公開しています。

**デモ:** [https://bonifatius8.github.io/p5-spectrum-visualizer/](https://bonifatius8.github.io/p5-spectrum-visualizer/)

## 使い方

1. 画面をクリック → 初回はブラウザがマイク入力の許可を求める
2. 許可後、マイクからの音声を FFT 解析し描画開始
3. 周波数成分・音量に応じてグラフィックがリアルタイム変化

## 開発環境

```sh
npm install
npm run dev
```

## スタック

- p5.js v2 (WEBGL)
- TypeScript 5 + Vite
- Web Audio API (getUserMedia → AnalyserNode → FFT)

## 構成

```
src/
  sketch.ts                    # エントリ。レイヤー定義のみ
  AudioData.ts                 # 毎フレームのオーディオスナップショット型
  VisualLayer.ts               # レイヤーインターフェース
  spectrumAnalyzerClass.ts     # マイク取得・FFT
  sketchConfig.ts              # 定数
  layers/
    ConcentricCirclesLayer.ts  # 同心円（メイン）
    BackgroundFadeLayer.ts     # 残像フェード
    EllipseLayer.ts            # 周波数帯エリプス
    VideoLayer.ts              # 動画テクスチャ
    DebugLayer.ts              # デバッグオーバーレイ
  concentricCircles.ts         # 同心円描画ロジック
  ellipse.ts / ellipsePhysics.ts
  aWeightingFilter.ts          # A特性フィルター
  movingAverageFilter.ts       # 移動平均フィルター
```

## 機能

- マイク入力 FFT → 1024バンド周波数データ
- 同心円：周波数・音量で色相・回転・スケール変化
- エリプス：各周波数帯に対応した物理シミュレーション付きボール
- 残像効果（MULTIPLY ブレンド）
- ウィンドウリサイズ追従
- A特性補正・移動平均によるスペクトラム平滑化

## 技術的特徴

- **レイヤー疎結合** — `VisualLayer` インターフェースで各レイヤーを独立。`sketch.ts` の `layers[]` への追加・削除のみで構成変更可能
- **AudioData スナップショット** — 毎フレーム生成したスナップショットを全レイヤーに渡す。レイヤーは `AudioContext` に直接アクセスしない
- **WEBGL + P2D コンポジット** — メインキャンバスは WEBGL、各レイヤーは P2D オフスクリーンバッファで独立描画し `texture()` + `plane()` で合成
- **スペクトラム補正** — A特性フィルター + 移動平均で周波数特性を補正・平滑化
- **autoplay 制限対応** — `AudioContext` 初期化をクリックトリガーに限定。ブラウザの自動再生ポリシーに準拠

---

## 修正履歴

### 2025-05-09: マイクアクセス許可

リロード後にマイク許可が再要求されず音声入力が無効化される問題を修正。AudioContext 初期化をユーザークリックトリガーに変更。

### 2025-05-09: 物理シミュレーション

エリプスに質量・速度・加速度モデルを導入。低周波ほど跳ね返り係数が大きくなるよう動的調整、速度比例の抵抗力を追加。

### 2025-05-10: クリック範囲

特定エリア外でクリックが無効になる問題を修正。canvas 全体へイベントリスナーを設定。

### 2025-05-12: 同心円描画

円ごとの周波数割り当てを bands 幅に対応。A特性フィルター適用、描画と計算を分離。

### 2025-05-12: モジュール分離

物理シミュレーションを `ellipsePhysics.ts`、FFT 解析を `spectrumAnalyzerClass.ts` に分離。
