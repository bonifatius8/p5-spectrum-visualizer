import * as p5 from "p5";
import { EllipseState } from "./ellipse";

/**
 * @class EllipsePhysics
 * @description ellipseの物理シミュレーションを行うクラス
 */
export class EllipsePhysics {
    /**
     * @function update
     * @description ellipseの状態を更新する
     * @param {p5.Graphics} g - 描画対象のGraphicsオブジェクト
     * @param {EllipseState} ellipse - ellipse状態
     * @param {boolean} wrapAround - ラップアラウンド有効フラグ
     * @param {number} bandWidth - 周波数帯の幅
     * @param {Uint8Array} freqData - 周波数解析データ
     * @param {number} minAmplitude - 最小振幅値
     * @param {number} minDb - 最小dB値
     * @param {number} maxDb - 最大dB値
     * @param {number} decayTimeout - 減衰タイムアウト値
     * @param {number} collisionInfluenceFactor - 衝突影響係数
     * @param {number} p - p5.jsインスタンス
     */
    update(
        g: p5.Graphics,
        ellipse: EllipseState,
        wrapAround: boolean,
        bandWidth: number,
        freqData: Uint8Array,
        minAmplitude: number,
        minDb: number,
        maxDb: number,
        decayTimeout: number,
        collisionInfluenceFactor: number,
        p: p5
    ) {
        // ellipseのX座標を更新
        ellipse.currentBin += ellipse.velocityX;
        // ellipseのY座標を更新
        ellipse.currentY += ellipse.velocityY;

        // ラップアラウンドが有効な場合
        if (wrapAround) {
            // ellipseのX座標を計算
            const ellipseX = ellipse.currentBin * bandWidth;
            // ellipseが画面右端を超えた場合
            if (ellipseX > g.width) {
                // ellipseのX座標を0に戻す
                ellipse.currentBin = 0;
            } else if (ellipseX < 0) {
                // ellipseが画面左端を超えた場合
                ellipse.currentBin = g.width / bandWidth;
            }
            // ellipseが画面下端を超えた場合
            if (ellipse.currentY > g.height) {
                // ellipseのY座標を0に戻す
                ellipse.currentY = 0;
            } else if (ellipse.currentY < 0) {
                // ellipseが画面上端を超えた場合
                ellipse.currentY = g.height;
            }
        }

        // ellipseのX座標を計算
        const ellipseX = ellipse.currentBin * bandWidth;
        // スペクトラムのビンインデックスを計算
        const spectrumBinIndex = Math.max(
            0,
            Math.min(freqData.length - 1, Math.floor(ellipseX / bandWidth))
        );
        // スペクトラムの振幅値を初期化
        let spectrumAmplitude = 0;
        // スペクトラムのビンインデックスが有効な範囲の場合
        if (spectrumBinIndex >= 0 && spectrumBinIndex < freqData.length) {
            // スペクトラムの振幅値を設定
            spectrumAmplitude = freqData[spectrumBinIndex];
        }

        // スペクトラムのdB値を計算
        let spectrumDb =
            20 *
            (Math.log(this.map(spectrumAmplitude, 0, 255, minAmplitude, 1.0)) /
                Math.log(10));
        // スペクトラムのdB値を最小値と最大値の間に制限
        spectrumDb = Math.max(minDb, Math.min(maxDb, spectrumDb));
        // スペクトラムのY座標を計算
        const spectrumY = this.map(spectrumDb, minDb, maxDb, g.height, 0);

        // ellipseの下端のY座標を計算
        const ellipseBottomY = ellipse.currentY + ellipse.size / 2;
        // ellipseの上端のY座標を計算
        const ellipseTopY = ellipse.currentY - ellipse.size / 2;

        // ellipseがスペクトラムに衝突した場合
        if (ellipseBottomY > spectrumY && ellipseTopY < spectrumY) {
            // 左側の振幅値を初期化
            let amplitudeLeft = 0;
            // スペクトラムのビンインデックスが0より大きい場合
            if (spectrumBinIndex > 0) {
                // 左側の振幅値を設定
                amplitudeLeft = freqData[spectrumBinIndex - 1];
            }
            // 右側の振幅値を初期化
            let amplitudeRight = 0;
            // スペクトラムのビンインデックスがfreqData.length - 1より小さい場合
            if (spectrumBinIndex < freqData.length - 1) {
                // 右側の振幅値を設定
                amplitudeRight = freqData[spectrumBinIndex + 1];
            }
            // 振幅値の差を計算
            const amplitudeDiff = amplitudeRight - amplitudeLeft;

            // 影響係数を計算
            const influenceFactor =
                collisionInfluenceFactor / (ellipse.size / 20);
            // ellipseのX方向の速度を更新
            ellipse.velocityX += this.map(
                amplitudeDiff,
                -255,
                255,
                -influenceFactor,
                influenceFactor
            );

            // 正規化されたスペクトラムのY座標を計算
            const normalizedSpectrumY = this.map(spectrumY, 0, g.height, 1, 0);
            // ellipseのY方向の速度を更新
            ellipse.velocityY -=
                collisionInfluenceFactor *
                normalizedSpectrumY *
                this.map(spectrumAmplitude, 0, 255, 0.1, 1);

            // 最後に周波数成分を強く受けた時のタイムスタンプを更新
            ellipse.lastReactionTime = p.millis();
        }
    }

    /**
     * @function map
     * @description 値をマッピングする
     * @param {number} n - マッピングする値
     * @param {number} start1 - 入力値の最小値
     * @param {number} stop1 - 入力値の最大値
     * @param {number} start2 - 出力値の最小値
     * @param {number} stop2 - 出力値の最大値
     * @returns {number} - マッピングされた値
     */
    private map(
        n: number,
        start1: number,
        stop1: number,
        start2: number,
        stop2: number
    ): number {
        return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
    }
}
