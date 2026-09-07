// Plain-JS AudioWorklet (no imports — the worklet global has no bundler).
// Captures the first input channel and posts a Float32Array to the main thread
// roughly every 20 ms; the main thread down-samples it to 16 kHz linear16.
// (ESLint/TS ignore this file — Vite serves it as-is to addModule().)

class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffer = []
    this.length = 0
    this.flushAt = Math.max(256, Math.round(sampleRate * 0.02))
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0]
    if (channel) {
      for (let i = 0; i < channel.length; i++) {
        this.buffer.push(channel[i])
        this.length += 1
      }
      if (this.length >= this.flushAt) {
        const out = new Float32Array(this.length)
        out.set(this.buffer, 0)
        this.port.postMessage(out, [out.buffer])
        this.buffer = []
        this.length = 0
      }
    }
    return true // keep the processor alive
  }
}

registerProcessor('pcm-capture', PcmCaptureProcessor)
