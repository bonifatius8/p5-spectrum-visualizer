export interface AudioData {
    frequencies: Uint8Array | null;
    volume: number;
    maxVolume: number;
    sampleRate: number;
    analyser: AnalyserNode | null;
    audioContext: AudioContext | null;
    bands: number;
    microphoneName: string;
}
