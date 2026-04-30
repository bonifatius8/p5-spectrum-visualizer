# p5-spectrum-visualizer

p5.js v2 + TypeScript + Vite によるオーディオビジュアライザ（ライブコーディング用）。

## スタック

- p5.js v2.0.3（WEBGL モード）
- TypeScript 5.8 + Vite 6
- @types/p5 v1.7.6（p5 v2 の組み込み型は TS5.x 非互換のため）

## アーキテクチャ

### レイヤー構成

`src/sketch.ts` の `layers: VisualLayer[]` 配列が描画構成の唯一の変更点。

```ts
const layers: VisualLayer[] = [
    new ConcentricCirclesLayer(),
    new BackgroundFadeLayer(),
    new VideoLayer([]),
    new DebugLayer(() => concentricLayer.lastResult),
    new EllipseLayer(),
];
```

- 順序 = 描画順
- 追加・削除・並び替えだけで構成変更
- 各レイヤーが自前バッファ・状態を所有（疎結合）

### VisualLayer インターフェース

```ts
interface VisualLayer {
    readonly name: string;
    enabled: boolean;
    setup(p: p5): void;
    resize(p: p5): void;
    draw(p: p5, audio: AudioData): void;
}
```

### AudioData スナップショット

毎フレーム `buildAudioData()` で生成し全レイヤーに渡す。レイヤーは AudioContext に直接触れない。

```ts
interface AudioData {
    frequencies: Uint8Array | null;
    volume: number;
    maxVolume: number;
    sampleRate: number;
    analyser: AnalyserNode | null;
    audioContext: AudioContext | null;
    bands: number;
    microphoneName: string;
}
```

### レイヤーファイル

| ファイル | 役割 |
|---|---|
| `src/layers/ConcentricCirclesLayer.ts` | 同心円（メイン） |
| `src/layers/BackgroundFadeLayer.ts` | 残像フェード（MULTIPLY blend） |
| `src/layers/EllipseLayer.ts` | 周波数帯エリプス |
| `src/layers/DebugLayer.ts` | デバッグ情報オーバーレイ |
| `src/layers/VideoLayer.ts` | 動画テクスチャ |

## p5 v2 既知の落とし穴

### noTint() WEBGL クラッシュ

`p.noTint()` は `tint = null` にセットする → `p.plane()` 内 shader が `null.slice()` でクラッシュ。

**禁止**: `p.texture()` + `p.plane()` の前に `p.noTint()` を呼ばない。  
**代替**: 何もしない（WEBGL 初期 tint は `[255,255,255,255]`）。push/pop で state 管理。

### @types/p5 バージョン

p5 v2 の組み込み型（`node_modules/p5/types/`）は TypeScript 5.x と非互換（`class` を parameter 名で使用）。`@types/p5` v1.7.6 を維持し `skipLibCheck: true` で回避。

### colorMode

HSB モード: `colorMode(HSB, 360, 100, 100, 255)`。  
`fill(255)` は白でなく hue=255（青系）。白は `fill(0, 0, 100)` または `fill(0, 0, 100, 255)`。

## 新レイヤーの追加手順

1. `src/layers/MyLayer.ts` を作成し `VisualLayer` を実装
2. `sketch.ts` の `layers[]` に追加
3. バッファは `setup()` で `p.createGraphics(p.width, p.height, p.P2D)` で生成
4. `resize()` でバッファ再生成

## 音声

マイク入力 → `SpectrumAnalyzer` → `AudioData.frequencies: Uint8Array`（FFT）。  
クリックで開始（ブラウザの autoplay 制限対応）。
