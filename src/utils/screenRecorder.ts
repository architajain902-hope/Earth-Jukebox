/**
 * screenRecorder.ts
 * Captures Three.js WebGL canvas and mixes synthesized Web Audio output
 * using MediaRecorder for high-quality video clip recording (submission demo).
 */

import { audioEngine } from '../audio/engine';

export class DemoScreenRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private timerId: ReturnType<typeof setInterval> | null = null;
  public isRecording = false;
  public elapsedSeconds = 0;

  startRecording(
    canvas: HTMLCanvasElement,
    onTick: (elapsedSec: number) => void,
    onFinish: (blob: Blob, url: string) => void
  ): boolean {
    if (this.isRecording) return false;

    try {
      // 1. Capture 30 FPS video stream from Three.js WebGL Canvas
      const videoStream = canvas.captureStream(30);

      // 2. Mix audio from Web Audio API destination
      const audioTrack = audioEngine.getAudioTrack();
      const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];
      if (audioTrack) {
        tracks.push(audioTrack);
      }

      const combinedStream = new MediaStream(tracks);

      // 3. Determine best supported MIME type
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
        videoBitsPerSecond: 3500000, // 3.5 Mbps for crisp HD
      });

      this.recordedChunks = [];
      this.elapsedSeconds = 0;
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        if (this.timerId) clearInterval(this.timerId);

        const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder?.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        onFinish(blob, url);

        // Auto trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `earth-616-demo-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      this.mediaRecorder.start(500); // 500ms chunk slices

      // Timer ticker with 2:00 (120s) hard limit
      this.timerId = setInterval(() => {
        this.elapsedSeconds++;
        onTick(this.elapsedSeconds);

        if (this.elapsedSeconds >= 120) {
          this.stopRecording();
        }
      }, 1000);

      return true;
    } catch (err) {
      console.error('Failed to initialize MediaRecorder:', err);
      this.isRecording = false;
      return false;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRecording = false;
  }
}

export const demoScreenRecorder = new DemoScreenRecorder();
