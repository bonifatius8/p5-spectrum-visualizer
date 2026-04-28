// 各周波数帯のサンプルと最終サンプル時刻、次回の重みリセット時刻を保存するためのデータ構造
interface FrequencyData {
    samples: number[];
    lastSampleTime: number;
    nextResetTime: number; // 新しく追加
}

const frequencyDataStore: { [frequency: string]: FrequencyData } = {};

/**
 * 次回のリセット時刻を計算する関数
 * 現在時刻から10秒前後のランダムな時間を加算する
 * @returns {number} - 次回のリセット時刻（ミリ秒）
 */
const calculateNextResetTime = (): number => {
    const now = Date.now();
    // 10秒±2秒のランダムな遅延を生成 (8000ms〜12000ms)
    const randomDelay = (10 + (Math.random() * 7 - 2)) * 1000;
    return now + randomDelay;
};

/**
 * 新しいサンプルを追加する関数
 * @param {number} frequency - 周波数
 * @param {number} amplitude - 振幅
 * @param {number} samplingInterval - サンプリング間隔（ミリ秒）
 * @param {number} movingAverageDuration - 移動平均の期間（ミリ秒）
 */
export const addSample = (
    frequency: number,
    amplitude: number,
    samplingInterval: number,
    movingAverageDuration: number
) => {
    const frequencyString = frequency.toString();

    // 周波数帯のデータが存在しない場合は作成し、初回リセット時刻を設定
    if (!frequencyDataStore[frequencyString]) {
        frequencyDataStore[frequencyString] = {
            samples: [],
            lastSampleTime: 0,
            nextResetTime: calculateNextResetTime(), // ここで初回設定
        };
    }

    const data = frequencyDataStore[frequencyString];

    // 新しいサンプルを追加
    data.samples.push(amplitude);

    // サンプル配列が移動平均の期間を超える場合は、古いサンプルを削除
    const maxSamples = Math.floor(movingAverageDuration / samplingInterval);
    if (data.samples.length > maxSamples) {
        data.samples.shift();
    }

    // 最終サンプル時刻を更新
    data.lastSampleTime = Date.now();
};

/**
 * 移動平均を計算する関数
 * @param {number} frequency - 周波数
 * @returns {number} - 移動平均
 */
export const getMovingAverage = (frequency: number): number => {
    const frequencyString = frequency.toString();

    // 周波数帯のデータが存在しない場合、またはサンプルがない場合は0を返す
    if (
        !frequencyDataStore[frequencyString] ||
        frequencyDataStore[frequencyString].samples.length === 0
    ) {
        return 0;
    }

    const samples = frequencyDataStore[frequencyString].samples;
    // サンプルの合計を計算
    const sum = samples.reduce((a, b) => a + b, 0);

    // 移動平均を計算
    return sum / samples.length;
};

/**
 * 移動平均の値がフラットになるように重み付けを行う関数
 * @param {number} frequency - 周波数
 * @param {number} amplitude - 振幅
 * @param {number} samplingInterval - サンプリング間隔（ミリ秒）。デフォルト値：200ms
 * @param {number} movingAverageDuration - 移動平均の期間（ミリ秒）。デフォルト値：5000ms
 * @returns {number} - 重み付け後の振幅
 */
export const applyMovingAverageWeighting = (
    frequency: number,
    amplitude: number,
    samplingInterval: number = 200,
    movingAverageDuration: number = 5000
): number => {
    const frequencyString = frequency.toString();
    const now = Date.now();

    // 周波数帯のデータがまだ存在しない場合は初期化し、初回リセット時刻を設定
    if (!frequencyDataStore[frequencyString]) {
        frequencyDataStore[frequencyString] = {
            samples: [],
            lastSampleTime: 0,
            nextResetTime: calculateNextResetTime(), // ここで初回設定
        };
    }

    const data = frequencyDataStore[frequencyString];

    // --- 重みリセットのロジックを追加 ---
    if (now >= data.nextResetTime) {
        data.samples = []; // サンプルデータをクリアして重みをリセット
        data.nextResetTime = calculateNextResetTime(); // 次のリセット時刻を設定
        // 必要であれば、ここで lastSampleTime もリセットするか検討するのだ。
        // リセットしない場合、次のaddSample呼び出しまでサンプリングがスキップされる可能性があるのだ。
        // 通常はリセットしても問題ないのだ。
        data.lastSampleTime = now; // リセット時にサンプリング時刻も現在に更新
    }
    // --- 重みリセットのロジックここまで ---

    // 前回のサンプル採取からの経過時間を計測
    const timeSinceLastSample = now - data.lastSampleTime;

    // サンプリング間隔を超えている場合にのみサンプルを採取
    if (timeSinceLastSample >= samplingInterval) {
        addSample(
            frequency,
            amplitude,
            samplingInterval,
            movingAverageDuration
        );
    }

    // 移動平均を取得
    const movingAverage = getMovingAverage(frequency);

    // 移動平均が0の場合は、重み付けを行わない（元の振幅を返す）
    if (movingAverage === 0) {
        return amplitude;
    }

    // 各周波数帯の音量を同じ大きさに聞こえるような係数を計算
    const weight = 1 / movingAverage;

    // 重み付けを適用
    const weightedAmplitude = amplitude * weight;

    return weightedAmplitude;
};
