// generate-diagrams.js
const fs = require('fs');

const DARK_BG = '#0d0d1a';

function binColor(i, total = 20) {
    const hue = Math.round((i / (total - 1)) * 256);
    return `hsl(${hue},85%,58%)`;
}

// ── SVG 1: 対数ビン vs 線形ビン ──────────────────────────────
function freqBinsSVG() {
    const W = 760, H = 240;
    const BAR_W = 35, BAR_H = 70, LOG_X = 20, LOG_Y = 28;
    const LIN_X = 20, LIN_Y = 158, LIN_W = 720, LIN_H = 45;

    const binHz = [8,12,17,23,33,47,66,94,133,188,265,375,530,750,1060,1500,2120,3000,4240,6000];
    const totalHz = binHz.reduce((a, b) => a + b, 0);
    const scale = LIN_W / totalHz;

    let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:${DARK_BG};border-radius:8px">
<style>text{font-family:ui-monospace,monospace,sans-serif}</style>
<text x="20" y="16" font-size="11" fill="#777">対数スケール（実装）— 各ビン = 1オクターブ幅</text>`;

    const keyLabels = { 0: '20Hz', 9: '500Hz', 14: '3kHz', 19: '20kHz' };
    for (let i = 0; i < 20; i++) {
        const x = LOG_X + i * (BAR_W + 1);
        out += `<rect x="${x}" y="${LOG_Y}" width="${BAR_W}" height="${BAR_H}" fill="${binColor(i)}" rx="2"/>`;
        if (keyLabels[i] !== undefined) {
            out += `<text x="${x + BAR_W / 2}" y="${LOG_Y + BAR_H + 13}" text-anchor="middle" font-size="9" fill="#666">${keyLabels[i]}</text>`;
        }
    }

    out += `<text x="20" y="148" font-size="11" fill="#777">線形スケール（比較）— 低域ビンが画面上でほぼ消える</text>`;
    let cx = LIN_X;
    for (let i = 0; i < 20; i++) {
        const w = Math.max(1, Math.round(binHz[i] * scale));
        out += `<rect x="${cx}" y="${LIN_Y}" width="${w}" height="${LIN_H}" fill="${binColor(i)}" rx="1"/>`;
        cx += w;
    }

    const end15 = LIN_X + Math.round(binHz.slice(0, 15).reduce((a, b) => a + b, 0) * scale);
    out += `<line x1="${end15}" y1="${LIN_Y - 4}" x2="${end15}" y2="${LIN_Y + LIN_H + 4}" stroke="#fff" stroke-width="1" stroke-dasharray="3,2" opacity="0.3"/>`;
    out += `<text x="${LIN_X + 4}" y="${LIN_Y + LIN_H + 16}" font-size="9" fill="#666">ビン1-15（〜3.6kHz） ≈ 幅の18%</text>`;
    out += `<text x="${end15 + 4}" y="${LIN_Y + LIN_H + 16}" font-size="9" fill="#666">ビン16-20（3.6kHz〜） ≈ 幅の82%</text>`;

    return out + `</svg>`;
}

// ── SVG 2: 色相マッピング ─────────────────────────────────────
function hueColorSVG() {
    const W = 760, H = 175;

    let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:${DARK_BG};border-radius:8px">
<style>text{font-family:ui-monospace,monospace,sans-serif}</style>
<defs>
  <linearGradient id="gl" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="hsl(0,90%,30%)"/>
    <stop offset="100%" stop-color="hsl(20,90%,52%)"/>
  </linearGradient>
  <linearGradient id="gm" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="hsl(90,80%,30%)"/>
    <stop offset="100%" stop-color="hsl(130,80%,52%)"/>
  </linearGradient>
  <linearGradient id="gh" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="hsl(220,85%,38%)"/>
    <stop offset="100%" stop-color="hsl(270,85%,58%)"/>
  </linearGradient>
</defs>`;

    const BY = 38, BH = 78;
    const bands = [
        { label: '低域  < 500Hz', sublabel: 'bias 0 → 赤系', grad: 'gl', x: 20,  w: 210 },
        { label: '中域  500Hz – 4kHz', sublabel: 'bias 100 → 緑系', grad: 'gm', x: 250, w: 255 },
        { label: '高域  > 4kHz', sublabel: 'bias 250 → 青紫系', grad: 'gh', x: 525, w: 215 },
    ];

    for (const b of bands) {
        out += `<rect x="${b.x}" y="${BY}" width="${b.w}" height="${BH}" fill="url(#${b.grad})" rx="4"/>`;
        out += `<text x="${b.x + b.w / 2}" y="${BY - 9}" text-anchor="middle" font-size="11" fill="#999">${b.label}</text>`;
        out += `<text x="${b.x + b.w / 2}" y="${BY + BH + 17}" text-anchor="middle" font-size="11" fill="#777">${b.sublabel}</text>`;
    }

    out += `<text x="${W / 2}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#555">3帯域のエネルギー比で加重平均 → 全20円の色相オフセットとして毎フレーム適用</text>`;

    return out + `</svg>`;
}

