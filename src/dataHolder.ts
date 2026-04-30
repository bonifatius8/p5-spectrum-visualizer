// src/dataHolder.ts
export const dataHolder = (() => {
    let audioContext: AudioContext | null = null;
    let fftData: Uint8Array | null = null;

    return {
        setAudioContext: (context: AudioContext): void => {
            audioContext = context;
        },
        getAudioContext: (): AudioContext | null => {
            return audioContext;
        },
        setFftData: (data: Uint8Array): void => {
            fftData = data;
        },
        getFftData: (): Uint8Array | null => {
            return fftData;
        },
    };
})();
