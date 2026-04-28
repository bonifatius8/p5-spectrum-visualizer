// sketch.ts
// このファイルはP5.jsのメインスケッチを定義し、他のモジュールを統合します。
// オーディオ処理、視覚化、物理シミュレーションの各要素を調整し、全体のエフェクトを生成します。

import { dataHolder } from "./dataHolder";
import * as p5 from "p5";
import { SpectrumAnalyzerData } from "./spectrumAnalyzer"; // SpectrumAnalyzerData型をインポート
import { EllipseState, updateEllipses } from "./ellipse"; // updateEllipses関数をインポート
import { ConcentricCirclesResult } from "./concentricCircles"; // ConcentricCirclesResult型をインポート
import { SpectrumAnalyzer } from "./spectrumAnalyzerClass"; // SpectrumAnalyzerクラスをインポート
import { calculateDirectionalTranslation } from "./directionalTranslation"; // calculateDirectionalTranslation関数をインポート
import { Config } from "./sketchConfig"; // 設定ファイルをインポート
import { updateConcentricCircle1State } from "./sketchConcentricCircle1Updater"; // 同心円1の更新ロジックをインポート (ConcentricCircleStateは不要)
import { drawConcentricCircles } from "./sketchConcentricCirclesRenderer"; // 同心円の描画ロジックをインポート
import { drawDebugInfo } from "./sketchDebugInfo"; // デバッグ情報描画ロジックをインポート
import { SketchState } from "./sketchState"; // SketchStateインターフェースをインポート
import { updateSketchLogic } from "./sketchUpdateLogic"; // 更新ロジック関数をインポート
import { VideoManager } from "./sketchVideoManager"; // VideoManagerをインポート

