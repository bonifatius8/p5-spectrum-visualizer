import * as p5 from "p5";

export interface SpectrumAnalyzerData {
    frequencies: Uint8Array;
}

interface WindowWithWebkitAudio extends Window {
    webkitAudioContext?: typeof AudioContext;
}

export class SpectrumAnalyzer {
    public audioContext: AudioContext;
    public analyser: AnalyserNode;
    public source?: MediaStreamAudioSourceNode;
    private freqData: Uint8Array;
    private bands: number;

    constructor(bands: number) {
        this.bands = bands;
        const win = window as WindowWithWebkitAudio;
        this.audioContext = new (win.AudioContext ?? win.webkitAudioContext!)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.bands * 2;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    async setup(): Promise<void> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            this.source = this.audioContext.createMediaStreamSource(stream);
            this.source.connect(this.analyser);
        } catch (err: unknown) {
            console.error("マイクアクセスエラー:", err);
            throw err;
        }
    }

    getSpectrumData(): SpectrumAnalyzerData {
        this.analyser.getByteFrequencyData(this.freqData);
        return {
            frequencies: this.freqData,
        };
    }

    getMicrophoneName(): string {
        if (
            !this.source ||
            !this.source.mediaStream ||
            !this.source.mediaStream.getAudioTracks().length
        ) {
            throw new Error("マイクアクセスエラー");
        }
        return this.source.mediaStream.getAudioTracks()[0].label;
    }
}
