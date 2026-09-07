/**
 * Lookahead-scheduled playback of agent audio (linear16 @ 16 kHz).
 *
 * Incoming chunks are decoded to Float32 and scheduled as AudioBuffers that
 * declare a 16 kHz sample rate; the Web Audio context resamples them to its own
 * rate automatically. `stop()` cuts off any not-yet-played TTS instantly (used
 * on hang-up / barge-in state resets).
 */

export class AgentPlayback {
  private ctx: AudioContext
  private sources = new Set<AudioBufferSourceNode>()
  private nextTime = 0

  constructor(ctx: AudioContext) {
    this.ctx = ctx
  }

  private ensureRolling() {
    if (this.nextTime < this.ctx.currentTime + 0.05) {
      this.nextTime = this.ctx.currentTime + 0.05
    }
  }

  /** Decode raw linear16 (little-endian) bytes and schedule them for playback. */
  pushLinear16Bytes(bytes: ArrayBuffer) {
    const view = new DataView(bytes)
    const n = view.byteLength / 2
    const f32 = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      f32[i] = view.getInt16(i * 2, true) / 32768
    }
    this.pushFloat32(f32)
  }

  pushFloat32(f32: Float32Array<ArrayBuffer>) {
    if (f32.length === 0) return
    this.ensureRolling()
    const buffer = this.ctx.createBuffer(1, f32.length, 16000)
    buffer.copyToChannel(f32, 0)
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.ctx.destination)
    source.onended = () => {
      this.sources.delete(source)
      source.disconnect()
    }
    source.start(this.nextTime)
    this.sources.add(source)
    this.nextTime += buffer.duration
  }

  /** Cut off all buffered/queued agent audio immediately. */
  stop() {
    for (const source of this.sources) {
      try {
        source.stop()
      } catch {
        /* already stopped */
      }
      source.disconnect()
    }
    this.sources.clear()
    this.nextTime = 0
  }
}
