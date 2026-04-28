// sketchState.ts
// このファイルは、P5.jsスケッチの全体的な状態と、その一部である同心円の状態を定義するインターフェースを保持します。
// これにより、スケッチの状態管理が一元化され、コードの可読性と保守性が向上します。

import { SpectrumAnalyzer } from "./spectrumAnalyzerClass"; // SpectrumAnalyzerクラスをインポート
import { SpectrumAnalyzerData } from "./spectrumAnalyzer"; // SpectrumAnalyzerData型をインポート
import { EllipseState } from "./ellipse"; // EllipseState型をインポート
import * as p5 from "p5"; // p5型をインポート

/**
 * 同心円の物理シミュレーションにおける単一の状態を表すインターフェース。
 * 位置、回転、スケール、およびそれぞれの速度を含みます。
 */
export interface ConcentricCircleState {
    x: number; // X座標
    y: number; // Y座標
    z: number; // Z座標
    rx: number; // X軸回転
    ry: number; // Y軸回転
    rz: number; // Z軸回転
    scale: number; // スケール
    velocityX: number; // X軸速度
    velocityY: number; // Y軸速度
    velocityZ: number; // Z軸速度
    angularVelocityX: number; // X軸角速度
    angularVelocityY: number; // Y軸角速度
    angularVelocityZ: number; // Z軸角速度
    scaleVelocity: number; // スケール速度
}

/**
 * P5.jsスケッチ全体の状態を定義するインターフェース。
 * オーディオ処理の状態、アナライザ、グラフィックバッファ、視覚要素の状態など、
 * スケッチの実行中に変化するすべての主要なデータを集約します。
 */
export interface SketchState {
    audioProcessingStarted: boolean; // オーディオ処理が開始されたかどうかのフラグ
    spectrumAnalyzer: SpectrumAnalyzer | null; // スペクトラムアナライザのインスタンス
    spectrumAnalyzerData: SpectrumAnalyzerData | null; // スペクトラムデータ
    bandWidth: number; // 各周波数バンドの幅
    ellipseStates: EllipseState[]; // 楕円の状態を保持する配列
    microphoneName: string; // マイクの名前
    vid: p5.MediaElement | null; // ビデオ要素 (VideoManagerが管理するためnullを許容)
    maxVolume: number; // 観測された最大音量

    // 同心円1の現在の状態
    concentric1State: ConcentricCircleState;

    // 同心円2の遅延ターゲット位置、回転、スケール
    concentric2DelayedTargetX: number;
    concentric2DelayedTargetY: number;
    concentric2DelayedTargetZ: number;
    concentric2DelayedTargetRX: number;
    concentric2DelayedTargetRY: number;
    concentric2DelayedTargetRZ: number;
    concentric2DelayedTargetScale: number;
}
