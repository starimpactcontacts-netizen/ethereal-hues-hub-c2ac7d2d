import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Video, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FlywheelVideoExportProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  sourceCanvas: HTMLCanvasElement | null;
  judgeUsername: string;
  winnerUsername: string | null;
  accentColor: string;
}

export default function FlywheelVideoExport({
  isRecording,
  onStartRecording,
  onStopRecording,
  sourceCanvas,
  judgeUsername,
  winnerUsername,
  accentColor,
}: FlywheelVideoExportProps) {
  const [exporting, setExporting] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [recordingDone, setRecordingDone] = useState(false);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number>(0);

  // 9:16 TikTok dimensions
  const EXPORT_W = 1080;
  const EXPORT_H = 1920;

  const drawExportFrame = useCallback(() => {
    const exportCanvas = exportCanvasRef.current;
    const src = sourceCanvas;
    if (!exportCanvas || !src) return;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

    // Draw wheel centered in 9:16 frame
    const wheelSize = Math.min(EXPORT_W - 80, 900);
    const wx = (EXPORT_W - wheelSize) / 2;
    const wy = (EXPORT_H - wheelSize) / 2 - 60;
    ctx.drawImage(src, wx, wy, wheelSize, wheelSize);

    // Top branding bar
    ctx.fillStyle = accentColor + '15';
    ctx.fillRect(0, 0, EXPORT_W, 140);
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 140);
    ctx.lineTo(EXPORT_W, 140);
    ctx.stroke();

    // LOOPGATE wordmark
    ctx.fillStyle = accentColor;
    ctx.font = '700 56px "Bebas Neue", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOOPGATE', EXPORT_W / 2, 70);

    // Subtitle
    ctx.fillStyle = '#ffffff60';
    ctx.font = '400 28px "Bebas Neue", system-ui, sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('F L Y W H E E L', EXPORT_W / 2, 115);

    // Judge tag at bottom
    ctx.fillStyle = accentColor + '15';
    ctx.fillRect(0, EXPORT_H - 180, EXPORT_W, 180);
    ctx.strokeStyle = accentColor + '40';
    ctx.beginPath();
    ctx.moveTo(0, EXPORT_H - 180);
    ctx.lineTo(EXPORT_W, EXPORT_H - 180);
    ctx.stroke();

    ctx.fillStyle = '#ffffff40';
    ctx.font = '400 24px "Bebas Neue", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JUDGED BY', EXPORT_W / 2, EXPORT_H - 130);

    ctx.fillStyle = '#fff';
    ctx.font = '700 48px "Bebas Neue", system-ui, sans-serif';
    ctx.fillText(`@${judgeUsername.toUpperCase()}`, EXPORT_W / 2, EXPORT_H - 72);

    // Winner overlay (if winner is set)
    if (winnerUsername) {
      // Accent glow circle hint
      ctx.beginPath();
      ctx.arc(EXPORT_W / 2, wy + wheelSize + 60, 6, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();

      ctx.fillStyle = accentColor;
      ctx.font = '700 40px "Bebas Neue", system-ui, sans-serif';
      ctx.fillText(`@${winnerUsername.toUpperCase()}`, EXPORT_W / 2, wy + wheelSize + 90);

      ctx.fillStyle = '#ffffff50';
      ctx.font = '400 22px "Bebas Neue", system-ui, sans-serif';
      ctx.fillText('THE FLYWHEEL CHOSE', EXPORT_W / 2, wy + wheelSize + 40);
    }

    // Decorative corner accents
    const cornerSize = 30;
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(20, 160 + cornerSize);
    ctx.lineTo(20, 160);
    ctx.lineTo(20 + cornerSize, 160);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(EXPORT_W - 20, 160 + cornerSize);
    ctx.lineTo(EXPORT_W - 20, 160);
    ctx.lineTo(EXPORT_W - 20 - cornerSize, 160);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(20, EXPORT_H - 200 - cornerSize);
    ctx.lineTo(20, EXPORT_H - 200);
    ctx.lineTo(20 + cornerSize, EXPORT_H - 200);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(EXPORT_W - 20, EXPORT_H - 200 - cornerSize);
    ctx.lineTo(EXPORT_W - 20, EXPORT_H - 200);
    ctx.lineTo(EXPORT_W - 20 - cornerSize, EXPORT_H - 200);
    ctx.stroke();
  }, [sourceCanvas, judgeUsername, winnerUsername, accentColor]);

  // Continuous render loop while recording
  useEffect(() => {
    if (!isRecording) return;

    const loop = () => {
      drawExportFrame();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRecording, drawExportFrame]);

  const startRecording = useCallback(() => {
    const exportCanvas = exportCanvasRef.current;
    if (!exportCanvas) return;

    exportCanvas.width = EXPORT_W;
    exportCanvas.height = EXPORT_H;

    chunksRef.current = [];
    setVideoUrl(null);
    setRecordingDone(false);

    const stream = exportCanvas.captureStream(30);
    
    // Try webm first, fall back to mp4
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

    const recorder = new MediaRecorder(stream, { 
      mimeType,
      videoBitsPerSecond: 5_000_000 
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setRecordingDone(true);
      setExporting(false);
    };

    recorderRef.current = recorder;
    recorder.start(100);
    setExporting(true);
    onStartRecording();
  }, [onStartRecording]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    onStopRecording();
  }, [onStopRecording]);

  const downloadVideo = useCallback(() => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `loopgate-flywheel-${winnerUsername || 'spin'}.webm`;
    a.click();
    toast.success('Video downloaded! Ready for TikTok 🎬');
  }, [videoUrl, winnerUsername]);

  const dismissVideo = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setRecordingDone(false);
  }, [videoUrl]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [videoUrl]);

  return (
    <>
      {/* Hidden export canvas */}
      <canvas 
        ref={exportCanvasRef} 
        width={EXPORT_W} 
        height={EXPORT_H} 
        className="hidden" 
      />

      {/* Record button */}
      {!exporting && !recordingDone && (
        <Button
          onClick={startRecording}
          size="sm"
          variant="ghost"
          className="text-white/50 hover:text-white hover:bg-white/8 border border-white/10 font-display tracking-wider text-xs"
        >
          <Video className="w-3.5 h-3.5 mr-1.5 text-red-400" />
          Record
        </Button>
      )}

      {/* Recording indicator */}
      {exporting && (
        <Button
          onClick={stopRecording}
          size="sm"
          className="bg-red-600 hover:bg-red-500 text-white font-display tracking-wider text-xs animate-pulse"
        >
          <div className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
          Stop Recording
        </Button>
      )}

      {/* Download overlay */}
      <AnimatePresence>
        {recordingDone && videoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-4 right-4 z-[110] bg-surface-1 border border-gold/30 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-sm font-display font-bold text-white tracking-wide">Video Ready</span>
              </div>
              <button onClick={dismissVideo} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>
            
            <p className="text-[11px] text-white/40 mb-3">
              9:16 TikTok-ready with Loopgate branding · @{judgeUsername}
            </p>

            <div className="flex gap-2">
              <Button
                onClick={downloadVideo}
                className="flex-1 bg-gold text-black hover:bg-gold/90 font-display font-bold tracking-wider text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download Video
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
