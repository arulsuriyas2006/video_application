import React from 'react';
import {
  Pencil,
  MoveRight,
  Square,
  Circle,
  Highlighter,
  Undo2,
  Trash2,
  Eye,
  EyeOff,
  X,
  Check
} from 'lucide-react';

const COLORS = [
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Coral', value: '#ef4444' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'White', value: '#ffffff' },
];

const STROKE_WIDTHS = [
  { label: 'Thin', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 7 },
];

export default function AnnotationToolbar({
  activeTool,
  setActiveTool,
  activeColor,
  setActiveColor,
  strokeWidth,
  setStrokeWidth,
  onUndo,
  onClear,
  canUndo,
  canClear,
  isVisible,
  setIsVisible,
  onClose,
}) {
  const tools = [
    { id: 'FREE_DRAW', icon: Pencil, label: 'Pen / Free Draw' },
    { id: 'ARROW', icon: MoveRight, label: 'Arrow' },
    { id: 'RECTANGLE', icon: Square, label: 'Rectangle' },
    { id: 'CIRCLE', icon: Circle, label: 'Circle' },
    { id: 'HIGHLIGHT', icon: Highlighter, label: 'Highlighter' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-xs select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Tool Selector Group */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
              className={`p-1.5 rounded-md transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>

      {/* Color Palette */}
      <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
        {COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setActiveColor(c.value)}
            title={c.label}
            className={`w-4 h-4 rounded-full transition-transform ${
              activeColor === c.value
                ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900'
                : 'hover:scale-110 opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>

      {/* Stroke Width Selector */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
        {STROKE_WIDTHS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStrokeWidth(s.value)}
            title={s.label}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
              strokeWidth === s.value
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {s.value}px
          </button>
        ))}
      </div>

      {/* Undo & Clear Actions */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo last shape"
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={!canClear}
          onClick={onClear}
          title="Clear active drawing"
          className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Visibility Toggle & Close */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          title={isVisible ? 'Hide Annotations' : 'Show Annotations'}
          className={`p-1.5 rounded-lg border transition-all ${
            isVisible
              ? 'bg-slate-800 text-slate-200 border-slate-700'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}
        >
          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Done Markup"
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-glow transition-all"
          >
            <Check className="w-3 h-3" />
            <span>Done</span>
          </button>
        )}
      </div>
    </div>
  );
}
