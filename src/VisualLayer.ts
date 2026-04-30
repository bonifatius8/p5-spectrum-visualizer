import * as p5 from "p5";
import { AudioData } from "./AudioData";

export interface VisualLayer {
    readonly name: string;
    enabled: boolean;
    setup(p: p5): void;
    resize(p: p5): void;
    draw(p: p5, audio: AudioData): void;
}
