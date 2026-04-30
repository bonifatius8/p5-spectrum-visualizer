import * as p5 from "p5";
import { VisualLayer } from "../VisualLayer";
import { AudioData } from "../AudioData";
import { Config } from "../sketchConfig";
import { ConcentricCircleState, Transform3D } from "../sketchState";
import { calculateDirectionalTranslation } from "../directionalTranslation";
import { updateConcentricCircle1State } from "../sketchConcentricCircle1Updater";
import { concentricCircles, ConcentricCirclesResult } from "../concentricCircles";

const easeInOutQuad = (t: number): number => {
    t *= 2;
    if (t < 1) return 0.5 * t * t;
    t--;
    return -0.5 * (t * (t - 2) - 1);
};

export class ConcentricCirclesLayer implements VisualLayer {
    readonly name = "concentric-circles";
    enabled = true;
    lastResult: ConcentricCirclesResult | null = null;

    private buffer!: p5.Graphics;
    private c1State!: ConcentricCircleState;
    private c2Transform!: Transform3D;

    setup(p: p5) {
        this.buffer = p.createGraphics(p.width, p.height, p.P2D);
        this.buffer.colorMode(p.HSB, 360, 100, 100, 255);
        this.initTransforms(p);
    }

    resize(p: p5) {
        this.buffer = p.createGraphics(p.width, p.height, p.P2D);
        this.buffer.colorMode(p.HSB, 360, 100, 100, 255);
    }

    private initTransforms(p: p5) {
        const c1 = calculateDirectionalTranslation(
            p, 0, 0, 0,
            Config.CONCENTRIC_CIRCLES.C1_ROTATION_FACTOR_X,
            Config.CONCENTRIC_CIRCLES.C1_ROTATION_FACTOR_Y,
            Config.CONCENTRIC_CIRCLES.C1_ROTATION_FACTOR_Z,
            Config.CONCENTRIC_CIRCLES.C1_TRANSLATION_SENSITIVITY_XY,
            Config.CONCENTRIC_CIRCLES.C1_TRANSLATION_SENSITIVITY_Z,
            Config.CONCENTRIC_CIRCLES.C1_BASE_Z,
        );
        this.c1State = {
            x: c1.translateX, y: c1.translateY, z: c1.translateZ,
            rx: c1.rx, ry: c1.ry, rz: c1.rz,
            scale: Config.CONCENTRIC_CIRCLES.C1_BASE_SCALE,
            velocityX: 0, velocityY: 0, velocityZ: 0,
            angularVelocityX: 0, angularVelocityY: 0, angularVelocityZ: 0,
            scaleVelocity: 0,
        };

        const c2 = calculateDirectionalTranslation(
            p, 0, 0, 0,
            Config.CONCENTRIC_CIRCLES.C2_ROTATION_FACTOR_X,
            Config.CONCENTRIC_CIRCLES.C2_ROTATION_FACTOR_Y,
            Config.CONCENTRIC_CIRCLES.C2_ROTATION_FACTOR_Z,
            Config.CONCENTRIC_CIRCLES.C2_TRANSLATION_SENSITIVITY_XY,
            Config.CONCENTRIC_CIRCLES.C2_TRANSLATION_SENSITIVITY_Z,
            Config.CONCENTRIC_CIRCLES.C2_BASE_Z,
        );
        this.c2Transform = {
            x: c2.translateX, y: c2.translateY, z: c2.translateZ,
            rx: c2.rx, ry: c2.ry, rz: c2.rz,
            scale: Config.CONCENTRIC_CIRCLES.C2_BASE_SCALE,
        };
    }

    draw(p: p5, audio: AudioData) {
        this.updateTransforms(p, audio);
        this.renderBuffer(p, audio);
        this.drawPlanes(p, audio);
    }

