import * as p5 from "p5";
import { VisualLayer } from "../VisualLayer";
import { AudioData } from "../AudioData";
import { Config } from "../sketchConfig";
import { EllipseState, updateEllipses } from "../ellipse";

export class EllipseLayer implements VisualLayer {
    readonly name = "ellipses";
    enabled = true;

    private buffer!: p5.Graphics;
    private ellipseStates: EllipseState[] = [];

    setup(p: p5): void {
        this.buffer = p.createGraphics(p.width, p.height, p.P2D);
        this.buffer.colorMode(p.HSB, 360, 100, 100, 255);
    }

    resize(p: p5): void {
        this.buffer = p.createGraphics(p.width, p.height, p.P2D);
        this.buffer.colorMode(p.HSB, 360, 100, 100, 255);
    }

    private initStates(p: p5, audio: AudioData): void {
        if (!audio.analyser) return;
        this.ellipseStates = [];
        for (let i = 0; i < Config.ELLIPSE.NUM_ELLIPSES; i++) {
            const initialBin = Math.floor(
                (audio.analyser.frequencyBinCount / Config.ELLIPSE.NUM_ELLIPSES) * (i + 0.5)
            );
            this.ellipseStates.push({
                currentBin: p.constrain(initialBin, 0, audio.analyser.frequencyBinCount - 1),
                currentY: p.random(p.height),
                size: 100,
                hue: ((i * 360) / Config.ELLIPSE.NUM_ELLIPSES) % 360,
                alpha: 100,
                velocityX: (Math.random() - 0.5) * Config.ELLIPSE.INITIAL_SPEED,
                velocityY: (Math.random() - 0.5) * Config.ELLIPSE.INITIAL_SPEED,
                smoothedAmplitude: 0,
                lastReactionTime: p.millis(),
            });
        }
    }

    draw(p: p5, audio: AudioData): void {
        if (!audio.frequencies || !audio.analyser || !audio.audioContext) return;

        if (this.ellipseStates.length === 0) this.initStates(p, audio);

        this.buffer.push();
        this.buffer.clear();
        updateEllipses(
            this.buffer,
            this.ellipseStates,
            Config.ELLIPSE.WRAP_AROUND,
            p.width / Config.AUDIO.BANDS,
            audio.frequencies,
            audio.audioContext,
            audio.analyser,
            Config.AUDIO.MIN_AMPLITUDE,
            Config.AUDIO.MIN_DB,
            Config.AUDIO.MAX_DB,
            Config.ELLIPSE.DECAY_TIMEOUT_MS,
            Config.ELLIPSE.COLLISION_INFLUENCE_FACTOR,
            Config.ELLIPSE.SMOOTHING_FACTOR,
            Config.AUDIO.BANDS,
            p,
        );
        this.buffer.pop();

        p.push();
        p.translate(0, 0, -1100);
        p.rotateZ(p.frameCount * 0.01 + Math.pow(audio.volume / 100, 3));
        p.noStroke();
        p.texture(this.buffer);
        p.plane(this.buffer.width, this.buffer.height);
        p.pop();
    }
}
