import * as p5 from "p5";
import { VisualLayer } from "../VisualLayer";
import { AudioData } from "../AudioData";

export class BackgroundFadeLayer implements VisualLayer {
    readonly name = "background-fade";
    enabled = true;

    setup(_p: p5) {}
    resize(_p: p5) {}

    draw(p: p5, _audio: AudioData) {
        p.blendMode(p.MULTIPLY);
        p.fill(0, 10);
        p.rect(-p.width / 2, -p.height / 2, p.width, p.height);
        // p.filter(p.BLUR, 0.5); // WEBGL では不安定なため一時的に無効化
        p.blendMode(p.BLEND);
    }
}
