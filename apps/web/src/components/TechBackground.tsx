import { useEffect, useRef } from "react";

type Palette = {
  gradient: [string, string, string];
  particle: string;
  line: string;
};

const LIGHT_PALETTES: Palette[] = [
  {
    // 偏蓝青(对应主题主色 sky)
    gradient: ["#f0f9ff", "#cffafe", "#e0f2fe"],
    particle: "8, 145, 178",
    line: "8, 145, 178",
  },
  {
    // 偏紫粉(对应主题次色 violet)
    gradient: ["#faf5ff", "#fae8ff", "#fdf2f8"],
    particle: "147, 51, 234",
    line: "147, 51, 234",
  },
];

const DARK_PALETTES: Palette[] = [
  {
    // 深空蓝(主色更突出)
    gradient: ["#020617", "#0c4a6e", "#020617"],
    particle: "56, 189, 248",
    line: "56, 189, 248",
  },
  {
    // 深紫罗兰(次色更突出)
    gradient: ["#0f0823", "#3b1670", "#0f0823"],
    particle: "192, 132, 252",
    line: "192, 132, 252",
  },
];

function pickPalette(isDark: boolean): Palette {
  const list = isDark ? DARK_PALETTES : LIGHT_PALETTES;
  return list[Math.floor(Math.random() * list.length)];
}

const FILE_TYPES = [
  { label: "PDF", color: "239, 68, 68" },     // red-500
  { label: "DOC", color: "59, 130, 246" },    // blue-500
  { label: "TXT", color: "100, 116, 139" },   // slate-500
  { label: "JPG", color: "168, 85, 247" },    // purple-500
  { label: "PNG", color: "20, 184, 166" },    // teal-500
  { label: "MD",  color: "245, 158, 11" },    // amber-500
] as const;

type FloatingFile = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: typeof FILE_TYPES[number];
  scale: number;
  hovered: boolean;
};

export default function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightPaletteRef = useRef<Palette>(pickPalette(false));
  const darkPaletteRef = useRef<Palette>(pickPalette(true));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];
    let files: FloatingFile[] = [];

    // 检测是否为黑夜模式
    const isDarkMode = () => document.documentElement.classList.contains("dark-mode");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
      initFiles();
    };

    const initParticles = () => {
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.6 + 0.4,
        });
      }
    };

    const initFiles = () => {
      const count = Math.max(6, Math.min(14, Math.floor((canvas.width * canvas.height) / 110000)));
      files = [];
      for (let i = 0; i < count; i++) {
        files.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          size: 22 + Math.random() * 14, // 22 ~ 36px
          rotation: (Math.random() - 0.5) * 0.4,
          rotationSpeed: (Math.random() - 0.5) * 0.0025,
          type: FILE_TYPES[Math.floor(Math.random() * FILE_TYPES.length)],
          scale: 1,
          hovered: false,
        });
      }
    };

    const mouse = { x: -10000, y: -10000, active: false };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -10000;
      mouse.y = -10000;
      mouse.active = false;
    };

    const isMouseOverFile = (file: FloatingFile) => {
      const w = file.size * 0.78 * file.scale;
      const h = file.size * file.scale;
      const dx = mouse.x - file.x;
      const dy = mouse.y - file.y;
      const cos = Math.cos(-file.rotation);
      const sin = Math.sin(-file.rotation);
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;
      return Math.abs(localX) <= w / 2 && Math.abs(localY) <= h / 2;
    };

    const drawFileIcon = (file: FloatingFile, dark: boolean) => {
      const size = file.size * file.scale;
      const w = size * 0.78;
      const h = size;
      const cornerCut = size * 0.28;
      const radius = Math.max(2, size * 0.08);
      const hoverBoost = file.scale - 1;
      const baseAlpha = (dark ? 0.32 : 0.4) + hoverBoost * 0.4;
      const labelAlpha = Math.min(1, (dark ? 0.85 : 0.95) + hoverBoost * 0.3);

      ctx.save();
      ctx.translate(file.x, file.y);
      ctx.rotate(file.rotation);
      ctx.translate(-w / 2, -h / 2);

      // 文件主体(白色 / 深色填充)
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(w - cornerCut, 0);
      ctx.lineTo(w, cornerCut);
      ctx.lineTo(w, h - radius);
      ctx.quadraticCurveTo(w, h, w - radius, h);
      ctx.lineTo(radius, h);
      ctx.quadraticCurveTo(0, h, 0, h - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.fillStyle = dark ? `rgba(241, 245, 249, ${baseAlpha})` : `rgba(255, 255, 255, ${baseAlpha + 0.25})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${file.type.color}, ${dark ? 0.55 : 0.45})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // 折角
      ctx.beginPath();
      ctx.moveTo(w - cornerCut, 0);
      ctx.lineTo(w - cornerCut, cornerCut);
      ctx.lineTo(w, cornerCut);
      ctx.closePath();
      ctx.fillStyle = `rgba(${file.type.color}, ${dark ? 0.4 : 0.25})`;
      ctx.fill();

      // 类型标签
      ctx.fillStyle = `rgba(${file.type.color}, ${labelAlpha})`;
      ctx.font = `700 ${Math.max(7, size * 0.26)}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(file.type.label, w / 2, h * 0.66);

      ctx.restore();
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dark = isDarkMode();
      const palette = dark ? darkPaletteRef.current : lightPaletteRef.current;

      // 绘制渐变背景
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, palette.gradient[0]);
      gradient.addColorStop(0.5, palette.gradient[1]);
      gradient.addColorStop(1, palette.gradient[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 浮动文件图标(在粒子之下,粒子之上是连线)
      let anyHovered = false;
      files.forEach((file) => {
        file.x += file.vx;
        file.y += file.vy;
        file.rotation += file.rotationSpeed;

        if (file.x < -40) file.x = canvas.width + 40;
        else if (file.x > canvas.width + 40) file.x = -40;
        if (file.y < -40) file.y = canvas.height + 40;
        else if (file.y > canvas.height + 40) file.y = -40;

        const hovered = mouse.active && isMouseOverFile(file);
        file.hovered = hovered;
        if (hovered) anyHovered = true;
        const target = hovered ? 1.65 : 1;
        file.scale += (target - file.scale) * 0.18;

        drawFileIcon(file, dark);
      });

      canvas.style.cursor = anyHovered ? "pointer" : "default";

      // 更新和绘制粒子
      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 边界检测
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // 绘制粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${palette.particle}, ${particle.opacity})`;
        ctx.fill();

        // 绘制连线
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particle.x;
          const dy = particles[j].y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const lineAlpha = (dark ? 0.35 : 0.22) * (1 - distance / 120);
            ctx.strokeStyle = `rgba(${palette.line}, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    resize();
    drawParticles();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
    />
  );
}
