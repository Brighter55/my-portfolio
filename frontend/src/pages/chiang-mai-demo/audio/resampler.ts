/**
 * Linear-interpolation resampler: microphone sample rate (48k / 44.1k) -> 16k.
 *
 * Deepgram's agent expects linear16 @ 16 kHz. AudioWorklet chunks are 20ms of
 * Float32 at the context rate; we down-sample each chunk to Int16 PCM. A small
 * per-chunk history keeps interpolation continuous across chunk boundaries.
 */

export class Downsampler {
  readonly targetRate = 16000
  /** Running count of input samples consumed across all chunks. */
  private totalIn = 0
  /** Running count of output samples already emitted. */
  private outEmitted = 0
  /** Tail of the previous chunk, replayed so interpolation can read behind the frontier. */
  private history: Float32Array = new Float32Array(0)

  /** Down-sample one chunk of Float32 audio to 16-bit signed PCM @ 16k. */
  process(input: Float32Array, srcRate: number): Int16Array {
    const ratio = srcRate / this.targetRate
    const historyLen = this.history.length
    const absStart = this.totalIn - historyLen // abs index of merged[0]
    const merged = new Float32Array(historyLen + input.length)
    merged.set(this.history, 0)
    merged.set(input, historyLen)
    this.totalIn += input.length

    // Pull-based linear interpolation over absolute input time. Output sample k
    // lands at input time k * ratio. Stop when we lack the +1 lookahead sample.
    const out: number[] = []
    let time = this.outEmitted * ratio
    const lastUsable = this.totalIn - 1
    while (Math.floor(time) + 1 <= lastUsable) {
      const g = Math.floor(time)
      const frac = time - g
      const a = merged[g - absStart]
      const b = merged[g + 1 - absStart]
      out.push(a + (b - a) * frac)
      this.outEmitted += 1
      time = this.outEmitted * ratio
    }

    // Keep just enough history for the next chunk's leading interpolation taps.
    const keep = Math.ceil(ratio) + 1
    this.history = input.slice(Math.max(0, input.length - keep))

    const pcm = new Int16Array(out.length)
    for (let i = 0; i < out.length; i++) {
      const s = Math.max(-1, Math.min(1, out[i]))
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return pcm
  }
}

/** Convert a signed 16-bit PCM array to a little-endian byte buffer (linear16). */
export function pcm16ToBytes(pcm: Int16Array): ArrayBuffer {
  const bytes = new DataView(new ArrayBuffer(pcm.length * 2))
  for (let i = 0; i < pcm.length; i++) bytes.setInt16(i * 2, pcm[i], true)
  return bytes.buffer
}
