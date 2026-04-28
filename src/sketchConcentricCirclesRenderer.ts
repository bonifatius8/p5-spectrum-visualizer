// sketchConcentricCirclesRenderer.ts
// このファイルは、P5.jsのメインキャンバス上での同心円の描画ロジックをカプセル化します。
// これにより、描画処理がメインの更新ロジックから分離され、コードが整理されます。

import * as p5 from "p5";
import {
    ConcentricCirclesResult,
    concentricCircles,
} from "./concentricCircles"; // concentricCircles関数も必要に応じてインポート

/**
 * 同心円をP5.jsのメインキャンバスに描画します。
 * graphicsBuffer3に描画された内容をテクスチャとして使用し、
 * 各同心円の変換（移動、回転、スケール）を適用します。
 * @param p p5インスタンス
 * @param graphicsBuffer3 同心円の描画内容が格納されたp5.Graphicsバッファ
 * @param volume 現在の音量（同心円3のスケールに影響）
 * @param spectrumAnalyzerData スペクトラムアナライザのデータ
 * @param spectrumAnalyzer SpectrumAnalyzerインスタンス
 * @returns concentricCirclesResult 同心円の計算結果
 */
export const drawConcentricCircles = (
    p: p5,
    graphicsBuffer3: p5.Graphics,
    volume: number,
    spectrumAnalyzerData: any, // SpectrumAnalyzerData型を適切に定義してください
    spectrumAnalyzer: any, // SpectrumAnalyzer型を適切に定義してください
    concentric1ActualX: number,
    concentric1ActualY: number,
    concentric1ActualZ: number,
    concentric1ActualRX: number,
    concentric1ActualRY: number,
    concentric1ActualRZ: number,
    concentric1ActualScale: number,
    concentric2TargetX: number,
    concentric2TargetY: number,
    concentric2TargetZ: number,
    concentric2TargetRX: number,
    concentric2TargetRY: number,
    concentric2TargetRZ: number,
    concentric2ScaleTarget: number,
    bands: number, // Configから取得したBANDS
    sampleRate: number // AudioContext.sampleRate
): ConcentricCirclesResult | null => {
    let concentricCirclesResult: ConcentricCirclesResult | null = null;

    // graphicsBuffer3に同心円の描画を準備
    graphicsBuffer3.push();
    graphicsBuffer3.clear();
    if (
        spectrumAnalyzerData &&
        spectrumAnalyzer &&
        spectrumAnalyzer.audioContext
    ) {
        // concentricCircles関数を呼び出して、graphicsBuffer3に同心円を描画
        concentricCirclesResult = concentricCircles(
            graphicsBuffer3,
            spectrumAnalyzerData.frequencies,
            bands,
            p,
            sampleRate
        );
    }
    // 音量に応じてgraphicsBuffer3全体のスケールを調整
    graphicsBuffer3.scale(1.5 + volume / 300);
    graphicsBuffer3.pop();

    // メインキャンバスに同心円1を描画
    p.push();
    p.translate(concentric1ActualX, concentric1ActualY, concentric1ActualZ);
    p.rotateX(concentric1ActualRX);
    p.rotateY(concentric1ActualRY);
    p.rotateZ(concentric1ActualRZ);
    p.scale(concentric1ActualScale);
    p.noStroke();
    p.texture(graphicsBuffer3); // graphicsBuffer3をテクスチャとして適用
    p.plane(graphicsBuffer3.width, graphicsBuffer3.height);
    p.pop();

    // メインキャンバスに同心円2を描画
    p.push();
    p.translate(concentric2TargetX, concentric2TargetY, concentric2TargetZ);
    p.rotateX(concentric2TargetRX);
    p.rotateY(concentric2TargetRY);
    p.rotateZ(concentric2TargetRZ);
    p.scale(concentric2ScaleTarget);
    p.noStroke();
    p.specularMaterial(255); // スペキュラマテリアルを適用
    p.shininess(100); // 光沢度を設定
    p.ambientLight(0, 0, 70); // 環境光を設定
    p.texture(graphicsBuffer3); // graphicsBuffer3をテクスチャとして適用
    p.plane(graphicsBuffer3.width, graphicsBuffer3.height);
    p.pop();

    return concentricCirclesResult;
};
