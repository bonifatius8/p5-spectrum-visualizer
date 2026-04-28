// A特性の周波数ごとの重み付け（dB）
const aWeighting: { [frequency: string]: number } = {
    "20": -50.5,
    "25": -44.7,
    "31.5": -39.4,
    "40": -34.6,
    "50": -30.2,
    "63": -26.2,
    "80": -22.5,
    "100": -19.1,
    "125": -16.1,
    "160": -13.4,
    "200": -10.9,
    "250": -8.6,
    "315": -6.6,
    "400": -4.8,
    "500": -3.2,
    "630": -1.9,
    "800": -0.8,
    "1000": 0.0,
    "1250": 0.6,
    "1600": 1.0,
    "2000": 1.2,
    "2500": 1.3,
    "3150": 1.2,
    "4000": 1.0,
    "5000": 0.5,
    "6300": -0.1,
    "8000": -1.1,
    "10000": -2.5,
    "12500": -4.3,
    "16000": -6.6,
    "20000": -9.3,
};

/**
 * A特性フィルターを適用する関数
 * @param {number} frequency - 周波数
 * @param {number} amplitude - 振幅
 * @returns {number} - A特性フィルター適用後の振幅
 */
export const applyAWeighting = (
    frequency: number,
    amplitude: number
): number => {
    // 周波数に最も近いA特性の重み付けを取得
    let closestFrequency = Object.keys(aWeighting).reduce((prev, curr) => {
        return Math.abs(Number(curr) - frequency) <
            Math.abs(Number(prev) - frequency)
            ? curr
            : prev;
    });

    // A特性の重み付けを適用
    const weight = aWeighting[Number(closestFrequency)];
    const weightedAmplitude = amplitude * Math.pow(10, weight / 20); // dBから振幅スケールに変換

    return weightedAmplitude;
};