    private updateTransforms(p: p5, audio: AudioData) {
        const { volume, maxVolume } = audio;

        const c2Target = calculateDirectionalTranslation(
            p, p.frameCount, volume, maxVolume,
            Config.CONCENTRIC_CIRCLES.C2_ROTATION_FACTOR_X,
            Config.CONCENTRIC_CIRCLES.C2_ROTATION_FACTOR_Y,
            Config.CONCENTRIC_CIRCLES.C2_ROTATION_FACTOR_Z,
            Config.CONCENTRIC_CIRCLES.C2_TRANSLATION_SENSITIVITY_XY,
            Config.CONCENTRIC_CIRCLES.C2_TRANSLATION_SENSITIVITY_Z,
            Config.CONCENTRIC_CIRCLES.C2_BASE_Z,
        );
        const c2ScaleTarget =
            Config.CONCENTRIC_CIRCLES.C2_BASE_SCALE +
            volume / (200 + Math.cos(p.frameCount * 0.003) * 100);

        const c1Target = calculateDirectionalTranslation(
            p, p.frameCount, volume, maxVolume,
            Config.CONCENTRIC_CIRCLES.C1_ROTATION_FACTOR_X,
            Config.CONCENTRIC_CIRCLES.C1_ROTATION_FACTOR_Y,
            Config.CONCENTRIC_CIRCLES.C1_ROTATION_FACTOR_Z,
            Config.CONCENTRIC_CIRCLES.C1_TRANSLATION_SENSITIVITY_XY,
            Config.CONCENTRIC_CIRCLES.C1_TRANSLATION_SENSITIVITY_Z,
            Config.CONCENTRIC_CIRCLES.C1_BASE_Z,
        );
        const c1ScaleTarget = Config.CONCENTRIC_CIRCLES.C1_BASE_SCALE + volume / 20;

        const normalizedVolume = maxVolume > 0 ? p.constrain(volume / maxVolume, 0, 1) : 0;
        const easedVolume = easeInOutQuad(normalizedVolume);
        const chaseSpeedFactor = p.lerp(0.05, 0.95, easedVolume);
        const delayFactor = p.lerp(0.95, 0.05, easedVolume);

        const c2 = this.c2Transform;
        c2.x = p.lerp(c2.x, c2Target.translateX, delayFactor);
        c2.y = p.lerp(c2.y, c2Target.translateY, delayFactor);
        c2.z = p.lerp(c2.z, c2Target.translateZ, delayFactor);
        c2.rx = p.lerp(c2.rx, c2Target.rx, delayFactor);
        c2.ry = p.lerp(c2.ry, c2Target.ry, delayFactor);
        c2.rz = p.lerp(c2.rz, c2Target.rz, delayFactor);
        c2.scale = p.lerp(c2.scale, c2ScaleTarget, delayFactor);

        this.c1State = updateConcentricCircle1State(
            p,
            this.c1State,
            c1Target,
            c1ScaleTarget,
            { translateX: c2.x, translateY: c2.y, translateZ: c2.z, rx: c2.rx, ry: c2.ry, rz: c2.rz },
            c2.scale,
            chaseSpeedFactor,
        );
    }

    private renderBuffer(p: p5, audio: AudioData) {
        this.buffer.push();
        this.buffer.clear();
        if (audio.frequencies && audio.audioContext) {
            this.lastResult = concentricCircles(
                this.buffer,
                audio.frequencies,
                audio.bands,
                p,
                audio.sampleRate,
            );
        }
        this.buffer.scale(1.5 + audio.volume / 300);
        this.buffer.pop();
    }

    private drawPlanes(p: p5, _audio: AudioData) {
        const c1 = this.c1State;
        p.push();
        p.translate(c1.x, c1.y, c1.z);
        p.rotateX(c1.rx);
        p.rotateY(c1.ry);
        p.rotateZ(c1.rz);
        p.scale(c1.scale);
        p.noStroke();
        p.texture(this.buffer);
        p.plane(this.buffer.width, this.buffer.height);
        p.pop();

        const c2 = this.c2Transform;
        p.push();
        p.translate(c2.x, c2.y, c2.z);
        p.rotateX(c2.rx);
        p.rotateY(c2.ry);
        p.rotateZ(c2.rz);
        p.scale(c2.scale);
        p.noStroke();
        p.specularMaterial(255);
        p.shininess(100);
        p.ambientLight(0, 0, 70);
        p.texture(this.buffer);
        p.plane(this.buffer.width, this.buffer.height);
        p.pop();
    }
}
