// sketchVideoManager.ts
// このファイルは、P5.jsスケッチで使用されるビデオ要素の管理ロジックをカプセル化します。
// 複数のビデオをリストとして扱い、順番に再生する機能を提供します。

import * as p5 from "p5";

/**
 * ビデオ要素の管理を行うクラス。
 * ビデオリストのロード、順番再生、終了時の次のビデオへの切り替えなどを担当します。
 */
export class VideoManager {
    private p: p5; // P5.jsインスタンス
    private videoPaths: string[]; // ロードするビデオファイルのパスの配列
    private currentVideoIndex: number = 0; // 現在再生中のビデオのインデックス
    private currentVideoElement: p5.MediaElement | null = null; // 現在のP5.jsビデオ要素

    /**
     * VideoManagerのコンストラクタ。
     * @param p p5インスタンス
     * @param paths ロードするビデオファイルのパスの配列
     */
    constructor(p: p5, paths: string[]) {
        this.p = p;
        this.videoPaths = paths;
        if (this.videoPaths.length === 0) {
            console.warn("VideoManager: ビデオパスが指定されていません。");
        }
    }

    /**
     * 現在のインデックスのビデオをロードし、設定を行います。
     * 以前のビデオがあれば削除し、新しいビデオのonendedイベントハンドラを設定します。
     * このメソッドは非同期的にビデオをロードするため、ビデオが再生準備ができたときにplay()を呼び出す必要があります。
     * @returns ロードされたp5.MediaElement、またはnull
     */
    private loadAndSetupVideo(): p5.MediaElement | null {
        if (this.currentVideoElement) {
            // 既存のビデオがあれば要素をDOMから削除し、参照をnullにする
            this.currentVideoElement.remove();
            this.currentVideoElement = null;
        }

        if (this.videoPaths.length === 0) {
            console.warn("VideoManager: 再生するビデオがありません。");
            return null;
        }

        const path = this.videoPaths[this.currentVideoIndex];
        console.log(`VideoManager: ビデオをロード中: ${path}`);

        try {
            // createVideoのコールバックはビデオがロードされた後に呼ばれる
            const vid = this.p.createVideo(path, () => {
                // ロード完了後、初期設定を適用
                vid.hide(); // DOM要素として非表示
                vid.volume(0); // 音量を0に設定

                // ビデオが終了したときに次のビデオを再生するハンドラを設定
                // loop()は使わない。代わりにonendedイベントで次のビデオに移行する。
                vid.onended(() => {
                    console.log(
                        `VideoManager: ビデオ '${path}' の再生が終了しました。`
                    );
                    this.playNextVideo();
                });

                // ロード完了後、すぐに再生を開始
                vid.play();
                console.log(
                    `VideoManager: ビデオ '${path}' の再生を開始しました。`
                );
            });

            this.currentVideoElement = vid;
            return vid;
        } catch (error) {
            console.error(
                `ビデオ '${path}' のロード中にエラーが発生しました:`,
                error
            );
            // エラーが発生した場合でも、次のビデオに移行を試みる
            // ただし、無限ループにならないよう、エラー後の自動的な再試行は慎重に。
            // ここでは1秒後に次のビデオを試すことで、一時的なロード失敗に対応
            setTimeout(() => this.playNextVideo(), 1000);
            return null;
        }
    }

    /**
     * VideoManagerを初期化し、最初のビデオのロードと再生を開始します。
     * `setup()`内で一度だけ呼び出すべきです。
     */
    public initializeAndPlay(): void {
        if (this.videoPaths.length === 0) return;
        this.currentVideoIndex = 0;
        this.loadAndSetupVideo();
    }

    /**
     * 次のビデオをリストからロードして再生します。
     * リストの最後に達したら最初のビデオに戻ります。
     * これはビデオのonendedイベントハンドラから呼び出されます。
     */
    private playNextVideo(): void {
        if (this.videoPaths.length === 0) return;
        this.currentVideoIndex =
            (this.currentVideoIndex + 1) % this.videoPaths.length;
        this.loadAndSetupVideo();
    }

    /**
     * 現在再生中のビデオ要素を取得します。
     * P5.jsのtexture()関数で使用されます。
     * @returns p5.MediaElement、またはnull
     */
    public getVideoElement(): p5.MediaElement | null {
        return this.currentVideoElement;
    }
}
