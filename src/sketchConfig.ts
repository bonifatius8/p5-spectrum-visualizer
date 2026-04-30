// sketchConfig.ts
// このファイルは、スケッチ全体の動作を制御するための定数と設定を定義します。

export const Config = {
    AUDIO: {
        BANDS: 1024, // スペクトラムアナライザの周波数バンド数 (FFTサイズ) - 高い解像度を維持
        MIN_AMPLITUDE: 0.001, // 楕円の最小振幅閾値
        MIN_DB: -100, // アナライザの最小デシベル値
        MAX_DB: -30, // アナライザの最大デシベル値
    },
    ELLIPSE: {
        NUM_ELLIPSES: 100, // 描画する楕円の数
        WRAP_AROUND: true, // 楕円が画面端で反対側から出現するか
        INITIAL_SPEED: 2, // 楕円の初期速度の最大値
        DECAY_TIMEOUT_MS: 200, // 振幅が一定以下になった場合の消失までのタイムアウト
        COLLISION_INFLUENCE_FACTOR: 0.05, // 衝突時の速度変化の度合い
        SMOOTHING_FACTOR: 0.1, // 振幅のスムージング係数
    },
    CONCENTRIC_CIRCLES: {
        NUM_VISUAL_RINGS: 20, // 描画する同心円の視覚的な輪の数

        // 同心円1の基本スケール
        C1_BASE_SCALE: 1.0,
        // 同心円2の基本スケール
        C2_BASE_SCALE: 1.5,

        // 同心円1の回転と移動の感度
        C1_ROTATION_FACTOR_X: 0.001,
        C1_ROTATION_FACTOR_Y: 0.002,
        C1_ROTATION_FACTOR_Z: 0.003,
        C1_TRANSLATION_SENSITIVITY_XY: 0.5,
        C1_TRANSLATION_SENSITIVITY_Z: 1.0,
        C1_BASE_Z: -1000,

        // 同心円2の回転と移動の感度
        C2_ROTATION_FACTOR_X: 0.002,
        C2_ROTATION_FACTOR_Y: 0.001,
        C2_ROTATION_FACTOR_Z: 0.004,
        C2_TRANSLATION_SENSITIVITY_XY: 0.8,
        C2_TRANSLATION_SENSITIVITY_Z: 1.5,
        C2_BASE_Z: -1500,

        // 周波数ビンマッピングに関する設定
        MIN_DISPLAY_FREQ: 20, // Hz (表示する可聴域の最低周波数)
        MAX_DISPLAY_FREQ: 20000, // Hz (表示する可聴域の最高周波数)
        EPSILON: 1e-9, // 浮動小数点誤差の許容範囲

        // 回転に関する設定
        MIDDLE_FREQUENCY_THRESHOLD: 2500, // Hz (低周波と高周波の回転係数を分ける閾値)
        LOW_FREQ_ROTATION_FACTOR: 0.00005, // 低周波帯の振幅が回転に与える影響
        HIGH_FREQ_ROTATION_FACTOR: 0.00003, // 高周波帯の振幅が回転に与える影響
        BASE_ROTATION_SPEED: 0.0008, // 基本の回転速度

        // 色相に関する設定
        LOW_FREQ_HUE_THRESHOLD: 500, // Hz (低周波帯の色相バイアス閾値)
        HIGH_FREQ_HUE_THRESHOLD: 4000, // Hz (高周波帯の色相バイアス閾値)
        LOW_HUE_BIAS: 0, // 低周波帯の色相バイアス (赤系)
        MID_HUE_BIAS: 100, // 中周波帯の色相バイアス (緑系)
        HIGH_HUE_BIAS: 250, // 高周波帯の色相バイアス (青紫系)
        HUE_SENSITIVITY: 3.5, // 全体的な色相オフセットの感度

        // 描画に関する設定 (concentricCircles.tsの「最初の状態」に合わせるのだ)
        MIN_RADIUS: 50, // 最も内側の円の最小半径
        MARGIN_RATIO: 0.01, // キャンバスサイズに対するマージンの割合
        BASE_STROKE_WEIGHT_RATIO: 1 / 300, // キャンバスサイズに対する基本の線の太さの割合
        AMPLITUDE_STROKE_WEIGHT_FACTOR: 5, // 振幅が線の太さに与える影響 (元の値に戻すのだ)
        MIN_STROKE_WEIGHT_OFFSET: 0.001, // 線の太さの最小オフセット (元の値に戻すのだ)
        AMPLITUDE_SATURATION_FACTOR: 70, // 振幅が彩度に与える影響
        BASE_SATURATION: 40, // 基本の彩度
        AMPLITUDE_BRIGHTNESS_FACTOR: 40, // 振幅が明度に与える影響
        BASE_BRIGHTNESS: 70, // 基本の明度
        AMPLITUDE_ALPHA_FACTOR: 200, // 振幅がアルファ値に与える影響
        BASE_ALPHA: 55, // 基本のアルファ値
        RECT_STROKE_WEIGHT_AMPLITUDE_FACTOR: 30, // 四角形の線の太さに対する振幅の影響 (元の値に戻すのだ)
        RECT_STROKE_WEIGHT_RAD_FACTOR: 0.5, // 四角形の線の太さに対する回転角の影響 (元の値に戻すのだ)
        AMPLITUDE_ELLIPSE_OFFSET_FACTOR: 10, // 円の位置オフセットに関する係数 (元の値に戻すのだ)

        // 「最初の状態」には存在しないため、これらの設定は削除するのだ
        // BASE_ELLIPSE_SIZE: 20,
        // AMPLITUDE_ELLIPSE_SIZE_FACTOR: 200,
        // VOLUME_RADIAL_SHIFT_FACTOR: 10,
    },
    // 物理シミュレーションに関する設定をここに追加
    PHYSICS_SIMULATION: {
        SPRING_CONSTANT_MIN: 0.005, // 追従速度が遅い場合のバネ定数
        SPRING_CONSTANT_MAX: 0.05, // 追従速度が速い場合のバネ定数
        DAMPING_FACTOR_MIN: 0.85, // 追従速度が遅い場合の減衰係数
        DAMPING_FACTOR_MAX: 0.95, // 追従速度が速い場合の減衰係数
    },
    // その他の設定項目があれば追加
} as const;
