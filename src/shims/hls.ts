// Fallback shim for optional hls.js dependency in @react-three/drei VideoTexture
export const Events = {
  ERROR: 'hlsError',
  MANIFEST_LOADED: 'hlsManifestLoaded',
};

export default class Hls {
  static isSupported(): boolean {
    return false;
  }
}