// ── SVG 3: 回転方向 ───────────────────────────────────────────
function rotationSVG() {
    const W = 520, H = 240;
    const cx = W / 2, cy = H / 2 - 5;
    const r = 78;

    let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:${DARK_BG};border-radius:8px">
<style>text{font-family:ui-monospace,monospace,sans-serif}</style>
<defs>
  <marker id="ar" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
    <polygon points="0 0,8 3,0 6" fill="#ff6b6b"/>
  </marker>
  <marker id="ab" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
    <polygon points="0 0,8 3,0 6" fill="#6b9fff"/>
  </marker>
</defs>`;

    // 同心円
    for (let i = 4; i >= 1; i--) {
        const ri = r * i / 4;
        const hue = Math.round(((4 - i) / 3) * 200);
        out += `<circle cx="${cx}" cy="${cy}" r="${ri}" stroke="hsl(${hue},70%,55%)" stroke-width="1.5" fill="none" opacity="0.55"/>`;
    }

    // 低域: 時計回り弧（左上→右）
    out += `<path d="M ${cx} ${cy - r - 18} A ${r + 18} ${r + 18} 0 0 1 ${cx + r + 18} ${cy}" stroke="#ff6b6b" stroke-width="2" fill="none" marker-end="url(#ar)"/>`;
    out += `<text x="${cx - 70}" y="${cy - r - 22}" font-size="12" fill="#ff8888">低域 &lt; 2500Hz</text>`;
    out += `<text x="${cx - 70}" y="${cy - r - 8}" font-size="11" fill="#aa5555">＋ 正方向に寄与</text>`;

    // 高域: 反時計回り弧（右下→左）
    out += `<path d="M ${cx} ${cy + r + 18} A ${r + 18} ${r + 18} 0 0 1 ${cx - r - 18} ${cy}" stroke="#6b9fff" stroke-width="2" fill="none" marker-end="url(#ab)"/>`;
    out += `<text x="${cx + 20}" y="${cy + r + 24}" font-size="12" fill="#8888ff">高域 ≥ 2500Hz</text>`;
    out += `<text x="${cx + 20}" y="${cy + r + 38}" font-size="11" fill="#5555aa">－ 逆方向に寄与</text>`;

    out += `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#555">帯域バランスで回転方向・速度がリアルタイムに変化</text>`;

    return out + `</svg>`;
}

// ── SVG 4: 振幅正規化 ─────────────────────────────────────────
function normalizationSVG() {
    const W = 760, H = 200;
    const BAR_W = 28, BOTTOM = 150, MAX_H = 110;
    const BINS = 20;
    const GAP = (W - 40 - BINS * BAR_W * 2 - 40) / (BINS - 1);
    const SECTION_W = BAR_W * 2 + GAP;

    // 仮の「生FFT振幅」— 低域強・高域弱（実際の音声特性を模倣）
    const rawAmps = Array.from({ length: BINS }, (_, i) => {
        const t = i / (BINS - 1);
        return 0.85 - t * 0.70 + Math.sin(t * 3.5) * 0.08;
    });

    // 正規化後 — 全帯域ほぼ均等
    const normAmps = Array.from({ length: BINS }, (_, i) => {
        const t = i / (BINS - 1);
        return 0.55 + Math.sin(t * 4.2 + 1) * 0.12;
    });

    let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:${DARK_BG};border-radius:8px">
<style>text{font-family:ui-monospace,monospace,sans-serif}</style>`;

    const labelY = 16;
    out += `<text x="20" y="${labelY}" font-size="11" fill="#777">生FFT振幅 — 低域に偏る</text>`;
    out += `<text x="${W / 2 + 10}" y="${labelY}" font-size="11" fill="#777">移動平均正規化後 — 全帯域均等に寄与</text>`;

    // 中央区切り線
    out += `<line x1="${W / 2}" y1="22" x2="${W / 2}" y2="${BOTTOM + 10}" stroke="#333" stroke-width="1" stroke-dasharray="4,3"/>`;
    out += `<text x="${W / 2}" y="${BOTTOM + 24}" text-anchor="middle" font-size="18" fill="#444">→</text>`;

    for (let i = 0; i < BINS; i++) {
        const color = binColor(i);
        const rawH = Math.round(rawAmps[i] * MAX_H);
        const normH = Math.round(normAmps[i] * MAX_H);

        // 左: 生振幅
        const lx = 20 + i * (BAR_W + 1);
        out += `<rect x="${lx}" y="${BOTTOM - rawH}" width="${BAR_W}" height="${rawH}" fill="${color}" opacity="0.85" rx="2"/>`;

        // 右: 正規化後
        const rx = W / 2 + 20 + i * (BAR_W + 1);
        out += `<rect x="${rx}" y="${BOTTOM - normH}" width="${BAR_W}" height="${normH}" fill="${color}" opacity="0.85" rx="2"/>`;
    }

    // 軸ラベル
    out += `<text x="20" y="${BOTTOM + 14}" font-size="9" fill="#555">20Hz</text>`;
    out += `<text x="${W / 2 - 45}" y="${BOTTOM + 14}" font-size="9" fill="#555">20kHz</text>`;
    out += `<text x="${W / 2 + 20}" y="${BOTTOM + 14}" font-size="9" fill="#555">20Hz</text>`;
    out += `<text x="${W - 55}" y="${BOTTOM + 14}" font-size="9" fill="#555">20kHz</text>`;

    return out + `</svg>`;
}

fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/freq_bins.svg', freqBinsSVG());
fs.writeFileSync('docs/hue_color.svg', hueColorSVG());
fs.writeFileSync('docs/rotation.svg', rotationSVG());
fs.writeFileSync('docs/normalization.svg', normalizationSVG());
console.log('SVGs generated: docs/freq_bins.svg, docs/hue_color.svg, docs/rotation.svg, docs/normalization.svg');
