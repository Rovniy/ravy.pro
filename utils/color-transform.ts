// Client-only ICC color transform via Little CMS (WebAssembly).
// The lcms-wasm module is imported lazily so it (and its ~hundreds-of-KB WASM
// binary) is only fetched the first time a color transform is actually needed.
// Pure byte-level ICC parsing/embedding lives in `utils/icc.ts`; this file owns
// the async, WASM-backed pixel transform only.

// The WASM asset URL — Vite emits the file and hands back its URL string. This
// import is cheap (just a string); the binary itself is fetched at instantiate.
// @ts-expect-error — Vite `?url` asset import, typed via vite/client.
import wasmUrl from 'lcms-wasm/dist/lcms.wasm?url'

interface LcmsModule {
  cmsOpenProfileFromMem: (data: Uint8Array, len: number) => number
  cmsCreate_sRGBProfile: () => number
  cmsCloseProfile: (p: number) => void
  cmsFormatterForColorspaceOfProfile: (p: number, bytesPerSample: number, isFloat: boolean) => number
  cmsCreateTransform: (inP: number, inFmt: number, outP: number, outFmt: number, intent: number, flags: number) => number
  cmsDeleteTransform: (t: number) => void
  cmsDoTransform: (t: number, data: Uint8ClampedArray, nPixels: number) => Uint8Array
}

let modulePromise: Promise<{ lcms: LcmsModule, INTENT: number, FLAGS: number }> | null = null

async function getLcms() {
  if (!modulePromise) {
    modulePromise = (async () => {
      const mod = await import('lcms-wasm') as unknown as {
        instantiate: (opts?: { locateFile?: (name: string) => string }) => Promise<LcmsModule>
        INTENT_RELATIVE_COLORIMETRIC: number
        cmsFLAGS_BLACKPOINTCOMPENSATION: number
      }
      const lcms = await mod.instantiate({ locateFile: () => wasmUrl })
      return {
        lcms,
        INTENT: mod.INTENT_RELATIVE_COLORIMETRIC,
        FLAGS: mod.cmsFLAGS_BLACKPOINTCOMPENSATION,
      }
    })()
  }
  return modulePromise
}

/**
 * Transform RGBA pixels from the source ICC profile's color space into sRGB.
 * The alpha channel is carried through untouched (Little CMS formatters here
 * are RGB-only). Throws if the profile or transform can't be built.
 */
export async function transformToSrgb(rgba: Uint8ClampedArray, srcProfileBytes: Uint8Array): Promise<Uint8ClampedArray> {
  const { lcms, INTENT, FLAGS } = await getLcms()

  const src = lcms.cmsOpenProfileFromMem(srcProfileBytes, srcProfileBytes.length)
  if (!src)
    throw new Error('Could not read the embedded ICC profile.')
  const dst = lcms.cmsCreate_sRGBProfile()
  try {
    const inFmt = lcms.cmsFormatterForColorspaceOfProfile(src, 1, false)
    const outFmt = lcms.cmsFormatterForColorspaceOfProfile(dst, 1, false)
    const transform = lcms.cmsCreateTransform(src, inFmt, dst, outFmt, INTENT, FLAGS)
    if (!transform)
      throw new Error('Could not build the color transform (unsupported profile).')
    try {
      const nPixels = rgba.length / 4
      // Formatters are 3-channel RGB; strip alpha, transform, then restore it.
      const rgb = new Uint8ClampedArray(nPixels * 3)
      for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
        rgb[j] = rgba[i]
        rgb[j + 1] = rgba[i + 1]
        rgb[j + 2] = rgba[i + 2]
      }
      const outRgb = lcms.cmsDoTransform(transform, rgb, nPixels)
      const out = new Uint8ClampedArray(rgba.length)
      for (let i = 0, j = 0; i < out.length; i += 4, j += 3) {
        out[i] = outRgb[j]
        out[i + 1] = outRgb[j + 1]
        out[i + 2] = outRgb[j + 2]
        out[i + 3] = rgba[i + 3]
      }
      return out
    }
    finally {
      lcms.cmsDeleteTransform(transform)
    }
  }
  finally {
    lcms.cmsCloseProfile(src)
    lcms.cmsCloseProfile(dst)
  }
}
