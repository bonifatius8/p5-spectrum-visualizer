import * as p5 from "p5";
import { VisualLayer } from "../VisualLayer";
import { AudioData } from "../AudioData";
import { VideoManager } from "../sketchVideoManager";

interface P5MediaElementWithElt extends p5.MediaElement {
    elt: HTMLMediaElement;
}

export class VideoLayer implements VisualLayer {
    readonly name = "video";
    enabled = true;

    private videoManager!: VideoManager;
    private readonly videoPaths: string[];

    constructor(videoPaths: string[]) {
        this.videoPaths = videoPaths;
    }

    setup(p: p5): void {
        this.videoManager = new VideoManager(p, this.videoPaths);
        this.videoManager.initializeAndPlay();
    }

    resize(_p: p5): void {}

    draw(p: p5, audio: AudioData): void {
        const vid = this.videoManager.getVideoElement();
        if (!vid || (vid as P5MediaElementWithElt).elt.readyState < (vid as P5MediaElementWithElt).elt.HAVE_CURRENT_DATA) return;

        p.push();
        p.translate(
            Math.cos(audio.volume / 100) * 200,
            Math.sin(audio.volume / 100) * 50,
            -1200 - audio.volume * 100,
        );
        p.scale(Math.sin(p.frameCount * 0.01) * 0.5 + 3 + audio.volume);
        p.rotateX(Math.cos(p.frameCount * 0.001) * 0.1);
        p.rotateY(Math.sin(p.frameCount * 0.002) * 0.1);
        p.rotateZ(p.frameCount * 0.001 + audio.volume * 0.001);
        p.tint(255, audio.volume * 1.8 + Math.abs(Math.sin(p.frameCount * 0.01) * 10));
        p.texture(vid);
        p.plane(p.width, p.height);
        p.pop();
    }
}
