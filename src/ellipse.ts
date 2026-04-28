import * as p5 from "p5";
import { EllipsePhysics } from "./ellipsePhysics";

// p5.jsライブラリをインポート
/**
 * @interface EllipseState
 * @description ellipseの状態を表すインターフェース
 * @property {number} currentBin - 現在の周波数帯のビン (X座標に対応)
 * @property {number} currentY - 現在のY座標
 * @property {number} size - ellipseのサイズ
 * @property {number} hue - ellipseの色相
 * @property {number} alpha - ellipseの透明度
 * @property {number} velocityX - 横方向の速度 (ビン単位)
 * @property {number} velocityY - 縦方向の速度 (ピクセル単位)
 * @property {number} smoothedAmplitude - 平滑化された振幅値 (表示に利用)
 * @property {number} lastReactionTime - 最後に周波数成分を強く受けた時のタイムスタンプ
 */
export interface EllipseState {
    /**
     * @property {number} currentBin - 現在の周波数帯のビン (X座標に対応)
     */
    currentBin: number;
    /**
     * @property {number} currentY - 現在のY座標
     */
    currentY: number;
    /**
     * @property {number} size - ellipseのサイズ
     */
    size: number;
    /**
     * @property {number} hue - ellipseの色相
     */
    hue: number;
    /**
     * @property {number} alpha - ellipseの透明度
     */
    alpha: number;
    /**
     * @property {number} velocityX - 横方向の速度 (ビン単位)
     */
    velocityX: number;
    /**
     * @property {number} velocityY - 縦方向の速度 (ピクセル単位)
     */
    velocityY: number;
    /**
     * @property {number} smoothedAmplitude - 平滑化された振幅値 (表示に利用)
     */
    smoothedAmplitude: number;
    /**
     * @property {number} lastReactionTime - 最後に周波数成分を強く受けた時のタイムスタンプ
     */
    lastReactionTime: number;
}

/**
 * @function drawFrequencyReactionEllipse
 * @description 周波数反応ellipseを描画する
 * @param {p5.Graphics} g - 描画対象のGraphicsオブジェクト
 * @param {EllipseState} ellipseData - 描画するellipseの状態
 * @param {number} bandWidth - 周波数帯の幅
 * @param {AudioContext} audioContext - オーディオコンテキスト
 * @param {AnalyserNode} analyser - 周波数解析ノード
 * @param {number} decayTimeout - 減衰タイムアウト値
 * @param {p5} p - p5インスタンス
 */
// 値をマッピングする関数
function map(
    n: number,
    start1: number,
    stop1: number,
    start2: number,
    stop2: number
) {
    return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}
export const drawFrequencyReactionEllipse = (
    g: p5.Graphics, // 描画対象のGraphicsオブジェクト
    ellipseData: EllipseState, // 描画するellipseの状態
    bands: number, // 周波数帯域数
    bandWidth: number, // 周波数帯の幅
    audioContext: AudioContext,
    analyser: AnalyserNode,
    decayTimeout: number, // 減衰タイムアウト値
    p: p5 // p5インスタンス
) => {
    // 振幅値を0から1の範囲にマッピング
    const mappedAmplitude = p.map(ellipseData.smoothedAmplitude, 0, 255, 0, 1);
    // 目標の色相値を計算
    const targetHue =
        (ellipseData.hue +
            p.map(ellipseData.smoothedAmplitude, 0, 1, 50, 100)) %
        360;
    // 目標の彩度を計算
    const targetSaturation = p.map(
        ellipseData.smoothedAmplitude,
        0,
        1,
        50,
        100
    );
    // 目標の明るさを計算
    const targetBrightness = p.map(
        ellipseData.smoothedAmplitude,
        0,
        1,
        50,
        100
    );
    // 目標の透明度を計算
    const targetAlpha = p.map(ellipseData.smoothedAmplitude, 0, 1, 100, 255);

    // 最後に周波数成分を強く受けてから一定時間経過した場合
    if (p.millis() - ellipseData.lastReactionTime > decayTimeout) {
        // ellipseのサイズを徐々に小さくする
        ellipseData.size = p.lerp(ellipseData.size, 20, 0.05);
        // ellipseの透明度を徐々に小さくする
        ellipseData.alpha = p.lerp(ellipseData.alpha, 50, 0.05);

        // ellipseの色相を徐々に変化させる
        ellipseData.hue = p.lerp(
            ellipseData.hue,
            (ellipseData.hue + 180) % 360,
            0.01
        );
        // 平滑化された振幅値を徐々に小さくする
        ellipseData.smoothedAmplitude = p.lerp(
            ellipseData.smoothedAmplitude,
            0,
            0.05
        );
    } else {
        // ellipseのサイズを振幅値に応じて大きくする
        ellipseData.size = p.lerp(
            ellipseData.size,
            p.map(ellipseData.smoothedAmplitude, 0, 255, 20, 150),
            0.1
        );
        // ellipseの透明度を目標値に近づける
        ellipseData.alpha = p.lerp(ellipseData.alpha, targetAlpha, 0.1);
        // ellipseの色相を目標値に近づける
        ellipseData.hue = p.lerp(ellipseData.hue, targetHue, 0.1);
    }

    // ellipseの色を設定
    g.fill(
        ellipseData.hue,
        targetSaturation,
        targetBrightness,
        ellipseData.alpha
    );
    // ellipseのストロークを無効化
    g.noStroke();
    // ellipseのX座標を計算
    let ellipseX = ellipseData.currentBin * bandWidth;

    // ellipseを描画
    g.ellipse(
        ellipseX,
        ellipseData.currentY,
        ellipseData.size,
        ellipseData.size
    );

    // if (audioContext && analyser) {
    //     const frequencyHz =
    //         (ellipseData.currentBin * audioContext.sampleRate) /
    //         analyser.fftSize;
    //     p.fill(255);
    //     p.textSize(16);
    //     p.textAlign(p.CENTER, p.BOTTOM);
    //     p.text(
    //         `${p.nf(frequencyHz, 0, 1)} Hz`,
    //         ellipseX,
    //         ellipseData.currentY - ellipseData.size / 2 - 5
    //     );
    // }
};

