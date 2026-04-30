// sketchConcentricCircle1Updater.ts
// このファイルは、同心円1の物理シミュレーションによる状態更新ロジックをカプセル化します。
// これにより、メインのスケッチファイルが簡潔になり、物理計算の複雑さが隠蔽されます。

import * as p5 from "p5";
import { Config } from "./sketchConfig";
import { DirectionalTranslationResult } from "./directionalTranslation";
import { ConcentricCircleState } from "./sketchState";

/**
 * 物理シミュレーションに基づいてオブジェクトの位置、速度、または角度を更新します。
 * バネ-ダンパーモデルを適用し、ターゲット値への追従をシミュレートします。
 * @param p p5インスタンス
 * @param actual 現在の値（位置、角度、スケールなど）
 * @param velocity 現在の速度（または角速度、スケール速度）
 * @param ownTarget オブジェクト自身のターゲット値
 * @param delayedTarget 遅延されたターゲット値（追従対象）
 * @param chaseSpeedFactor 追従速度係数（0.05から0.95の範囲で、ボリュームに応じて変化）
 * @param isAngle 値が角度であるかどうか（角度の場合は最短経路で補間）
 * @returns 更新された値と速度を含むオブジェクト
 */
const updatePhysics = (
    p: p5,
    actual: number,
    velocity: number,
    ownTarget: number,
    delayedTarget: number,
    chaseSpeedFactor: number,
    isAngle: boolean = false
) => {
    // 追従速度係数に基づいてバネ定数と減衰係数をマッピング
    const currentSpringConstant = p.map(
        chaseSpeedFactor,
        0.05,
        0.95,
        Config.PHYSICS_SIMULATION.SPRING_CONSTANT_MIN,
        Config.PHYSICS_SIMULATION.SPRING_CONSTANT_MAX
    );
    const currentDampingFactor = p.map(
        chaseSpeedFactor,
        0.05,
        0.95,
        Config.PHYSICS_SIMULATION.DAMPING_FACTOR_MIN,
        Config.PHYSICS_SIMULATION.DAMPING_FACTOR_MAX
    );

    // 自身のターゲットと遅延ターゲットを線形補間して、最終的なターゲットを決定
    let target = p.lerp(ownTarget, delayedTarget, chaseSpeedFactor);

    let force: number;
    if (isAngle) {
        // 角度の場合、最短経路の差分を計算
        let angleDiff = target - actual;
        if (angleDiff > p.PI) angleDiff -= p.TWO_PI;
        if (angleDiff < -p.PI) angleDiff += p.TWO_PI;
        force = angleDiff * currentSpringConstant;
    } else {
        // 位置やスケールの場合
        force = (target - actual) * currentSpringConstant;
    }

    // 減衰力と加速度を計算
    let dampingForce = -velocity * currentDampingFactor;
    let acceleration = force + dampingForce;

    // 速度と現在値を更新
    velocity += acceleration;
    actual += velocity;

    return { actual, velocity };
};

/**
 * 同心円1の状態を物理シミュレーションに基づいて更新します。
 * @param p p5インスタンス
 * @param concentric1State 現在の同心円1の状態
 * @param concentric1OwnTarget 同心円1自身のターゲット変換結果
 * @param concentric1OwnScaleTarget 同心円1自身のターゲットスケール
 * @param concentric2DelayedTarget 遅延された同心円2のターゲット変換結果
 * @param concentric2DelayedTargetScale 遅延された同心円2のターゲットスケール
 * @param chaseSpeedFactor 追従速度係数
 * @returns 更新された同心円1の状態
 */
export const updateConcentricCircle1State = (
    p: p5,
    concentric1State: ConcentricCircleState,
    concentric1OwnTarget: DirectionalTranslationResult,
    concentric1OwnScaleTarget: number,
    concentric2DelayedTarget: DirectionalTranslationResult,
    concentric2DelayedTargetScale: number,
    chaseSpeedFactor: number
): ConcentricCircleState => {
    // 状態を不変にするためにスプレッド構文でコピー
    let newState = { ...concentric1State };

    // 各物理プロパティ（位置、回転、スケール）を更新
    let resultX = updatePhysics(
        p,
        newState.x,
        newState.velocityX,
        concentric1OwnTarget.translateX,
        concentric2DelayedTarget.translateX,
        chaseSpeedFactor
    );
    newState.x = resultX.actual;
    newState.velocityX = resultX.velocity;

    let resultY = updatePhysics(
        p,
        newState.y,
        newState.velocityY,
        concentric1OwnTarget.translateY,
        concentric2DelayedTarget.translateY,
        chaseSpeedFactor
    );
    newState.y = resultY.actual;
    newState.velocityY = resultY.velocity;

    let resultZ = updatePhysics(
        p,
        newState.z,
        newState.velocityZ,
        concentric1OwnTarget.translateZ,
        concentric2DelayedTarget.translateZ,
        chaseSpeedFactor
    );
    newState.z = resultZ.actual;
    newState.velocityZ = resultZ.velocity;

    let resultRX = updatePhysics(
        p,
        newState.rx,
        newState.angularVelocityX,
        concentric1OwnTarget.rx,
        concentric2DelayedTarget.rx,
        chaseSpeedFactor,
        true // 角度として処理
    );
    newState.rx = resultRX.actual;
    newState.angularVelocityX = resultRX.velocity;

    let resultRY = updatePhysics(
        p,
        newState.ry,
        newState.angularVelocityY,
        concentric1OwnTarget.ry,
        concentric2DelayedTarget.ry,
        chaseSpeedFactor,
        true // 角度として処理
    );
    newState.ry = resultRY.actual;
    newState.angularVelocityY = resultRY.velocity;

    let resultRZ = updatePhysics(
        p,
        newState.rz,
        newState.angularVelocityZ,
        concentric1OwnTarget.rz,
        concentric2DelayedTarget.rz,
        chaseSpeedFactor,
        true // 角度として処理
    );
    newState.rz = resultRZ.actual;
    newState.angularVelocityZ = resultRZ.velocity;

    let resultScale = updatePhysics(
        p,
        newState.scale,
        newState.scaleVelocity,
        concentric1OwnScaleTarget,
        concentric2DelayedTargetScale,
        chaseSpeedFactor
    );
    newState.scale = resultScale.actual;
    newState.scaleVelocity = resultScale.velocity;

    return newState;
};
