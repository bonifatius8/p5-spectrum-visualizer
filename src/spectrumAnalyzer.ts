import * as p5 from "p5";
import { applyAWeighting } from "./AweightingFilter"; // A特性フィルターを適用する関数をインポート

// p5.jsライブラリをインポート

export interface SpectrumAnalyzerData {
    /**
     * 周波数データを保持するインターフェース
     * frequencies: 0から255までの範囲の周波数データ
     * 例: [60, 140, 200, 80, ...]
     * 各要素は特定の周波数帯の振幅を表します。
     */
    frequencies: Uint8Array; // 各要素は特定の周波数帯の振幅を表します。0〜255の範囲の値を取ります。
}

/**
 * スペクトラムアナライザーを描画する関数
 * @param {p5.Graphics} g - p5.jsのグラフィックスオブジェクト
 * @param {SpectrumAnalyzerData} spectrumAnalyzerData - 周波数データ
 * @param {number} bands - 周波数帯の数 (例: 32, 64, 128)
 * @param {number} minDb - デシベルの最小値 (dB) (例: -80)
 * @param {number} maxDb - デシベルの最大値 (dB) (例: -20)
 * @param {number} displayScale - 表示スケール (例: 2)
 * @param {number} minAmplitude - 振幅の最小値 (例: 0.01)
 */
export const drawSpectrumAnalyzer = (
    g: p5.Graphics,
    spectrumAnalyzerData: SpectrumAnalyzerData,
    bands: number,
    minDb: number,
    maxDb: number,
    displayScale: number,
    minAmplitude: number
) => {
    // 描画設定
    g.erase();
    g.clear();
    g.noFill(); // 塗りつぶしを無効にする (矩形を描画する際に内部を透明にする)
    // g.stroke(Math.random() * 360, 100, 100, 0); // ストロークの色をランダムに設定 (HSBモード、色相をランダムに、彩度と明度を100%、透明度を0%に設定)
    // g.noStroke(); // ストロークを無効にする (線を描画しない)
    g.stroke(Math.random() * 360, 85, 30);
    g.strokeWeight(5); // ストロークの太さを設定

    // スペクトラムの描画
    g.beginShape(); // 図形の描画を開始

    for (let i = 0; i < bands; i++) {
        // 各周波数帯を処理
        // A特性フィルターを適用
        // 対数スケールで周波数を計算
        let frequency = Math.pow(
            2,
            map(i, 0, bands, Math.log2(20), Math.log2(20000))
        );
        let amplitude = map(
            spectrumAnalyzerData.frequencies[i],
            0,
            255,
            minAmplitude,
            1.0
        ); // 振幅をminAmplitudeから1.0の範囲にマッピング (周波数データの値を振幅に変換)

        amplitude = applyAWeighting(frequency, amplitude);

        if (amplitude < minAmplitude) {
            amplitude = minAmplitude;
        } // 振幅がminAmplitudeより小さい場合は、minAmplitudeに設定 (最小振幅を下回らないようにする)

        let db = 20 * (Math.log(amplitude) / Math.log(10)); // 振幅をデシベル(dB)に変換 (音の大きさを対数スケールで表現)
        db = Math.max(minDb, Math.min(maxDb, db)); // デシベルをminDbとmaxDbの間に制限 (表示範囲を調整)

        // 対数スケールに基づいてX座標を計算
        let x = map(
            Math.log2(frequency),
            Math.log2(20),
            Math.log2(20000),
            0,
            g.width
        );
        let y = g.height - map(db, minDb, maxDb, 0, g.height * displayScale); // Y座標を計算 (ピクセル単位、デシベル値を表示スケールに合わせて変換)

        g.vertex(x, y);
        // g.fill(255, 0, 60, 50);
        // g.circle(x, y, 30);

        let step = Math.ceil(g.height / 12); // ステップサイズを計算 (ピクセル単位、スペクトラムのバーの高さを分割)
        y = Math.ceil(y / step) * step; // Y座標をステップサイズで丸める (グリッド状にする、バーの表示を整える)
        let cc = Math.random() * 330; // 色相をランダムに設定
        let yy = y;
        // while (yy < g.height) {
        // Y座標がグラフィックスオブジェクトの高さより小さい間繰り返す (スペクトラムのバーを描画)
        // g.fill(
        //     cc + Math.random() * 25,
        //     100,
        //     100,
        //     80 - (80 * (yy - y)) / (g.height - y)
        // ); // 塗りつぶしの色を設定 (HSBモード、色相をランダムに、彩度と明度を100%、透明度を上から下に向かって減少)
        // g.rect(
        //     x + sw / 2,
        //     yy + sw / 2,
        //     g.width / bands - sw / 2,
        //     step - sw / 2
        // ); // 矩形を描画 (各周波数帯のバーを描画)
        // yy += step; // Y座標をステップサイズ分増加 (次のバーの位置を計算)
        // }
        // g.noFill(); // 塗りつぶしを無効にする (次の周波数帯の描画に影響を与えないようにする)
    }

    // g.vertex(
    //     g.width,
    //     g.height - map(minDb, minDb, maxDb, 0, g.height * displayScale)
    // );

    g.endShape(); // 図形の描画を終了

    /**
     * 値をある範囲から別の範囲にマッピングする関数
     * @param {number} n - マッピングする値
     * @param {number} start1 - 現在の範囲の開始値
     * @param {number} stop1 - 現在の範囲の終了値
     * @param {number} start2 - 新しい範囲の開始値
     * @param {number} stop2 - 新しい範囲の終了値
     * @returns {number} - マッピングされた値
     */
    function map(
        n: number,
        start1: number,
        stop1: number,
        start2: number,
        stop2: number
    ) {
        return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2; // マッピングの計算式
    }
}; // drawSpectrumAnalyzer関数の終わり

/**
 * スペクトラムアナライザーのデータを作成する関数
 * @param {Uint8Array} freqData - 周波数データ
 * @returns {SpectrumAnalyzerData} - スペクトラムアナライザーのデータ
 */
export const createSpectrumAnalyzerData = (
    freqData: Uint8Array
): SpectrumAnalyzerData => {
    return {
        frequencies: freqData, // 周波数データをSpectrumAnalyzerDataに格納 (生の周波数データをインターフェースに適合させる)
    };
}; // createSpectrumAnalyzerData関数の終わり
