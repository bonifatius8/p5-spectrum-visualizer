// concentricCircles.ts
// このファイルは、オーディオの周波数データに基づいて同心円の視覚化を生成するロジックを定義します。
// データ計算と描画ロジックが分離され、コードの可読性と保守性が向上しています。

import p5 from "p5";
import { applyMovingAverageWeighting } from "./movingAverageFilter"; // 適切なフィルター関数をインポート
import { Config } from "./sketchConfig"; // sketchConfig.tsからConfigをインポート (変更箇所)

// dir オブジェクトはモジュールスコープに置き、rotateDirectionはラジアンの増分を引数に取る
const dir = {
    max: Math.PI * 2,
    pre: 0, // Not used in current code
    rad: 0,
    rotateDirection: (deltaRad: number) => {
        // deltaRad を直接加算
        dir.rad = (dir.rad + deltaRad) % dir.max;
        if (dir.rad < 0) {
            // JavaScriptの%演算子は負の結果を返す場合があるため、補正
            dir.rad += dir.max;
        }
        return dir.rad;
    },
};

// 前フレームの各円の重み付けされた振幅を保存する配列
// concentricCircles関数が呼び出されるたびにリセットされないように、calculateCircleDataの外、
// またはconcentricCircles関数のスコープで管理するのが適切です。
// ここでは簡単のため、グローバルに近いスコープに置きますが、
// アプリケーションの構造によってはより適切な場所に移動してください。
let previousWeightedAmplitudes: number[] = [];