export const sketch = (p: p5) => {
    // グラフィックバッファの宣言
    let graphicsBuffer1: p5.Graphics; // 楕円の描画用
    let graphicsBuffer2: p5.Graphics; // 未使用だが残しておく
    let graphicsBuffer3: p5.Graphics; // 同心円の描画用
    let textBuffer: p5.Graphics; // デバッグテキストの描画用

    // スケッチ全体の状態を管理するオブジェクト
    let state: SketchState;

    // VideoManagerのインスタンス
    let videoManager: VideoManager;

    /**
     * グラフィックバッファを初期化し、色モードを設定するヘルパー関数。
     * @param p p5インスタンス
     * @returns 初期化されたグラフィックバッファのオブジェクト
     */
    const initializeGraphicsBuffers = (p: p5) => {
        const buffers = {
            graphicsBuffer1: p.createGraphics(p.width, p.height, p.P2D),
            graphicsBuffer2: p.createGraphics(p.width, p.height, p.P2D),
            graphicsBuffer3: p.createGraphics(p.width, p.height, p.P2D),
            textBuffer: p.createGraphics(p.width, p.height, p.P2D),
        };

        // 各バッファの色モードをHSBに設定
        Object.values(buffers).forEach((buffer) => {
            buffer.colorMode(p.HSB, 360, 100, 100, 255);
        });

        return buffers;
    };

    /**
     * P5.jsのセットアップ関数。
     * キャンバスの作成、初期設定、イベントリスナーの登録を行います。
     */
    p.setup = () => {
        // WEBGLモードでキャンバスを作成
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);

        // VideoManagerを初期化: 再生したいビデオファイルのパスを配列で渡すのだ
        videoManager = new VideoManager(p, []);

        // stateオブジェクトの初期化
        state = {
            audioProcessingStarted: false,
            spectrumAnalyzer: null,
            spectrumAnalyzerData: null,
            bandWidth: 0, // P5.jsのwidthに依存するため、初期値は0
            ellipseStates: [],
            microphoneName: "",
            vid: null, // VideoManagerがビデオ要素を管理するため、ここでは初期値をnullとするのだ
            maxVolume: 0,
            concentric1State: {
                // 同心円1の初期状態
                x: 0,
                y: 0,
                z: 0,
                rx: 0,
                ry: 0,
                rz: 0,
                scale: Config.CONCENTRIC_CIRCLES.C1_BASE_SCALE,
                velocityX: 0,
                velocityY: 0,
                velocityZ: 0,
                angularVelocityX: 0,
                angularVelocityY: 0,
                angularVelocityZ: 0,
                scaleVelocity: 0,
            },
            concentric2DelayedTargetX: 0,
            concentric2DelayedTargetY: 0,
            concentric2DelayedTargetZ: 0,
            concentric2DelayedTargetRX: 0,
            concentric2DelayedTargetRY: 0,
            concentric2DelayedTargetRZ: 0,
            concentric2DelayedTargetScale:
                Config.CONCENTRIC_CIRCLES.C2_BASE_SCALE,
        };

        // VideoManagerを初期化し、最初のビデオのロードと再生を開始するのだ
        videoManager.initializeAndPlay();

        // キャンバスサイズをウィンドウに合わせる
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        // 色モードをHSBに設定
        p.colorMode(p.HSB, 360, 100, 100, 255);
        // キャンバスをクリアし、背景を透明にする
        p.clear();
        p.background(0, 255);
        // パースペクティブを設定
        p.perspective(Math.PI / 4.0, p.width / p.height, 0.1, 5000);
        // 線と塗りを無効にする
        p.noStroke();
        p.noFill();

        // グラフィックバッファを初期化ヘルパー関数で作成
        const buffers = initializeGraphicsBuffers(p);
        graphicsBuffer1 = buffers.graphicsBuffer1;
        graphicsBuffer2 = buffers.graphicsBuffer2;
        graphicsBuffer3 = buffers.graphicsBuffer3;
        textBuffer = buffers.textBuffer;

        // WebGLの深度テストを無効にする
        let gl = p.drawingContext as WebGLRenderingContext;
        gl.disable(gl.DEPTH_TEST);

        // キャンバスクリックでオーディオ処理を開始するイベントリスナー
        canvas.elt.addEventListener(
            "click",
            function start() {
                startAudioProcessing();
                canvas.elt.removeEventListener("click", start);
            },
            { once: true }
        );

        // 同心円1の初期位置と回転をConfigから設定
        const initialConcentric1Translation = calculateDirectionalTranslation(
            p,
            0,
            0,
            0, // frameCount, volume, maxVolume は初期化時には0
            Config.CONCENTRIC_CIRCLES.C1_ROTATION_FACTOR_X,
            Config.CONCENTRIC_CIRCLES.C1_ROTATION_FACTOR_Y,
            Config.CONCENTRIC_CIRCLES.C1_ROTATION_FACTOR_Z,
            Config.CONCENTRIC_CIRCLES.C1_TRANSLATION_SENSITIVITY_XY,
            Config.CONCENTRIC_CIRCLES.C1_TRANSLATION_SENSITIVITY_Z,
            Config.CONCENTRIC_CIRCLES.C1_BASE_Z
        );

        state.concentric1State.x = initialConcentric1Translation.translateX;
        state.concentric1State.y = initialConcentric1Translation.translateY;
        state.concentric1State.z = initialConcentric1Translation.translateZ;
        state.concentric1State.rx = initialConcentric1Translation.rx;
        state.concentric1State.ry = initialConcentric1Translation.ry;
        state.concentric1State.rz = initialConcentric1Translation.rz;
        state.concentric1State.scale = Config.CONCENTRIC_CIRCLES.C1_BASE_SCALE;

        // 同心円2の遅延ターゲットをConfigから初期化
        const initialConcentric2Target = calculateDirectionalTranslation(
            p,
            0,
            0,
            0, // frameCount, volume, maxVolume は初期化時には0
            Config.CONCENTRIC_CIRCLES.C2_ROTATION_FACTOR_X,
            Config.CONCENTRIC_CIRCLES.C2_ROTATION_FACTOR_Y,
            Config.CONCENTRIC_CIRCLES.C2_ROTATION_FACTOR_Z,
            Config.CONCENTRIC_CIRCLES.C2_TRANSLATION_SENSITIVITY_XY,
            Config.CONCENTRIC_CIRCLES.C2_TRANSLATION_SENSITIVITY_Z,
            Config.CONCENTRIC_CIRCLES.C2_BASE_Z
        );
        state.concentric2DelayedTargetX = initialConcentric2Target.translateX;
        state.concentric2DelayedTargetY = initialConcentric2Target.translateY;
        state.concentric2DelayedTargetZ = initialConcentric2Target.translateZ;
        state.concentric2DelayedTargetRX = initialConcentric2Target.rx;
        state.concentric2DelayedTargetRY = initialConcentric2Target.ry;
        state.concentric2DelayedTargetRZ = initialConcentric2Target.rz;
        state.concentric2DelayedTargetScale =
            Config.CONCENTRIC_CIRCLES.C2_BASE_SCALE;
    };

    /**
     * P5.jsの描画ループ関数。
     * 毎フレーム呼び出され、視覚化とアニメーションを更新します。
     */
    p.draw = () => {
        // オーディオ処理が開始されていない場合は、開始を促すメッセージを表示
        if (
            !state.audioProcessingStarted ||
            !state.spectrumAnalyzer ||
            !state.spectrumAnalyzer.audioContext
        ) {
            p.background(0);
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(32);
            p.text("Click to start audio processing", 0, 0, p.width, p.height);
            return;
        }

        // スケッチの更新ロジックを実行し、現在の音量を取得
        const volume = updateSketchLogic(p, state);

        // 同心円の描画ロジックを呼び出す
        const concentricCirclesResult = drawConcentricCircles(
            p,
            graphicsBuffer3,
            volume, // updateSketchLogicから取得した音量を使用
            state.spectrumAnalyzerData, // stateから直接取得
            state.spectrumAnalyzer, // stateから直接取得
            state.concentric1State.x,
            state.concentric1State.y,
            state.concentric1State.z,
            state.concentric1State.rx,
            state.concentric1State.ry,
            state.concentric1State.rz,
            state.concentric1State.scale,
            state.concentric2DelayedTargetX,
            state.concentric2DelayedTargetY,
            state.concentric2DelayedTargetZ,
            state.concentric2DelayedTargetRX,
            state.concentric2DelayedTargetRY,
            state.concentric2DelayedTargetRZ,
            state.concentric2DelayedTargetScale,
            Config.AUDIO.BANDS,
            state.spectrumAnalyzer.audioContext.sampleRate
        );

        // デバッグ情報描画ロジックを呼び出す
        drawDebugInfo(
            p,
            textBuffer,
            state.microphoneName,
            state.maxVolume,
            volume,
            concentricCirclesResult
        );

        // 楕円の更新ロジックを呼び出す
        graphicsBuffer1.push();
        graphicsBuffer1.clear();
        if (state.spectrumAnalyzerData) {
            updateEllipses(
                graphicsBuffer1,
                state.ellipseStates,
                Config.ELLIPSE.WRAP_AROUND,
                state.bandWidth, // stateから直接取得
                state.spectrumAnalyzerData.frequencies, // stateから直接取得
                state.spectrumAnalyzer.audioContext, // stateから直接取得
                state.spectrumAnalyzer.analyser, // stateから直接取得
                Config.AUDIO.MIN_AMPLITUDE,
                Config.AUDIO.MIN_DB,
                Config.AUDIO.MAX_DB,
                Config.ELLIPSE.DECAY_TIMEOUT_MS,
                Config.ELLIPSE.COLLISION_INFLUENCE_FACTOR,
                Config.ELLIPSE.SMOOTHING_FACTOR,
                Config.AUDIO.BANDS,
                p
            );
        }
        graphicsBuffer1.pop();

        // 背景をブレンドモードで薄く塗りつぶし、残像効果を生成
        p.blendMode(p.MULTIPLY);
        p.fill(0, 10);
        p.rect(-p.width / 2, -p.height / 2, p.width, p.height);
        p.filter(p.BLUR, 0.5); // 軽いブラーを適用
        p.blendMode(p.BLEND);

        // ビデオの描画
        p.push();
        p.translate(
            Math.cos(volume / 100) * 200,
            Math.sin(volume / 100) * 50,
            -1200 - volume * 100
        );
        p.scale(Math.sin(p.frameCount * 0.01) * 0.5 + 3 + volume);
        p.rotateX(Math.cos(p.frameCount * 0.001) * 0.1);
        p.rotateY(Math.sin(p.frameCount * 0.002) * 0.1);
        p.rotateZ(p.frameCount * 0.001 + volume * 0.001);
        // VideoManagerから現在再生中のビデオ要素を取得して描画するのだ
        const currentVid = videoManager.getVideoElement();
        if (
            currentVid &&
            currentVid.elt.readyState >= currentVid.elt.HAVE_CURRENT_DATA
        ) {
            p.tint(
                255,
                volume * 1.8 + Math.abs(Math.sin(p.frameCount * 0.01) * 10)
            );
            p.texture(currentVid);
            p.plane(p.width, p.height);
        }
        p.pop();

        // デバッグテキストバッファをメインキャンバスに描画
        p.push();
        p.translate(0, 0, -800);
        p.texture(textBuffer);
        p.plane(textBuffer.width, textBuffer.height);
        p.pop();

        // 楕円描画バッファをメインキャンバスに描画
        p.push();
        p.translate(0, 0, -1100);
        p.rotateZ(p.frameCount * 0.01 + Math.pow(volume / 100, 3));
        p.noStroke();
        p.texture(graphicsBuffer1);
        p.plane(graphicsBuffer1.width, graphicsBuffer1.height);
        p.pop();
    };

    /**
     * オーディオ処理を開始します。
     * マイク入力を取得し、スペクトラムアナライザを設定します。
     */
    const startAudioProcessing = async () => {
        if (state.audioProcessingStarted) {
            console.log("Audio processing already started.");
            return;
        }

        // スペクトラムアナライザを初期化（ConfigからBANDSを取得）
        state.spectrumAnalyzer = new SpectrumAnalyzer(Config.AUDIO.BANDS);
        try {
            await state.spectrumAnalyzer.setup(); // マイクアクセスとオーディオコンテキストの設定
            state.audioProcessingStarted = true;
            dataHolder.setAudioContext(state.spectrumAnalyzer.audioContext); // AudioContextをdataHolderに設定

            // 楕円の状態を初期化
            state.ellipseStates = [];
            state.bandWidth = p.width / Config.AUDIO.BANDS;
            for (let i = 0; i < Config.ELLIPSE.NUM_ELLIPSES; i++) {
                const initialBin = Math.floor(
                    (state.spectrumAnalyzer.analyser.frequencyBinCount /
                        Config.ELLIPSE.NUM_ELLIPSEs) *
                        (i + 0.5)
                );

                const clampedInitialBin = p.constrain(
                    initialBin,
                    0,
                    state.spectrumAnalyzer.analyser.frequencyBinCount - 1
                );

                state.ellipseStates.push({
                    currentBin: clampedInitialBin,
                    currentY: p.random(p.height),
                    size: 100,
                    hue: ((i * 360) / Config.ELLIPSE.NUM_ELLIPSES) % 360,
                    alpha: 100,
                    velocityX:
                        (Math.random() - 0.5) * Config.ELLIPSE.INITIAL_SPEED,
                    velocityY:
                        (Math.random() - 0.5) * Config.ELLIPSE.INITIAL_SPEED,
                    smoothedAmplitude: 0,
                    lastReactionTime: p.millis(),
                });
            }

            console.log("AudioContext:", state.spectrumAnalyzer.audioContext);
            console.log("AnalyserNode:", state.spectrumAnalyzer.analyser);

            // ここではビデオのループ再生は不要なのだ。VideoManagerが自動で次のビデオに切り替えるのだ。
            // videoManager.loop(); // この行は削除されたのだ。

            // マイク名を取得
            try {
                state.microphoneName =
                    state.spectrumAnalyzer.getMicrophoneName();
            } catch (e: any) {
                console.error(
                    "Microphone access error (getMicrophoneName):",
                    e.message
                );
                state.microphoneName = "Microphone Access Error";
            }
            (p as any).audioStream = state.spectrumAnalyzer.source; // オーディオストリームをP5.jsインスタンスに設定
        } catch (err) {
            console.error(
                "Microphone access error (startAudioProcessing):",
                err
            );
            state.microphoneName = "Microphone Access Error";
            state.audioProcessingStarted = false;
        }
    };

    /**
     * ウィンドウサイズ変更時のP5.jsイベントハンドラ。
     * キャンバスとグラフィックバッファのサイズを再調整します。
     */
    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        // グラフィックバッファを初期化ヘルパー関数で再作成
        const buffers = initializeGraphicsBuffers(p);
        graphicsBuffer1 = buffers.graphicsBuffer1;
        graphicsBuffer2 = buffers.graphicsBuffer2;
        graphicsBuffer3 = buffers.graphicsBuffer3;
        textBuffer = buffers.textBuffer;
    };
};
