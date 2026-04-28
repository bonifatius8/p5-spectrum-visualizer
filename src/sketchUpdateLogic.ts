// sketchUpdateLogic.ts
// このファイルは、P5.jsスケッチの毎フレームの更新ロジック（オーディオ処理、物理シミュレーションの計算など）をカプセル化します。
// これにより、p.draw関数が簡潔になり、状態更新の関心事が分離されます。

import * as p5 from "p5";
import { Config } from "./sketchConfig";
import { SketchState, ConcentricCircleState } from "./sketchState"; // ConcentricCircleStateをsketchStateからインポート
import {
    calculateDirectionalTranslation,
    DirectionalTranslationResult,
} from "./directionalTranslation";
import { updateConcentricCircle1State } from "./sketchConcentricCircle1Updater";

/**
 * イージング関数：Quadratic Ease-in-Out
 * アニメーションの開始と終了を滑らかにします。
 * @param t 0.0から1.0までの時間（または進行度）
 * @returns イージングが適用された値
 */
const easeInOutQuad = (t: number): number => {
    t *= 2;
    if (t < 1) return 0.5 * t * t;
    t--;
    return -0.5 * (t * (t - 2) - 1);
};

/**
 * スケッチの主要な状態更新ロジックを実行します。
 * オーディオデータの取得、音量計算、同心円の物理シミュレーションの更新を行います。
 * @param p p5インスタンス
 * @param state SketchStateオブジェクト（参照渡しで直接更新されます）
 * @returns 現在の音量
 */
export const updateSketchLogic = (p: p5, state: SketchState): number => {
    // 周波数バンドの幅を計算
    state.bandWidth = p.width / Config.AUDIO.BANDS;

    let currentVolume = 0;
    // スペクトラムアナライザから周波数データを取得し、全体の音量を計算
    if (state.spectrumAnalyzer) {
        state.spectrumAnalyzerData = state.spectrumAnalyzer.getSpectrumData();
        if (
            state.spectrumAnalyzerData &&
            state.spectrumAnalyzerData.frequencies
        ) {
            for (
                let i = 0;
                i < state.spectrumAnalyzerData.frequencies.length;
                i++
            ) {
                currentVolume += state.spectrumAnalyzerData.frequencies[i];
            }
            currentVolume /= state.spectrumAnalyzerData.frequencies.length;
        }
    }

    // 最大音量を更新
    state.maxVolume = Math.max(state.maxVolume, currentVolume);

    // 同心円2のターゲットを計算
    const concentric2Target: DirectionalTranslationResult =
        calculateDirectionalTranslation(
            p,
            p.frameCount,
            currentVolume,
            state.maxVolume,
            Config.CONCENTRIC_CIRCLES.C2_ROTATION_FACTOR_X,
            Config.CONCENTRIC_CIRCLES.C2_ROTATION_FACTOR_Y,
            Config.CONCENTRIC_CIRCLES.C2_ROTATION_FACTOR_Z,
            Config.CONCENTRIC_CIRCLES.C2_TRANSLATION_SENSITIVITY_XY,
            Config.CONCENTRIC_CIRCLES.C2_TRANSLATION_SENSITIVITY_Z,
            Config.CONCENTRIC_CIRCLES.C2_BASE_Z
        );
    const concentric2ScaleTarget =
        Config.CONCENTRIC_CIRCLES.C2_BASE_SCALE +
        currentVolume / (200 + Math.cos(p.frameCount * 0.003) * 100);

    // 同心円1自身のターゲットを計算
    const concentric1OwnTarget: DirectionalTranslationResult =
        calculateDirectionalTranslation(
            p,
            p.frameCount,
            currentVolume,
            state.maxVolume,
            Config.CONCENTRIC_CIRCLES.C1_ROTATION_FACTOR_X,
            Config.CONCENTRIC_CIRCLES.C1_ROTATION_FACTOR_Y,
            Config.CONCENTRIC_CIRCLES.C1_ROTATION_FACTOR_Z,
            Config.CONCENTRIC_CIRCLES.C1_TRANSLATION_SENSITIVITY_XY,
            Config.CONCENTRIC_CIRCLES.C1_TRANSLATION_SENSITIVITY_Z,
            Config.CONCENTRIC_CIRCLES.C1_BASE_Z
        );
    const concentric1OwnScaleTarget =
        Config.CONCENTRIC_CIRCLES.C1_BASE_SCALE + currentVolume / 20;

    // 正規化された音量とイージングされた音量を計算
    let normalizedVolume =
        state.maxVolume > 0
            ? p.constrain(currentVolume / state.maxVolume, 0, 1)
            : 0;
    let easedVolume = easeInOutQuad(normalizedVolume);

    // 追従速度係数と遅延開始係数を計算
    const chaseSpeedFactor = p.lerp(0.05, 0.95, easedVolume);
    const delayStartFactor = p.lerp(0.95, 0.05, easedVolume);

    // 同心円2の遅延ターゲットを更新
    state.concentric2DelayedTargetX = p.lerp(
        state.concentric2DelayedTargetX,
        concentric2Target.translateX,
        delayStartFactor
    );
    state.concentric2DelayedTargetY = p.lerp(
        state.concentric2DelayedTargetY,
        concentric2Target.translateY,
        delayStartFactor
    );
    state.concentric2DelayedTargetZ = p.lerp(
        state.concentric2DelayedTargetZ,
        concentric2Target.translateZ,
        delayStartFactor
    );
    state.concentric2DelayedTargetRX = p.lerp(
        state.concentric2DelayedTargetRX,
        concentric2Target.rx,
        delayStartFactor
    );
    state.concentric2DelayedTargetRY = p.lerp(
        state.concentric2DelayedTargetRY,
        concentric2Target.ry,
        delayStartFactor
    );
    state.concentric2DelayedTargetRZ = p.lerp(
        state.concentric2DelayedTargetRZ,
        concentric2Target.rz,
        delayStartFactor
    );
    state.concentric2DelayedTargetScale = p.lerp(
        state.concentric2DelayedTargetScale,
        concentric2ScaleTarget,
        delayStartFactor
    );

    // 同心円1の状態を物理シミュレーションに基づいて更新
    state.concentric1State = updateConcentricCircle1State(
        p,
        state.concentric1State,
        concentric1OwnTarget,
        concentric1OwnScaleTarget,
        {
            translateX: state.concentric2DelayedTargetX,
            translateY: state.concentric2DelayedTargetY,
            translateZ: state.concentric2DelayedTargetZ,
            rx: state.concentric2DelayedTargetRX,
            ry: state.concentric2DelayedTargetRY,
            rz: state.concentric2DelayedTargetRZ,
        }, // DirectionalTranslationResult型に合わせる
        state.concentric2DelayedTargetScale,
        chaseSpeedFactor
    );

    return currentVolume;
};
