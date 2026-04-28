import * as p5 from "p5";

export interface SpectrumAnalyzerData {
    frequencies: Uint8Array;
}

export class SpectrumAnalyzer {
    audioContext: AudioContext;
    analyser: AnalyserNode;
    source?: MediaStreamAudioSourceNode;
    freqData: Uint8Array;
    bands: number;

    constructor(bands: number) {
        this.bands = bands;
        this.audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
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
        } catch (err) {
            console.error("マイクアクセスエラー:", err);
            throw err; // エラーを再スローして、呼び出し元で処理できるようにする
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
