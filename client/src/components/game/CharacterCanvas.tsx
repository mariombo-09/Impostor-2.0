import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface CharacterCanvasProps {
  role: "impostor" | "civil";
  color?: string;
  size?: number;
  animate?: boolean;
}

export function CharacterCanvas({ 
  role, 
  color, 
  size = 200, 
  animate = true 
}: CharacterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const floatOffset = useRef(0);

  const characterColor = role === "impostor" ? "#EF4444" : (color || "#3B82F6");
  const glowColor = role === "impostor" ? "rgba(239, 68, 68, 0.5)" : "rgba(59, 130, 246, 0.3)";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const drawCharacter = (offset: number) => {
      ctx.clearRect(0, 0, size, size);
      
      const centerX = size / 2;
      const centerY = size / 2 + offset;
      const bodyWidth = size * 0.45;
      const bodyHeight = size * 0.5;
      const headRadius = size * 0.18;
      
      if (role === "impostor") {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.fillStyle = characterColor;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY + bodyHeight * 0.15,
        bodyWidth / 2,
        bodyHeight / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.shadowBlur = 0;

      const legWidth = bodyWidth * 0.22;
      const legHeight = bodyHeight * 0.35;
      const legY = centerY + bodyHeight * 0.35;
      
      ctx.beginPath();
      ctx.roundRect(
        centerX - bodyWidth * 0.28 - legWidth / 2,
        legY,
        legWidth,
        legHeight,
        [0, 0, legWidth * 0.4, legWidth * 0.4]
      );
      ctx.fill();
      
      ctx.beginPath();
      ctx.roundRect(
        centerX + bodyWidth * 0.28 - legWidth / 2,
        legY,
        legWidth,
        legHeight,
        [0, 0, legWidth * 0.4, legWidth * 0.4]
      );
      ctx.fill();

      const visorWidth = bodyWidth * 0.55;
      const visorHeight = bodyHeight * 0.28;
      const visorY = centerY - bodyHeight * 0.08;
      
      ctx.fillStyle = role === "impostor" ? "#1E293B" : "#0F172A";
      ctx.beginPath();
      ctx.ellipse(
        centerX + bodyWidth * 0.08,
        visorY,
        visorWidth / 2,
        visorHeight / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.ellipse(
        centerX + bodyWidth * 0.18,
        visorY - visorHeight * 0.15,
        visorWidth * 0.15,
        visorHeight * 0.2,
        -0.3,
        0,
        Math.PI * 2
      );
      ctx.fill();

      const backpackWidth = bodyWidth * 0.2;
      const backpackHeight = bodyHeight * 0.45;
      const backpackX = centerX - bodyWidth / 2 - backpackWidth * 0.6;
      const backpackY = centerY - backpackHeight * 0.2;
      
      ctx.fillStyle = characterColor;
      ctx.beginPath();
      ctx.roundRect(
        backpackX,
        backpackY,
        backpackWidth,
        backpackHeight,
        [backpackWidth * 0.3]
      );
      ctx.fill();
    };

    if (animate) {
      let startTime: number | null = null;
      
      const animateFloat = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        floatOffset.current = Math.sin(elapsed / 500) * 5;
        drawCharacter(floatOffset.current);
        
        animationRef.current = requestAnimationFrame(animateFloat);
      };

      animationRef.current = requestAnimationFrame(animateFloat);
    } else {
      drawCharacter(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [role, characterColor, glowColor, size, animate]);

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        duration: 0.5 
      }}
      className="relative"
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="drop-shadow-lg"
        data-testid={`character-canvas-${role}`}
      />
      {role === "impostor" && (
        <div 
          className="absolute inset-0 rounded-full animate-pulse-glow pointer-events-none"
          style={{ 
            background: "radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)" 
          }}
        />
      )}
    </motion.div>
  );
}
