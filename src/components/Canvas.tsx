import React, { useRef, useEffect } from "react";
import "../index.css";

interface CanvasProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  draw: (ctx: CanvasRenderingContext2D) => void;
}

const Canvas: React.FC<CanvasProps> = (props) => {
  const { draw, ...rest } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    draw(context);
  }, [draw]);

  return <canvas ref={canvasRef} {...rest} />;
};

export default Canvas;