// calculateCircleData: 回転量の合計と、全体の色相オフセット、各円の音量変動量を返すように変更
// sampleRateを直接引数として受け取るように変更
const calculateCircleData = (
    spectrum: Uint8Array,
    bands: number, // FFTの実際のビン数（例: 1024）
    numCircles: number, // 表示に使いたいビンの数（例: 20）
    sampleRate: number, // AudioContextのsampleRateを直接受け取るのだ
    p: p5 // p5インスタンスを受け取るのだ
) => {
    // sampleRateが不正な値の場合の早期リターン
    if (sampleRate <= 0 || isNaN(sampleRate)) {
        console.warn(
            "Invalid sampleRate provided to calculateCircleData. Returning default data."
        );
        // previousWeightedAmplitudes の初期化もここで行うか、呼び出し側でケアが必要
        if (previousWeightedAmplitudes.length !== numCircles) {
            previousWeightedAmplitudes = new Array(numCircles).fill(0);
        }
        return {
            circleData: Array(numCircles).fill({
                amplitude: 0,
                weighted: 0,
                color: 0,
                frequency: 0,
                amplitudeChange: 0, // 変動量も0で初期化
            }),
            totalRotationDelta: 0,
            totalHueOffset: 0,
        };
    }

    const numDisplayBins = numCircles;
    const minDisplayFreq = Config.CONCENTRIC_CIRCLES.MIN_DISPLAY_FREQ; // Configから取得 (変更箇所)
    const maxDisplayFreq = Config.CONCENTRIC_CIRCLES.MAX_DISPLAY_FREQ; // Configから取得 (変更箇所)

    const displayBinFrequencies: { min: number; max: number }[] = [];
    const logMinFreq = Math.log2(minDisplayFreq);
    const logMaxFreq = Math.log2(maxDisplayFreq);
    const logStep = (logMaxFreq - logMinFreq) / numDisplayBins;

    for (let i = 0; i < numDisplayBins; i++) {
        const minF = Math.pow(2, logMinFreq + i * logStep);
        const maxF = Math.pow(2, logMinFreq + (i + 1) * logStep);
        displayBinFrequencies.push({ min: minF, max: maxF });
    }

    const auditorySpectrum: number[] = new Array(numDisplayBins).fill(0);
    const binCounts: number[] = new Array(numDisplayBins).fill(0);

    const EPSILON = Config.CONCENTRIC_CIRCLES.EPSILON; // Configから取得 (変更箇所)

    const fftBinWidth = sampleRate / 2 / bands; // 各FFTビンの周波数幅

    // 各FFTビンがどの表示用ビンにどれだけ貢献するかを計算
    for (let i = 0; i < bands; i++) {
        // bandsは1024 (FFTビンの総数)
        const fftBinStartFreq = i * fftBinWidth;
        const fftBinEndFreq = (i + 1) * fftBinWidth;

        for (let j = 0; j < numDisplayBins; j++) {
            // 20個の表示用ビンをループ
            const displayMinF = displayBinFrequencies[j].min;
            const displayMaxF = displayBinFrequencies[j].max;

            // FFTビンと表示用ビンの周波数範囲の重なりを計算
            const overlapStart = Math.max(displayMinF, fftBinStartFreq);
            const overlapEnd = Math.min(displayMaxF, fftBinEndFreq);

            // 重なりがある場合
            if (overlapEnd > overlapStart + EPSILON) {
                // EPSILONで浮動小数点誤差を考慮
                const overlapAmount = overlapEnd - overlapStart;
                const contributionRatio = overlapAmount / fftBinWidth; // FFTビンがこの表示用ビンに貢献する割合

                auditorySpectrum[j] += spectrum[i] * contributionRatio; // 振幅を割合に応じて加算
                binCounts[j] += contributionRatio; // 貢献度をカウント
            }
        }
    }

    // 各表示用ビンの平均振幅を計算（貢献度で正規化）
    for (let j = 0; j < numDisplayBins; j++) {
        if (binCounts[j] > EPSILON) {
            // 貢献度がEPSILONより大きい場合のみ平均化
            auditorySpectrum[j] /= binCounts[j];
        } else {
            auditorySpectrum[j] = 0; // 割り当てられたFFTビンがなければ0
        }
    }

    const circleData = [];
    let totalRotationDelta = 0;

    const middleFrequency =
        Config.CONCENTRIC_CIRCLES.MIDDLE_FREQUENCY_THRESHOLD; // Configから取得 (変更箇所)
    const lowFreqRotationFactor =
        Config.CONCENTRIC_CIRCLES.LOW_FREQ_ROTATION_FACTOR; // Configから取得 (変更箇所)
    const highFreqRotationFactor =
        Config.CONCENTRIC_CIRCLES.HIGH_FREQ_ROTATION_FACTOR; // Configから取得 (変更箇所)

    let lowBandEnergy = 0;
    let midBandEnergy = 0;
    let highBandEnergy = 0;

    const LOW_FREQ_THRESHOLD = Config.CONCENTRIC_CIRCLES.LOW_FREQ_HUE_THRESHOLD; // Configから取得 (変更箇所)
    const HIGH_FREQ_THRESHOLD =
        Config.CONCENTRIC_CIRCLES.HIGH_FREQ_HUE_THRESHOLD; // Configから取得 (変更箇所)

    // previousWeightedAmplitudesの初期化またはサイズ調整
    if (previousWeightedAmplitudes.length !== numDisplayBins) {
        previousWeightedAmplitudes = new Array(numDisplayBins).fill(0);
    }

    const currentFrameWeightedAmplitudes: number[] = []; // このフレームの値を一時保存

    for (let i = 0; i < numDisplayBins; i++) {
        const amplitude = auditorySpectrum[i] / 255;
        const frequency =
            (displayBinFrequencies[i].min + displayBinFrequencies[i].max) / 2;
        const weighted = applyMovingAverageWeighting(frequency, amplitude);

        // 音量の変動量を計算
        const previousWeighted = previousWeightedAmplitudes[i] || 0; // 前フレームの値 (初回は0)
        const amplitudeChange = weighted - previousWeighted;
        currentFrameWeightedAmplitudes.push(weighted); // 現在の値を保存

        if (frequency < middleFrequency) {
            totalRotationDelta += weighted * lowFreqRotationFactor;
        } else {
            totalRotationDelta -= weighted * highFreqRotationFactor;
        }

        if (frequency < LOW_FREQ_THRESHOLD) {
            lowBandEnergy += weighted;
        } else if (
            frequency >= LOW_FREQ_THRESHOLD &&
            frequency < HIGH_FREQ_THRESHOLD
        ) {
            midBandEnergy += weighted;
        } else {
            highBandEnergy += weighted;
        }

        circleData.push({
            amplitude: amplitude,
            weighted: weighted,
            color: (360 / numDisplayBins) * i,
            frequency: frequency,
            amplitudeChange: amplitudeChange, // 計算した変動量を追加
        });
    }

    // 次のフレームのために現在の値を保存
    previousWeightedAmplitudes = [...currentFrameWeightedAmplitudes];

    let totalHueOffset = 0;
    const totalEnergy = lowBandEnergy + midBandEnergy + highBandEnergy;

    if (totalEnergy > 0) {
        const lowRatio = lowBandEnergy / totalEnergy;
        const midRatio = midBandEnergy / totalEnergy;
        const highRatio = highBandEnergy / totalEnergy;

        const lowHueBias = Config.CONCENTRIC_CIRCLES.LOW_HUE_BIAS; // Configから取得 (変更箇所)
        const midHueBias = Config.CONCENTRIC_CIRCLES.MID_HUE_BIAS; // Configから取得 (変更箇所)
        const highHueBias = Config.CONCENTRIC_CIRCLES.HIGH_HUE_BIAS; // Configから取得 (変更箇所)

        totalHueOffset =
            lowRatio * lowHueBias +
            midRatio * midHueBias +
            highRatio * highHueBias;

        const hueSensitivity = Config.CONCENTRIC_CIRCLES.HUE_SENSITIVITY; // Configから取得 (変更箇所)
        totalHueOffset *= hueSensitivity;
        totalHueOffset = ((totalHueOffset % 360) + 360) % 360;
    }

    return {
        circleData: circleData,
        totalRotationDelta: totalRotationDelta,
        totalHueOffset: totalHueOffset,
    };
};

