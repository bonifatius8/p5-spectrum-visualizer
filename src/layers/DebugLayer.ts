import * as p5 from "p5";
import { VisualLayer } from "../VisualLayer";
import { AudioData } from "../AudioData";
import { drawDebugInfo } from "../sketchDebugInfo";
import { ConcentricCirclesResult } from "../concentricCircles";

export class DebugLayer implements VisualLayer {
    readonly name = "debug";
    enabled = true;

    private buffer!: p5.Graphics;
    private readonly getConcentricResult: () => ConcentricCirclesResult | null;

    constructor(getConcentricResult: () => ConcentricCirclesResult | null) {
        this.getConcentricResult = getConcentricResult;
    }

    setup(p: p5): void {
        this.buffer = p.createGraphics(p.width, p.height, p.P2D);
        this.buffer.colorMode(p.HSB, 360, 100, 100, 255);
    }

    resize(p: p5): void {
        this.buffer = p.createGraphics(p.width, p.height, p.P2D);
        this.buffer.colorMode(p.HSB, 360, 100, 100, 255);
    }

    draw(p: p5, audio: AudioData): void {
        drawDebugInfo(
            p,
            this.buffer,
            audio.microphoneName,
            audio.maxVolume,
            audio.volume,
            this.getConcentricResult(),
        );

        p.push();
        p.translate(0, 0, -800);
        p.texture(this.buffer);
        p.plane(this.buffer.width, this.buffer.height);
        p.pop();
    }
}
