// sketchDebugInfo.ts
// このファイルは、P5.jsスケッチのデバッグ情報（マイク名、音量、振幅変化など）の描画ロジックをカプセル化します。
// これにより、メインのスケッチファイルが簡潔になり、情報表示の管理が容易になります。

import * as p5 from "p5";
import { ConcentricCirclesResult } from "./concentricCircles";

/**
 * デバッグ情報をP5.jsのグラフィックバッファに描画します。
 * マイク名、現在の音量、同心円の振幅変化データを表示します。
 * @param p p5インスタンス
 * @param textBuffer テキスト描画用のp5.Graphicsバッファ
 * @param microphoneName 現在使用中のマイクの名前
 * @param volume 現在の全体の音量
 * @param concentricCirclesResult 同心円の計算結果データ（振幅変化を含む）
 */
export const drawDebugInfo = (
    p: p5,
    textBuffer: p5.Graphics,
    microphoneName: string,
    maxVolume: number,
    volume: number,
    concentricCirclesResult: ConcentricCirclesResult | null
) => {
    textBuffer.push();
    textBuffer.clear(); // バッファをクリア
    textBuffer.textSize(16); // テキストサイズを設定
    textBuffer.textAlign(p.LEFT, p.TOP); // テキストの配置を設定

    // マイク名と音量を表示
    // マイクアクセスエラーの場合、より目立つ表示にする
    if (microphoneName === "Microphone Access Error") {
        textBuffer.fill(0, 100, 100); // 赤色で表示
        textBuffer.textSize(24); // フォントサイズを大きくする
        textBuffer.text("ERROR: Microphone Access Denied!", 10, 20);
        textBuffer.textSize(16); // 元のサイズに戻す
        textBuffer.fill(0, 0, 100); // 白
        textBuffer.text(
            "Please allow microphone access to start audio processing.",
            10,
            50
        );
    } else {
        textBuffer.fill(0, 0, 100); // 白
        textBuffer.text(`Microphone: ${microphoneName}`, 10, 20);
        textBuffer.text(
            `Volume: ${volume.toFixed(2)} / Max: ${maxVolume.toFixed(2)} `,
            10,
            40
        );
    }

    // 同心円の振幅変化データを表示
    if (concentricCirclesResult && concentricCirclesResult.circleData) {
        const numCircles = concentricCirclesResult.circleData.length;
        const half = Math.ceil(numCircles / 2); // データを2列に分割するための境界
        const lineHeight = 20; // 各行の高さ
        // エラーメッセージが表示されている場合はstartYを調整
        const startY = microphoneName === "Microphone Access Error" ? 80 : 60;

        // 列の幅と間隔を計算
        const indexColWidth = textBuffer.textWidth("Idx") + 10;
        const changeValueWidth = textBuffer.textWidth(" -0.0000");
        const columnSpacing = 15;
        const numPairsPerLine = 5; // 1行あたりのデータペア数

        // ヘッダーを表示
        textBuffer.fill(255);
        let headerY = startY;
        textBuffer.text("Amp Changes:", 10, headerY);
        headerY += lineHeight;

        let currentX = 10;
        for (let i = 0; i < numPairsPerLine; i++) {
            textBuffer.text("Idx", currentX, headerY);
            currentX += indexColWidth;
            textBuffer.text("Change", currentX, headerY);
            currentX += changeValueWidth + columnSpacing;
        }

        let currentDataY = headerY + lineHeight;

        // 最初の半分のデータを表示
        currentX = 10;
        for (let i = 0; i < half; i++) {
            const data = concentricCirclesResult.circleData[i];
            const formattedValue = p.nf(data.amplitudeChange, 1, 4); // 小数点以下4桁でフォーマット
            let displayValue = formattedValue;
            if (data.amplitudeChange >= 0) {
                displayValue = " " + formattedValue; // 正の値にはスペースを追加してアライメントを揃える
            }
            const paddedValue = displayValue.padStart(8, " "); // パディングして表示を揃える

            // 振幅変化に応じてテキストの色を変更
            if (data.amplitudeChange > 0) {
                textBuffer.fill(120, 100, 100); // 緑色（増加）
            } else if (data.amplitudeChange < 0) {
                textBuffer.fill(30, 100, 100); // 赤色（減少）
            } else {
                textBuffer.fill(0, 0, 100); // 白（変化なし）
            }

            textBuffer.text(p.nf(i, 2), currentX, currentDataY); // インデックスを表示
            currentX += indexColWidth;

            textBuffer.text(paddedValue, currentX, currentDataY); // 変化量を表示
            currentX += changeValueWidth + columnSpacing;

            // 1行あたりのペア数に達したら改行
            if ((i + 1) % numPairsPerLine === 0 && i + 1 < half) {
                currentX = 10;
                currentDataY += lineHeight;
            }
        }

        currentDataY += lineHeight; // 次の行へ移動
        currentX = 10;

        // 残りの半分のデータを表示
        for (let i = half; i < numCircles; i++) {
            const data = concentricCirclesResult.circleData[i];
            const formattedValue = p.nf(data.amplitudeChange, 1, 4);
            let displayValue = formattedValue;
            if (data.amplitudeChange >= 0) {
                displayValue = " " + formattedValue;
            }
            const paddedValue = displayValue.padStart(8, " ");

            if (data.amplitudeChange > 0) {
                textBuffer.fill(120, 100, 100);
            } else if (data.amplitudeChange < 0) {
                textBuffer.fill(30, 100, 100);
            } else {
                textBuffer.fill(255);
            }

            textBuffer.text(p.nf(i, 2), currentX, currentDataY);
            currentX += indexColWidth;

            textBuffer.text(paddedValue, currentX, currentDataY);
            currentX += changeValueWidth + columnSpacing;

            if ((i + 1 - half) % numPairsPerLine === 0 && i + 1 < numCircles) {
                currentX = 10;
                currentDataY += lineHeight;
            }
        }
    } else {
        // データがない場合の表示（マイクエラー時も考慮）
        if (microphoneName !== "Microphone Access Error") {
            textBuffer.fill(255);
            textBuffer.text("Amp Changes: No data", 10, 60);
        }
    }

    textBuffer.pop(); // 描画状態を復元
};