// Define the type for the return value of concentricCircles
export interface ConcentricCirclesResult {
    circleData: {
        amplitude: number;
        weighted: number;
        color: number;
        frequency: number;
        amplitudeChange: number;
    }[];
    totalRotationDelta: number;
    totalHueOffset: number;
}

/**
 * 単一の同心円を描画します。
 * @param g 描画対象のp5.Graphicsバッファ
 * @param p p5インスタンス
 * @param circleData 描画する円のデータ
 * @param radius 円の半径
 * @param totalHueOffset 全体的な色相オフセット
 * @param baseStrokeWeight 基本の線の太さ
 */
const drawSingleConcentricCircle = (
    g: p5.Graphics,
    p: p5,
    circleData: {
        amplitude: number;
        weighted: number;
        color: number;
        amplitudeChange: number;
    },
    radius: number,
    totalHueOffset: number,
    baseStrokeWeight: number
) => {
    const width = radius * circleData.weighted + 10; // 半径と重み付けされた振幅から幅を決定

    g.strokeWeight(
        width / 100 +
            baseStrokeWeight *
                (circleData.amplitude *
                    Config.CONCENTRIC_CIRCLES.AMPLITUDE_STROKE_WEIGHT_FACTOR + // Configから取得 (変更箇所)
                    Config.CONCENTRIC_CIRCLES.MIN_STROKE_WEIGHT_OFFSET) // Configから取得 (変更箇所)
    );

    const adjustedHue = (circleData.color + totalHueOffset) % 360;
    const finalHue = adjustedHue < 0 ? adjustedHue + 360 : adjustedHue;

    let currentSaturation = p.constrain(
        circleData.amplitude *
            Config.CONCENTRIC_CIRCLES.AMPLITUDE_SATURATION_FACTOR + // Configから取得 (変更箇所)
            Config.CONCENTRIC_CIRCLES.BASE_SATURATION, // Configから取得 (変更箇所)
        0,
        100
    );
    let currentBrightness = p.constrain(
        circleData.amplitude *
            Config.CONCENTRIC_CIRCLES.AMPLITUDE_BRIGHTNESS_FACTOR + // Configから取得 (変更箇所)
            Config.CONCENTRIC_CIRCLES.BASE_BRIGHTNESS, // Configから取得 (変更箇所)
        0,
        100
    );
    let currentAlpha = p.constrain(
        circleData.amplitude *
            Config.CONCENTRIC_CIRCLES.AMPLITUDE_ALPHA_FACTOR + // Configから取得 (変更箇所)
            Config.CONCENTRIC_CIRCLES.BASE_ALPHA, // Configから取得 (変更箇所)
        0,
        255
    );

    g.stroke(finalHue, currentSaturation, currentBrightness, currentAlpha);
    g.noFill();

    // dir.rad を使用して回転を適用し、円の位置を決定
    g.ellipse(
        Math.cos(dir.rad) *
            circleData.amplitude *
            (radius / Config.CONCENTRIC_CIRCLES.MIN_RADIUS) * // Configから取得 (変更箇所)
            Config.CONCENTRIC_CIRCLES.AMPLITUDE_ELLIPSE_OFFSET_FACTOR, // Configから取得 (変更箇所)
        Math.sin(dir.rad) *
            circleData.amplitude *
            (radius / Config.CONCENTRIC_CIRCLES.MIN_RADIUS) * // Configから取得 (変更箇所)
            Config.CONCENTRIC_CIRCLES.AMPLITUDE_ELLIPSE_OFFSET_FACTOR, // Configから取得 (変更箇所)
        width,
        width
    );

    g.push();
    g.blendMode(p.REMOVE);
    g.rotate(dir.rad * circleData.amplitude * 199); // dir.rad を使用して回転を適用

    g.strokeWeight(
        baseStrokeWeight *
            (circleData.amplitude *
                Config.CONCENTRIC_CIRCLES.RECT_STROKE_WEIGHT_AMPLITUDE_FACTOR + // Configから取得 (変更箇所)
                Math.abs(dir.rad) *
                    Config.CONCENTRIC_CIRCLES.RECT_STROKE_WEIGHT_RAD_FACTOR) // Configから取得 (変更箇所)
    );

    const adjustedRectHue = (200 - circleData.color + totalHueOffset) % 360;
    const finalRectHue =
        adjustedRectHue < 0 ? adjustedRectHue + 360 : adjustedRectHue;

    g.stroke(finalRectHue, 0, 0, 255);

    g.rect(-width / 2, -width / 2, width, width);
    g.blendMode(p.BLEND);
    g.pop();
};