/**
 * @function updateEllipses
 * @description ellipseの状態を更新する
 * @param {p5.Graphics} g - 描画対象のGraphicsオブジェクト
 * @param {EllipseState[]} ellipseStates - ellipse状態配列
 * @param {boolean} wrapAround - ラップアラウンド有効フラグ
 * @param {number} bandWidth - 周波数帯の幅
 * @param {Uint8Array} freqData - 周波数解析データ
 * @param {AudioContext} audioContext - オーディオコンテキスト
 * @param {AnalyserNode} analyser - 周波数解析ノード
 * @param {number} minAmplitude - 最小振幅値
 * @param {number} minDb - 最小dB値
 * @param {number} maxDb - 最大dB値
 * @param {number} decayTimeout - 減衰タイムアウト値
 * @param {number} collisionInfluenceFactor - 衝突影響係数
 * @param {number} smoothingFactor - 平滑化係数
 * @param {number} bands - 周波数帯域数
 * @param {p5} p - p5.jsインスタンス
 */
export const updateEllipses = (
    g: p5.Graphics, // 描画対象のGraphicsオブジェクト
    ellipseStates: EllipseState[], // ellipse状態配列
    wrapAround: boolean, // ラップアラウンド有効フラグ
    bandWidth: number, // 周波数帯の幅
    freqData: Uint8Array, // 周波数解析データ
    audioContext: AudioContext,
    analyser: AnalyserNode, // 周波数解析ノード
    minAmplitude: number, // 最小振幅値
    minDb: number, // 最小dB値
    maxDb: number, // 最大dB値
    decayTimeout: number, // 減衰タイムアウト値
    collisionInfluenceFactor: number, // 衝突影響係数
    smoothingFactor: number, // 平滑化係数
    bands: number, // 周波数帯域数
    p: p5 // p5.jsインスタンス
) => {
    const ellipsePhysics = new EllipsePhysics();
    // ellipse状態配列をループ
    for (const ellipse of ellipseStates) {
        ellipsePhysics.update(
            g,
            ellipse,
            wrapAround,
            bandWidth,
            freqData,
            minAmplitude,
            minDb,
            maxDb,
            decayTimeout,
            collisionInfluenceFactor,
            p
        );

        // 表示用の現在の振幅値を初期化
        let currentAmplitudeForDisplay = 0;
        // 振幅値の現在のビンを計算
        const currentBinForAmplitude = Math.max(
            0,
            Math.min(bands - 1, Math.floor(ellipse.currentBin))
        );

        // 振幅値の現在のビンが有効な範囲の場合
        if (
            currentBinForAmplitude >= 0 &&
            currentBinForAmplitude < freqData.length
        ) {
            // 表示用の現在の振幅値を設定
            currentAmplitudeForDisplay = freqData[currentBinForAmplitude];
        }

        // 平滑化された振幅値を更新
        ellipse.smoothedAmplitude = lerp(
            ellipse.smoothedAmplitude,
            currentAmplitudeForDisplay,
            smoothingFactor
        );

        // 最後に周波数成分を強く受けてから一定時間経過した場合
        if (p.millis() - ellipse.lastReactionTime > decayTimeout) {
            // ellipse.size *= 0.99;
            // ellipse.alpha *= 0.99;
            // ellipse.size = Math.max(ellipse.size, 5);
            // ellipse.alpha = Math.max(ellipse.alpha, 1);
        }

        // 周波数反応ellipseを描画
        drawFrequencyReactionEllipse(
            g,
            ellipse,
            bands,
            bandWidth,
            audioContext,
            analyser,
            decayTimeout,
            p
        );
    }

    // 値をマッピングする関数
    function map(
        n: number,
        start1: number,
        stop1: number,
        start2: number,
        stop2: number
    ) {
        return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
    }

    // 値を線形補間する関数
    function lerp(start: number, stop: number, amt: number) {
        return start + (stop - start) * amt;
    }
};
