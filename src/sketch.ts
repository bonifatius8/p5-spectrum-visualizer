import p5 from "p5";
import { SpectrumAnalyzer } from "./spectrumAnalyzerClass";
import { dataHolder } from "./dataHolder";
import { Config } from "./sketchConfig";
import { AudioData } from "./AudioData";
import { VisualLayer } from "./VisualLayer";
import { BackgroundFadeLayer } from "./layers/BackgroundFadeLayer";
import { ConcentricCirclesLayer } from "./layers/ConcentricCirclesLayer";
import { EllipseLayer } from "./layers/EllipseLayer";
import { VideoLayer } from "./layers/VideoLayer";
import { DebugLayer } from "./layers/DebugLayer";

export const sketch = (p: p5) => {
    let spectrumAnalyzer: SpectrumAnalyzer | null = null;
    let microphoneName = "";
    let maxVolume = 0;
    let audioStarted = false;
    let startOverlay: p5.Element;

    // ---- レイヤー定義 ----------------------------------------
    // この配列の順序が描画順になる。追加・削除・並び替えで構成を変える。
    const concentricLayer = new ConcentricCirclesLayer();
    const layers: VisualLayer[] = [
        concentricLayer,
        new BackgroundFadeLayer(),
        new VideoLayer([]),
        new DebugLayer(() => concentricLayer.lastResult),
        new EllipseLayer(),
    ];
    // ----------------------------------------------------------

    p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        p.colorMode(p.HSB, 360, 100, 100, 255);
        p.clear();
        p.background(0, 255);
        p.perspective(Math.PI / 4.0, p.width / p.height, 0.1, 5000);
        p.noStroke();
        p.noFill();

        const gl = p.drawingContext as WebGLRenderingContext;
        gl.disable(gl.DEPTH_TEST);

        layers.forEach((l) => l.setup(p));

        startOverlay = p.createDiv("Click to start audio processing");
        startOverlay.style("position", "fixed");
        startOverlay.style("top", "50%");
        startOverlay.style("left", "50%");
        startOverlay.style("transform", "translate(-50%, -50%)");
        startOverlay.style("color", "white");
        startOverlay.style("font-size", "32px");
        startOverlay.style("font-family", "sans-serif");
        startOverlay.style("pointer-events", "none");
        startOverlay.style("user-select", "none");

        canvas.elt.addEventListener(
            "click",
            function start() {
                startAudio();
                canvas.elt.removeEventListener("click", start);
            },
            { once: true },
        );
    };

    p.draw = () => {
        if (!audioStarted || !spectrumAnalyzer?.audioContext) {
            p.background(0);
            return;
        }

        const audio = buildAudioData();
        for (const layer of layers) {
            if (layer.enabled) {
                try {
                    layer.draw(p, audio);
                } catch (e) {
                    console.error(`[${layer.name}] draw error (layer disabled):`, e);
                    layer.enabled = false;
                }
            }
        }
    };

    const buildAudioData = (): AudioData => {
        let frequencies: Uint8Array | null = null;
        let volume = 0;

        if (spectrumAnalyzer) {
            const data = spectrumAnalyzer.getSpectrumData();
            if (data?.frequencies) {
                frequencies = data.frequencies;
                for (let i = 0; i < frequencies.length; i++) volume += frequencies[i];
                volume /= frequencies.length;
            }
        }

        maxVolume = Math.max(maxVolume, volume);

        return {
            frequencies,
            volume,
            maxVolume,
            sampleRate: spectrumAnalyzer?.audioContext?.sampleRate ?? 44100,
            analyser: spectrumAnalyzer?.analyser ?? null,
            audioContext: spectrumAnalyzer?.audioContext ?? null,
            bands: Config.AUDIO.BANDS,
            microphoneName,
        };
    };

    const startAudio = async () => {
        if (audioStarted) return;
        spectrumAnalyzer = new SpectrumAnalyzer(Config.AUDIO.BANDS);
        try {
            await spectrumAnalyzer.setup();
            audioStarted = true;
            startOverlay.hide();
            dataHolder.setAudioContext(spectrumAnalyzer.audioContext);
            try {
                microphoneName = spectrumAnalyzer.getMicrophoneName();
            } catch {
                microphoneName = "Microphone Access Error";
            }
        } catch (err: unknown) {
            console.error("Microphone access error:", err);
            microphoneName = "Microphone Access Error";
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        layers.forEach((l) => l.resize(p));
    };
};
