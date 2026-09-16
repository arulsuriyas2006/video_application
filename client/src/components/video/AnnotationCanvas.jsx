import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function AnnotationCanvas({
  videoRef,
  isDrawingMode = false,
  activeTool = 'FREE_DRAW',
  activeColor = '#ef4444',
  strokeWidth = 3,
  activeShapes = [],
  onShapesChange,
  savedAnnotations = [],
  currentTime = 0,
  activeCommentId = null,
  isVisible = true,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);

  // Resize canvas to match the exact displayed bounding box of the video
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef?.current;
    if (!canvas || !video) return;

    const rect = video.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    renderAll();
  }, [videoRef]);

  // Convert mouse/touch event to normalized (0.0 - 1.0) coordinates
  const getNormalizedCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rawX = (clientX - rect.left) / rect.width;
    const rawY = (clientY - rect.top) / rect.height;

    return {
      x: Math.max(0, Math.min(1, rawX)),
      y: Math.max(0, Math.min(1, rawY)),
    };
  };

  // Draw a single shape on 2D context
  const drawShape = (ctx, shape, width, height) => {
    ctx.save();
    ctx.strokeStyle = shape.color || '#ef4444';
    ctx.lineWidth = shape.strokeWidth || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (shape.type) {
      case 'FREE_DRAW': {
        if (!shape.points || shape.points.length < 2) break;
        ctx.beginPath();
        const startX = shape.points[0].x * width;
        const startY = shape.points[0].y * height;
        ctx.moveTo(startX, startY);

        for (let i = 1; i < shape.points.length; i++) {
          const ptX = shape.points[i].x * width;
          const ptY = shape.points[i].y * height;
          ctx.lineTo(ptX, ptY);
        }
        ctx.stroke();
        break;
      }

      case 'HIGHLIGHT': {
        if (!shape.points || shape.points.length < 2) break;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = Math.max(16, (shape.strokeWidth || 3) * 4);
        ctx.beginPath();
        const startX = shape.points[0].x * width;
        const startY = shape.points[0].y * height;
        ctx.moveTo(startX, startY);

        for (let i = 1; i < shape.points.length; i++) {
          const ptX = shape.points[i].x * width;
          const ptY = shape.points[i].y * height;
          ctx.lineTo(ptX, ptY);
        }
        ctx.stroke();
        break;
      }

      case 'ARROW': {
        const { arrow } = shape;
        if (!arrow) break;
        const fromX = arrow.startX * width;
        const fromY = arrow.startY * height;
        const toX = arrow.endX * width;
        const toY = arrow.endY * height;

        const headlen = Math.max(12, (shape.strokeWidth || 3) * 3.5);
        const angle = Math.atan2(toY - fromY, toX - fromX);

        // Draw main line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Draw arrowhead
        ctx.fillStyle = shape.color || '#ef4444';
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
          toX - headlen * Math.cos(angle - Math.PI / 6),
          toY - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          toX - headlen * Math.cos(angle + Math.PI / 6),
          toY - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'RECTANGLE': {
        const { rect } = shape;
        if (!rect) break;
        const rx = rect.x * width;
        const ry = rect.y * height;
        const rw = rect.width * width;
        const rh = rect.height * height;

        ctx.fillStyle = `${shape.color}18`;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(rx, ry, rw, rh, 6) : ctx.rect(rx, ry, rw, rh);
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'CIRCLE': {
        const { circle } = shape;
        if (!circle) break;
        const cx = circle.cx * width;
        const cy = circle.cy * height;
        const rx = Math.max(2, circle.rx * width);
        const ry = Math.max(2, circle.ry * height);

        ctx.fillStyle = `${shape.color}15`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;
      }

      default:
        break;
    }
    ctx.restore();
  };

  // Main render pass
  const renderAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!isVisible) return;

    // 1. Render saved annotations for current timestamp or active comment
    savedAnnotations.forEach((ann) => {
      // Show if matching active comment or within 0.75 seconds of current playback
      const isSelectedComment =
        activeCommentId &&
        (ann.commentId?._id === activeCommentId ||
          ann.commentId === activeCommentId ||
          ann._id === activeCommentId);

      const isCurrentTimeMatch =
        Math.abs(ann.timestamp - currentTime) <= 0.75;

      if (isSelectedComment || isCurrentTimeMatch) {
        ann.shapes?.forEach((shape) => {
          drawShape(ctx, shape, rect.width, rect.height);
        });
      }
    });

    // 2. Render active in-progress drawing shapes (for pending comment)
    activeShapes.forEach((shape) => {
      drawShape(ctx, shape, rect.width, rect.height);
    });

    // 3. Render current mouse-drag preview
    if (currentShape) {
      drawShape(ctx, currentShape, rect.width, rect.height);
    }
  }, [
    isVisible,
    savedAnnotations,
    activeShapes,
    currentShape,
    currentTime,
    activeCommentId,
  ]);

  // Sync canvas size on video load & window resize
  useEffect(() => {
    updateCanvasSize();
    const handleResize = () => updateCanvasSize();
    window.addEventListener('resize', handleResize);

    const video = videoRef?.current;
    if (video) {
      video.addEventListener('loadeddata', updateCanvasSize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (video) {
        video.removeEventListener('loadeddata', updateCanvasSize);
      }
    };
  }, [updateCanvasSize, videoRef]);

  // Re-render when dependencies change
  useEffect(() => {
    renderAll();
  }, [renderAll]);

  // Mouse / Touch handlers for drawing
  const handleStart = (e) => {
    if (!isDrawingMode) return;
    e.preventDefault();
    const { x, y } = getNormalizedCoords(e);
    setIsDrawing(true);

    if (activeTool === 'FREE_DRAW' || activeTool === 'HIGHLIGHT') {
      setCurrentShape({
        type: activeTool,
        color: activeColor,
        strokeWidth,
        points: [{ x, y }],
      });
    } else if (activeTool === 'ARROW') {
      setCurrentShape({
        type: 'ARROW',
        color: activeColor,
        strokeWidth,
        arrow: { startX: x, startY: y, endX: x, endY: y },
      });
    } else if (activeTool === 'RECTANGLE') {
      setCurrentShape({
        type: 'RECTANGLE',
        color: activeColor,
        strokeWidth,
        _origin: { x, y },
        rect: { x, y, width: 0, height: 0 },
      });
    } else if (activeTool === 'CIRCLE') {
      setCurrentShape({
        type: 'CIRCLE',
        color: activeColor,
        strokeWidth,
        _origin: { x, y },
        circle: { cx: x, cy: y, rx: 0, ry: 0 },
      });
    }
  };

  const handleMove = (e) => {
    if (!isDrawing || !currentShape || !isDrawingMode) return;
    e.preventDefault();
    const { x, y } = getNormalizedCoords(e);

    if (currentShape.type === 'FREE_DRAW' || currentShape.type === 'HIGHLIGHT') {
      setCurrentShape((prev) => ({
        ...prev,
        points: [...prev.points, { x, y }],
      }));
    } else if (currentShape.type === 'ARROW') {
      setCurrentShape((prev) => ({
        ...prev,
        arrow: {
          ...prev.arrow,
          endX: x,
          endY: y,
        },
      }));
    } else if (currentShape.type === 'RECTANGLE') {
      const orig = currentShape._origin;
      const left = Math.min(orig.x, x);
      const top = Math.min(orig.y, y);
      const width = Math.abs(x - orig.x);
      const height = Math.abs(y - orig.y);

      setCurrentShape((prev) => ({
        ...prev,
        rect: { x: left, y: top, width, height },
      }));
    } else if (currentShape.type === 'CIRCLE') {
      const orig = currentShape._origin;
      const rx = Math.abs(x - orig.x) / 2;
      const ry = Math.abs(y - orig.y) / 2;
      const cx = Math.min(orig.x, x) + rx;
      const cy = Math.min(orig.y, y) + ry;

      setCurrentShape((prev) => ({
        ...prev,
        circle: { cx, cy, rx, ry },
      }));
    }
  };

  const handleEnd = (e) => {
    if (!isDrawing || !currentShape || !isDrawingMode) return;
    setIsDrawing(false);

    // Filter out accidental clicks without real drawing
    let isValidShape = false;
    if (
      (currentShape.type === 'FREE_DRAW' || currentShape.type === 'HIGHLIGHT') &&
      currentShape.points.length > 1
    ) {
      isValidShape = true;
    } else if (
      currentShape.type === 'ARROW' &&
      (Math.abs(currentShape.arrow.endX - currentShape.arrow.startX) > 0.01 ||
        Math.abs(currentShape.arrow.endY - currentShape.arrow.startY) > 0.01)
    ) {
      isValidShape = true;
    } else if (
      currentShape.type === 'RECTANGLE' &&
      currentShape.rect.width > 0.01 &&
      currentShape.rect.height > 0.01
    ) {
      isValidShape = true;
    } else if (
      currentShape.type === 'CIRCLE' &&
      currentShape.circle.rx > 0.01 &&
      currentShape.circle.ry > 0.01
    ) {
      isValidShape = true;
    }

    if (isValidShape) {
      // Clean up internal properties before storing
      const cleanShape = { ...currentShape };
      delete cleanShape._origin;

      if (onShapesChange) {
        onShapesChange([...activeShapes, cleanShape]);
      }
    }

    setCurrentShape(null);
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-20 ${
        isDrawingMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className="w-full h-full block"
      />
    </div>
  );
}