export const concentricCircles = (
    g: p5.Graphics,
    spectrum: Uint8Array,
    bands: number,
    p: p5,
    sampleRate: number // AudioContextのsampleRateを直接受け取るのだ
): ConcentricCirclesResult | null => {
    const centerX = g.width / 2;
    const centerY = g.height / 2;
    const numCircles = Config.CONCENTRIC_CIRCLES.NUM_VISUAL_RINGS; // Configから取得 (変更箇所)
    const minRadius = Config.CONCENTRIC_CIRCLES.MIN_RADIUS; // Configから取得 (変更箇所)
    const margin =
        Math.min(g.width, g.height) * Config.CONCENTRIC_CIRCLES.MARGIN_RATIO; // Configから取得 (変更箇所)
    const circleRadii = [];

    const circleStep =
        (Math.min(g.width, g.height) - minRadius - margin) / numCircles;

    for (let i = 0; i < numCircles; i++) {
        circleRadii.push(centerY - i * circleStep);
    }
    g.clear();
    g.translate(centerX, centerY);

    // calculateCircleDataから全ての必要なデータを取得
    const {
        circleData,
        totalRotationDelta: currentFrameRotation,
        totalHueOffset,
    } = calculateCircleData(spectrum, bands, numCircles, sampleRate, p); // numCirclesを渡す

    if (!circleData || circleData.length === 0) {
        console.warn(
            "circleData is empty or undefined. Skipping concentricCircles draw."
        );
        return null; // Return null if no data
    }

    const baseRotationSpeed = Config.CONCENTRIC_CIRCLES.BASE_ROTATION_SPEED; // Configから取得 (変更箇所)
    const finalRotationDelta = currentFrameRotation + baseRotationSpeed;
    dir.rotateDirection(finalRotationDelta); // Update global rotation state

    const baseStrokeWeight =
        Math.min(g.width, g.height) *
        Config.CONCENTRIC_CIRCLES.BASE_STROKE_WEIGHT_RATIO; // Configから取得 (変更箇所)

    for (let i = 0; i < numCircles; i++) {
        const currentCircleData = circleData[i];
        if (!currentCircleData) {
            continue;
        }

        // drawSingleConcentricCircleヘルパー関数を呼び出す
        drawSingleConcentricCircle(
            g,
            p,
            currentCircleData,
            circleRadii[i],
            totalHueOffset,
            baseStrokeWeight
        );
    }
    // Return all calculated data
    return {
        circleData,
        totalRotationDelta: finalRotationDelta,
        totalHueOffset,
    };
};
