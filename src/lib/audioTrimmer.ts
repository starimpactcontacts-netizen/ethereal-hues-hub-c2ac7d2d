/**
 * Trims an audio file to a max of 30 seconds and converts to WAV.
 * If the file is already ≤30s, it still converts to WAV for consistency.
 * Uses Web Audio API — fully client-side, no server needed.
 * Falls back to returning the original file if processing fails.
 */
export async function trimAudioTo30s(file: File): Promise<File> {
  const MAX_DURATION = 30;

  // Reject non-audio files immediately
  if (!file.type.startsWith('audio/')) {
    console.warn('Not an audio file, returning original:', file.type);
    return file;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new AudioContext();
    
    let decoded: AudioBuffer;
    try {
      decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    } catch (decodeErr) {
      console.warn('decodeAudioData failed, returning original file:', decodeErr);
      await audioCtx.close();
      return file;
    }

    // Only trim if longer than max, otherwise use full duration
    const duration = decoded.duration <= MAX_DURATION ? decoded.duration : MAX_DURATION;
    const sampleRate = decoded.sampleRate;
    const numChannels = Math.min(decoded.numberOfChannels, 2);
    const frameCount = Math.ceil(duration * sampleRate);

    const offlineCtx = new OfflineAudioContext(numChannels, frameCount, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineCtx.destination);
    source.start(0, 0, duration);
    const rendered = await offlineCtx.startRendering();

    const wavBlob = encodeWAV(rendered);
    const suffix = decoded.duration > MAX_DURATION ? '-30s' : '';
    const trimmedName = file.name.replace(/\.[^.]+$/, '') + suffix + '.wav';

    await audioCtx.close();
    return new File([wavBlob], trimmedName, { type: 'audio/wav' });
  } catch (err) {
    console.warn('Audio trimming failed entirely, returning original file:', err);
    return file;
  }
}

function encodeWAV(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numFrames = buffer.length;
  const dataSize = numFrames * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channels and write samples
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
