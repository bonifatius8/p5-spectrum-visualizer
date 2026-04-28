import processing.sound.*;

AudioIn in;
FFT fft;
int bands = 128;
float[] spectrum = new float[bands];
float bandWidth;

// 特定の周波数に反応するための設定
float targetFrequency; // Hz
float frequencyTolerance = 50; // 反応する周波数範囲 (Hz)
int targetBin; // targetFrequencyに対応するFFTのビン番号

// 反応を判定するための閾値
float reactionThreshold = 0.01; // スペクトル強度の閾値 (調整が必要)
boolean isReacting = false; // 反応中かどうかのフラグ

// グラフィック描画に関する変数
float graphicSize = 50;

float graphicHue = 0;

void setup() {
  size(1920, 1080);
  background(0);
  fill(0, 127, 255);
  //colorMode(HSB, 360, 100, 100); // 色空間をHSBに設定
  
  bandWidth = width / (float)bands;
  
  Sound.list();
  Sound sound = new Sound(this);
  //sound.sampleRate(48000);
  sound.inputDevice(45);
  
  in = new AudioIn(this,0);
  in.start();
  

  fft = new FFT(this, bands);
  fft.input(in);

  // 目標周波数がFFTのどのビンに対応するかを計算
  // bin = frequency * fftSize / sampleRate
  // Sample rateはAudioInのデフォルト (通常44100Hz) を使用
  float sampleRate = 24000;
  targetFrequency = 250;
  targetBin = floor(targetFrequency * bands / sampleRate);
  print("targetBin " + targetBin + "\n");

}

//float scale = 100.0;
// 対数表示のための設定
float minAmplitude = 0.0001; // これより小さい振幅は表示しないか、最小値として扱う (log(0)回避用)
float minDb = 20 * log10(minAmplitude); // 表示する最小デシベル値 (例: -80 dB)
float maxDb = 20 * log10(1.0); // 表示する最大デシベル値 (振幅1.0は0 dB)

// グラフの表示高さのスケールファクター (任意、全体の高さを調整したい場合に使用)
float displayScale = 1.0; // 1.0ならheightいっぱいにマッピング

void draw() {
  background(0, 10); // 残像効果のために少しずつクリア
  fft.analyze(spectrum);
  
  noFill();
  stroke(255); // 線の色
  strokeWeight(1.5); // 線の太さ (見やすくするため)
  //線分の描画開始
  beginShape();
  
  vertex(0, height - map(minDb, minDb, maxDb, 0, height * displayScale));

  // FFTのバンドの数だけくりかえし
  for (int i = 0; i < bands; i++) {
    // FFTの解析結果の振幅を取得
    float amplitude = spectrum[i];
  
    // 振幅が非常に小さい場合、最小値でクランプしてlog(0)を回避
    if (amplitude < minAmplitude) {
      amplitude = minAmplitude;
    }
  
    // 振幅をデシベルスケールに変換
    // 20 * log10(Amplitude) がデシベルの計算式
    float db = 20 * log10(amplitude);
  
    // デシベル値を表示範囲 (minDb から maxDb) にクランプ
    // これにより、minDbより小さい音は一番下のラインに、maxDbより大きい音は一番上のラインに表示が収まる
    db = constrain(db, minDb, maxDb);
  
    // デシベル値を画面の高さ (height) にマッピング
    // map(value, inputMin, inputMax, outputMin, outputMax)
    // デシベル値の範囲 [minDb, maxDb] を、画面の高さ範囲 [0, height * displayScale] にマッピング
    // ただし、y座標は上から下に向かって増加するため、yの範囲は逆にする
    float x = i * bandWidth;
    // height - map(...) とすることで、振幅が大きい(dbが大きい)ほどy座標が小さく(上になる)ように調整
    float y = height - map(db, minDb, maxDb, 0, height * displayScale);
  
    // グラフの点を追加
    // point() の代わりに vertex() を使うと、beginShape() / endShape() で滑らかな線や多角形を描ける
    // point(x, y); // 点で表示したい場合はこちら
    vertex(x, y); // 線で表示したい場合はこちら
  }
  
  // 最後の点（グラフの右端、最小デシベル値の位置）を設定 (任意: 線を閉じるか見た目を整える場合)
  // end x, end y
  vertex(width, height - map(minDb, minDb, maxDb, 0, height * displayScale));
  
  
  // 線分の描画終了
  endShape();




  
  // 目標周波数ビンとその近傍のスペクトル強度を確認
  float currentAmplitude = 0;
  // 周波数範囲で合計または最大値をとることも多い
  // ここでは簡単のためターゲットビン単体を見る
  if (targetBin >= 0 && targetBin < spectrum.length) {
      currentAmplitude = spectrum[targetBin];
  }
  
  //print(floor(currentAmplitude*100)+" ");

  // 周波数範囲で合計する場合の例
  // float sumAmplitude = 0;
  // int startBin = max(0, floor((targetFrequency - frequencyTolerance) * fftSize / in.sampleRate()));
  // int endBin = min(spectrum.length - 1, floor((targetFrequency + frequencyTolerance) * fftSize / in.sampleRate()));
  // for (int i = startBin; i <= endBin; i++) {
  //     sumAmplitude += spectrum[i];
  // }
  // currentAmplitude = sumAmplitude / (endBin - startBin + 1); // 平均を取る

  // 反応閾値を超えているか判定
  if (currentAmplitude > reactionThreshold) {
    isReacting = true;
  } else {
    isReacting = false;
  }

  // グラフィックの更新
  if (isReacting) {
    // 反応中のグラフィック変化
    graphicSize = min(100, graphicSize + 1); // サイズを大きくする (上限100)
    graphicHue = (graphicHue + 5) % 360; // 色相を変化させる
    fill(graphicHue, 80, 100, 200); // 彩度・明度を高めに設定
  } else {
    // 非反応中のグラフィック変化 (元に戻すなど)
    graphicSize = max(50, graphicSize - 0.5); // サイズを小さく戻す (下限50)
    fill(0, 0, 50, 100); // 暗めの色に戻す
  }

  // グラフィックの描画
  ellipse(width / 2 , height / 2, graphicSize, graphicSize); // 例: 中央に円を描画
  
  
}

// スケッチ停止時にAudioInも停止させる
void stop() {
  if (in != null) {
    in.stop();
  }
  super.stop();
}

// Calculates the base-10 logarithm of a number
float log10 (float x) {
  return (log(x) / log(10));
}
