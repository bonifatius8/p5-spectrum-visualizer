/**
 * メインカンバスにフレームバッファを描画する関数オブジェクト。
 *
 * @param {p5.Graphics} frameBuffer - フレームバッファ
 * @param {p5} p - p5.jsインスタンス
 */
const drawMainCanvas = (frameBuffer: p5.Graphics, p: p5) => {
    return {
        draw: (planeSize: number) => {
            p.push();
            // planeにテクスチャを貼り付ける
            p.texture(frameBuffer);
            p.plane(planeSize, planeSize);
            p.pop();
        },
    };
};

export default drawMainCanvas;
