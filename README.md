# p5-spectrum-visualizer

マイク入力をリアルタイム FFT 解析し、周波数スペクトラムをグラフィックで可視化するウェブアプリ。

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

---

## 修正履歴

### 2025-05-09: マイクアクセス許可

AudioContext 初期化をユーザークリックのトリガーに変更した。リロード後にマイク許可が再要求されず音声入力が無効化される問題を修正。

### 2025-05-09: 物理シミュレーション

エリプスに質量・速度・加速度モデルを導入した。低周波ほど跳ね返り係数が大きくなるよう動的調整し、速度比例の抵抗力を追加。

### 2025-05-10: クリック範囲

canvas 全体にイベントリスナーを設定した。特定エリア外でクリックが無効になる問題を修正。

### 2025-05-12: 同心円描画

円ごとの周波数割り当てを bands 幅に対応させた。A特性フィルターを適用し、描画と計算を分離。

### 2025-05-12: モジュール分離

物理シミュレーションを `ellipsePhysics.ts`、FFT 解析を `spectrumAnalyzerClass.ts` に分離した。
