// directionalTranslation.ts

import * as p5 from "p5";

/**
 * @interface DirectionalTranslationResult
 * @brief Represents the calculated translation and rotation values.
 * @property {number} translateX - The calculated X-axis translation.
 * @property {number} translateY - The calculated Y-axis translation.
 * @property {number} translateZ - The calculated Z-axis translation.
 * @property {number} rx - The calculated X-axis rotation.
 * @property {number} ry - The calculated Y-axis rotation.
 * @property {number} rz - The calculated Z-axis rotation.
 */
export interface DirectionalTranslationResult {
    translateX: number;
    translateY: number;
    translateZ: number;
    rx: number;
    ry: number;
    rz: number;
}

/**
 * @function calculateDirectionalTranslation
 * @brief Calculates translation and rotation based on frame count, volume, and rotational factors.
 *
 * This function determines the position and orientation of an object in 3D space,
 * influenced by the current frame count and audio volume. The translation is
 * directional, moving along the normal vector derived from the rotations.
 *
 * @param {p5} p - The p5.js instance.
 * @param {number} frameCount - The current frame count from p5.js.
 * @param {number} volume - The current audio volume.
 * @param {number} maxVolume - The maximum observed audio volume, used for normalization.
 * @param {number} rotationFactorX - Factor influencing X-axis rotation speed.
 * @param {number} rotationFactorY - Factor influencing Y-axis rotation speed.
 * @param {number} rotationFactorZ - Factor influencing Z-axis rotation speed.
 * @param {number} translationSensitivityXY - Sensitivity for X and Y axis translation based on volume difference.
 * @param {number} translationSensitivityZ - Sensitivity for Z axis translation based on volume difference.
 * @param {number} baseZ - The base Z-position of the object.
 * @returns {DirectionalTranslationResult} An object containing the calculated translation and rotation values.
 */
export const calculateDirectionalTranslation = (
    p: p5,
    frameCount: number,
    volume: number,
    maxVolume: number,
    rotationFactorX: number,
    rotationFactorY: number,
    rotationFactorZ: number,
    translationSensitivityXY: number,
    translationSensitivityZ: number,
    baseZ: number,
): DirectionalTranslationResult => {
    // Calculate rotations based on frameCount and specified factors
    const rx = Math.cos(frameCount * rotationFactorX) * 0.5;
    const ry = Math.sin(frameCount * rotationFactorY) * 0.7;
    const rz = frameCount * rotationFactorZ;

    // Calculate the normal vector from the rotations
    // This normal vector dictates the direction of translation
    const normalX = -Math.sin(ry);
    const normalY = Math.cos(ry) * Math.sin(rx);
    const normalZ = -Math.cos(ry) * Math.cos(rx);

    // Calculate the difference between max volume and current volume
    const volumeDifference = maxVolume - volume;
    // Normalize the volume difference to a 0-1 range
    const normalizedVolumeDifference =
        maxVolume > 0 ? p.map(volumeDifference, 0, maxVolume, 0, 1, true) : 0;

    // Calculate dynamic translation amounts based on normalized volume difference and sensitivity
    const dynamicTranslationXY =
        normalizedVolumeDifference * translationSensitivityXY;
    const dynamicTranslationZ =
        normalizedVolumeDifference * translationSensitivityZ;

    // Apply the dynamic translation along the normal vector
    const translateX = normalX * dynamicTranslationXY;
    const translateY = normalY * dynamicTranslationXY;
    // The Z translation is relative to the base Z position
    const translateZ = baseZ + normalZ * dynamicTranslationZ;

    return { translateX, translateY, translateZ, rx, ry, rz };
};
