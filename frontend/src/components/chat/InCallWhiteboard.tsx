'use client';
// ─── In-Call Collaborative Whiteboard (HTML5 Canvas Engine) ─────────────────────

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pen, Type, StickyNote, Square, ArrowRight, Eraser,
  RotateCcw, Trash2, Download, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InCallWhiteboardProps {
  roomId: string;
  onEmitDraw?: (data: unknown) => void;
  onEmitClear?: () => void;
  remoteDrawEvent?: any;
  remoteClearEvent?: boolean;
}

type ToolType = 'pen' | 'text' | 'sticky' | 'rect' | 'arrow' | 'eraser';

const COLOR_PALETTE = [
  { label: 'White', value: '#ffffff' },
  { label: 'Sky', value: '#38bdf8' },
  { label: 'Emerald', value: '#34d399' },
  { label: 'Amber', value: '#fbbf24' },
  { label: 'Rose', value: '#f43f5e' },
];

export function InCallWhiteboard({
  roomId,
  onEmitDraw,
  onEmitClear,
  remoteDrawEvent,
  remoteClearEvent,
}: InCallWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [activeColor, setActiveColor] = useState('#38bdf8');
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Click-to-type text overlay
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [inlineText, setInlineText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Drag-and-drop Sticky notes
  const [stickyNotes, setStickyNotes] = useState<Array<{ id: string; x: number; y: number; text: string; color: string }>>([]);

  // Undo history buffer
  const historyRef = useRef<ImageData[]>([]);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // ── Resize canvas to fill container ──────────────────────────────────────────
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Preserve existing drawing during resize
    const ctx = canvas.getContext('2d');
    let tempImage: ImageData | null = null;
    if (canvas.width > 0 && canvas.height > 0 && ctx) {
      try {
        tempImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {}
    }

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    if (tempImage && ctx) {
      ctx.putImageData(tempImage, 0, 0);
    }
  }, []);

  useEffect(() => {
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, [syncCanvasSize]);

  // Focus textarea when text tool clicked
  useEffect(() => {
    if (textPos && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [textPos]);

  // Save current canvas state to history
  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (historyRef.current.length > 20) historyRef.current.shift();
    } catch {}
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const prev = historyRef.current.pop();
    if (prev) ctx.putImageData(prev, 0, 0);
  };

  const handleClear = () => {
    pushHistory();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStickyNotes([]);
    onEmitClear?.();
  };

  // ── Commit inline text directly onto Canvas ─────────────────────────────────
  const commitText = () => {
    if (!textPos || !inlineText.trim()) {
      setTextPos(null);
      setInlineText('');
      return;
    }

    pushHistory();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = activeColor;
      ctx.font = '16px Inter, sans-serif';
      ctx.textBaseline = 'top';

      const lines = inlineText.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, textPos.x, textPos.y + i * 22);
      });

      onEmitDraw?.({
        type: 'text',
        x: textPos.x,
        y: textPos.y,
        text: inlineText,
        color: activeColor,
        fontSize: 16,
      });
    }

    setTextPos(null);
    setInlineText('');
  };

  // ── Remote Draw Listener ───────────────────────────────────────────────────
  useEffect(() => {
    if (!remoteDrawEvent) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (remoteDrawEvent.type === 'pen' && remoteDrawEvent.points) {
      ctx.strokeStyle = remoteDrawEvent.color || '#38bdf8';
      ctx.lineWidth = remoteDrawEvent.lineWidth || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      remoteDrawEvent.points.forEach((pt: { x: number; y: number }, idx: number) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    } else if (remoteDrawEvent.type === 'text') {
      ctx.fillStyle = remoteDrawEvent.color || '#38bdf8';
      ctx.font = '16px Inter, sans-serif';
      ctx.textBaseline = 'top';
      const lines = (remoteDrawEvent.text || '').split('\n');
      lines.forEach((line: string, i: number) => {
        ctx.fillText(line, remoteDrawEvent.x, remoteDrawEvent.y + i * 22);
      });
    }
  }, [remoteDrawEvent]);

  useEffect(() => {
    if (remoteClearEvent) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setStickyNotes([]);
      }
    }
  }, [remoteClearEvent]);

  // ── Mouse & Touch Drawing Handlers ──────────────────────────────────────────
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    const me = e as React.MouseEvent<HTMLCanvasElement>;
    return {
      x: me.clientX - rect.left,
      y: me.clientY - rect.top,
    };
  };

  const pointsRef = useRef<Array<{ x: number; y: number }>>([]);

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool === 'text') {
      if (textPos) commitText();
      else {
        const coords = getCoords(e);
        setTextPos(coords);
      }
      return;
    }

    if (activeTool === 'sticky') {
      const coords = getCoords(e);
      setStickyNotes((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          x: coords.x,
          y: coords.y,
          text: 'Note idea...',
          color: activeColor,
        },
      ]);
      setActiveTool('pen');
      return;
    }

    pushHistory();
    setIsDrawing(true);
    const coords = getCoords(e);
    startPosRef.current = coords;
    pointsRef.current = [coords];

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen' || activeTool === 'eraser') {
      ctx.strokeStyle = activeTool === 'eraser' ? '#171717' : activeColor;
      ctx.lineWidth = activeTool === 'eraser' ? lineWidth * 4 : lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      pointsRef.current.push(coords);
    }
  };

  const handleEnd = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const endCoords = getCoords(e);

    if (activeTool === 'rect') {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = lineWidth;
      const w = endCoords.x - startPosRef.current.x;
      const h = endCoords.y - startPosRef.current.y;
      ctx.strokeRect(startPosRef.current.x, startPosRef.current.y, w, h);
    } else if (activeTool === 'arrow') {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
      ctx.lineTo(endCoords.x, endCoords.y);
      ctx.stroke();

      // Arrowhead
      const headlen = 12;
      const dx = endCoords.x - startPosRef.current.x;
      const dy = endCoords.y - startPosRef.current.y;
      const angle = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.moveTo(endCoords.x, endCoords.y);
      ctx.lineTo(endCoords.x - headlen * Math.cos(angle - Math.PI / 6), endCoords.y - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(endCoords.x, endCoords.y);
      ctx.lineTo(endCoords.x - headlen * Math.cos(angle + Math.PI / 6), endCoords.y - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    } else if (activeTool === 'pen') {
      onEmitDraw?.({
        type: 'pen',
        points: pointsRef.current,
        color: activeColor,
        lineWidth,
      });
    }
  };

  // ── Export Canvas to PNG ────────────────────────────────────────────────────
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `projecthive-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 text-white select-none rounded-2xl overflow-hidden border border-border/40">
      {/* ─── Top Whiteboard Toolbar ──────────────────────────────────────── */}
      <div className="h-12 bg-neutral-900/90 backdrop-blur-md border-b border-border/40 px-3 flex items-center justify-between gap-2 shrink-0 z-20">
        {/* Tool selector */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl">
          {[
            { id: 'pen' as const, icon: Pen, title: 'Draw Pen' },
            { id: 'text' as const, icon: Type, title: 'Click-to-Type Text' },
            { id: 'sticky' as const, icon: StickyNote, title: 'Sticky Note' },
            { id: 'rect' as const, icon: Square, title: 'Rectangle' },
            { id: 'arrow' as const, icon: ArrowRight, title: 'Arrow' },
            { id: 'eraser' as const, icon: Eraser, title: 'Eraser' },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  if (textPos) commitText();
                  setActiveTool(tool.id);
                }}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all tap-press',
                  activeTool === tool.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                )}
                title={tool.title}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Color Palette */}
        <div className="hidden sm:flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-xl">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c.value}
              onClick={() => setActiveColor(c.value)}
              className={cn(
                'w-5 h-5 rounded-full transition-transform',
                activeColor === c.value && 'ring-2 ring-white scale-110'
              )}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>

        {/* Stroke Width Slider */}
        <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400">
          <span>Width:</span>
          <input
            type="range"
            min={1}
            max={12}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-16 accent-primary cursor-pointer"
          />
        </div>

        {/* Actions: Undo, Clear, Export */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 tap-press"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 tap-press"
            title="Clear Board"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={exportPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl text-xs font-semibold tap-press transition-colors"
            title="Export as PNG"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Export PNG</span>
          </button>
        </div>
      </div>

      {/* ─── Canvas Workspace ────────────────────────────────────────────── */}
      <div ref={containerRef} className="relative flex-1 w-full h-full cursor-crosshair overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="absolute inset-0 w-full h-full block"
        />

        {/* ── Click-to-Type Live Textarea Overlay ─────────────────────────── */}
        {textPos && (
          <div
            className="absolute z-30 flex flex-col gap-1 p-1 bg-neutral-900/95 border border-primary/50 rounded-xl shadow-2xl"
            style={{ left: textPos.x, top: textPos.y }}
          >
            <textarea
              ref={textareaRef}
              rows={2}
              value={inlineText}
              onChange={(e) => setInlineText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitText();
                } else if (e.key === 'Escape') {
                  setTextPos(null);
                  setInlineText('');
                }
              }}
              placeholder="Type note (Enter to place, Shift+Enter newline)…"
              className="bg-transparent text-sm p-1.5 focus:outline-none resize-none min-w-[200px]"
              style={{ color: activeColor }}
            />
            <div className="flex justify-end gap-1 px-1 pb-1">
              <button
                onClick={() => { setTextPos(null); setInlineText(''); }}
                className="px-2 py-0.5 text-[10px] text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={commitText}
                className="px-2.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-md"
              >
                Place Text
              </button>
            </div>
          </div>
        )}

        {/* ── Sticky Notes Layer ─────────────────────────────────────────── */}
        {stickyNotes.map((note) => (
          <div
            key={note.id}
            style={{ left: note.x, top: note.y }}
            className="absolute z-20 w-44 p-3 rounded-xl bg-amber-200 text-neutral-900 shadow-xl border border-amber-300 font-sans select-text"
          >
            <textarea
              value={note.text}
              onChange={(e) => {
                const val = e.target.value;
                setStickyNotes((prev) =>
                  prev.map((n) => (n.id === note.id ? { ...n, text: val } : n))
                );
              }}
              className="w-full h-24 bg-transparent resize-none text-xs font-medium focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                onClick={() => setStickyNotes((prev) => prev.filter((n) => n.id !== note.id))}
                className="text-[10px] text-neutral-600 hover:text-rose-600 font-bold"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
