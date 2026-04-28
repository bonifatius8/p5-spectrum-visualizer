// src/dataHolder.ts
export const dataHolder = (() => {
    let audioContext: AudioContext | null = null;
    let fftData: Uint8Array | null = null;

    return {
        setAudioContext: (context: AudioContext) => {
            audioContext = context;
        },
        getAudioContext: () => {
            return audioContext;
        },
        setFftData: (data: Uint8Array) => {
            fftData = data;
        },
        getFftData: () => {
            return fftData;
        },
    };
})();
