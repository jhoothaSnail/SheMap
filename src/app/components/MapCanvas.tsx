import { useEffect, useRef } from "react";

interface MapCanvasProps {
  activeRoute?: number;
  showDangerZones?: boolean;
  showIncidents?: boolean;
}

export function MapCanvas({ activeRoute = 0, showDangerZones = true, showIncidents = true }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#ede9f8");
      bg.addColorStop(0.5, "#e8e2f5");
      bg.addColorStop(1, "#eee9f9");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Grid lines (city blocks)
      const gridColor = "rgba(120, 90, 180, 0.12)";
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;

      const cols = 8;
      const rows = 12;
      const cellW = W / cols;
      const cellH = H / rows;

      for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellW, 0);
        ctx.lineTo(i * cellW, H);
        ctx.stroke();
      }
      for (let j = 0; j <= rows; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * cellH);
        ctx.lineTo(W, j * cellH);
        ctx.stroke();
      }

      // Major roads
      ctx.strokeStyle = "rgba(120, 100, 200, 0.25)";
      ctx.lineWidth = 2.5;

      // Horizontal major roads
      [3, 6, 9].forEach((row) => {
        ctx.beginPath();
        ctx.moveTo(0, row * cellH);
        ctx.lineTo(W, row * cellH);
        ctx.stroke();
      });

      // Vertical major roads
      [2, 5].forEach((col) => {
        ctx.beginPath();
        ctx.moveTo(col * cellW, 0);
        ctx.lineTo(col * cellW, H);
        ctx.stroke();
      });

      // Danger zones
      if (showDangerZones) {
        const zones = [
          { x: 0.62, y: 0.3, r: 0.09, label: "Avoid" },
          { x: 0.18, y: 0.7, r: 0.07, label: "Reports" },
        ];

        zones.forEach((z) => {
          const grd = ctx.createRadialGradient(z.x * W, z.y * H, 0, z.x * W, z.y * H, z.r * W);
          grd.addColorStop(0, "rgba(244, 63, 94, 0.35)");
          grd.addColorStop(0.5, "rgba(244, 63, 94, 0.15)");
          grd.addColorStop(1, "rgba(244, 63, 94, 0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(z.x * W, z.y * H, z.r * W, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "rgba(244, 63, 94, 0.5)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(z.x * W, z.y * H, z.r * W, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // Safe zone glow
      const safeGrd = ctx.createRadialGradient(W * 0.35, H * 0.55, 0, W * 0.35, H * 0.55, W * 0.12);
      safeGrd.addColorStop(0, "rgba(16, 185, 129, 0.2)");
      safeGrd.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = safeGrd;
      ctx.fillRect(0, 0, W, H);

      // Routes
      const routes = [
        {
          // Safest route - curves around danger
          points: [
            [W * 0.5, H * 0.92],
            [W * 0.42, H * 0.78],
            [W * 0.38, H * 0.65],
            [W * 0.32, H * 0.52],
            [W * 0.28, H * 0.38],
            [W * 0.3, H * 0.22],
            [W * 0.38, H * 0.1],
          ],
          color: "#10b981",
          glow: "rgba(16, 185, 129, 0.4)",
          width: 3.5,
        },
        {
          // Faster route
          points: [
            [W * 0.5, H * 0.92],
            [W * 0.5, H * 0.75],
            [W * 0.52, H * 0.6],
            [W * 0.5, H * 0.45],
            [W * 0.44, H * 0.3],
            [W * 0.4, H * 0.15],
            [W * 0.38, H * 0.1],
          ],
          color: "#f59e0b",
          glow: "rgba(245, 158, 11, 0.3)",
          width: 2.5,
        },
        {
          // Busy route
          points: [
            [W * 0.5, H * 0.92],
            [W * 0.58, H * 0.78],
            [W * 0.62, H * 0.62],
            [W * 0.55, H * 0.48],
            [W * 0.5, H * 0.35],
            [W * 0.45, H * 0.2],
            [W * 0.38, H * 0.1],
          ],
          color: "#6366f1",
          glow: "rgba(99, 102, 241, 0.3)",
          width: 2.5,
        },
      ];

      routes.forEach((route, i) => {
        const isActive = i === activeRoute;
        const pts = route.points as [number, number][];

        // Glow pass
        if (isActive) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = route.glow;
          ctx.strokeStyle = route.glow;
          ctx.lineWidth = route.width + 6;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let k = 1; k < pts.length; k++) {
            ctx.lineTo(pts[k][0], pts[k][1]);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Main line
        ctx.strokeStyle = isActive ? route.color : route.color + "66";
        ctx.lineWidth = isActive ? route.width : route.width - 1;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.setLineDash(isActive ? [] : [6, 5]);
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k < pts.length; k++) {
          ctx.lineTo(pts[k][0], pts[k][1]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Incident markers
      if (showIncidents) {
        const incidents = [
          { x: 0.68, y: 0.28, type: "alert" },
          { x: 0.16, y: 0.72, type: "alert" },
          { x: 0.55, y: 0.58, type: "info" },
        ];
        incidents.forEach((inc) => {
          const px = inc.x * W;
          const py = inc.y * H;
          ctx.fillStyle = inc.type === "alert" ? "rgba(244, 63, 94, 0.9)" : "rgba(168, 85, 247, 0.9)";
          ctx.shadowBlur = 8;
          ctx.shadowColor = inc.type === "alert" ? "#f43f5e" : "#a855f7";
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Current location pin (bottom center)
      const locX = W * 0.5;
      const locY = H * 0.92;
      const locGrd = ctx.createRadialGradient(locX, locY, 0, locX, locY, 28);
      locGrd.addColorStop(0, "rgba(168, 85, 247, 0.35)");
      locGrd.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = locGrd;
      ctx.beginPath();
      ctx.arc(locX, locY, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#a855f7";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#a855f7";
      ctx.beginPath();
      ctx.arc(locX, locY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(locX, locY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Destination pin (top area)
      const destX = W * 0.38;
      const destY = H * 0.1;
      ctx.fillStyle = "#10b981";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#10b981";
      ctx.beginPath();
      ctx.arc(destX, destY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(destX, destY, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();
  }, [activeRoute, showDangerZones, showIncidents]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={680}
      className="w-full h-full object-cover"
      style={{ display: "block" }}
    />
  );
}
