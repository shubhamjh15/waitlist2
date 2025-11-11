// wait/app/page.tsx

'use client';

import type { ComponentPropsWithoutRef, MouseEvent, PropsWithChildren } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Star, BrainCircuit, LayoutTemplate } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Bricolage_Grotesque } from 'next/font/google';

// --- UTILITIES & SETUP ---

const brico = Bricolage_Grotesque({
  subsets: ['latin'],
});

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// --- HOOKS & BASE COMPONENTS (PARTICLES, MOUSE POSITION) ---

interface MousePositionValue {
  x: number;
  y: number;
}

function useMousePosition(): MousePositionValue {
  const [mousePosition, setMousePosition] = useState<MousePositionValue>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMouseMove = (event: globalThis.MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return mousePosition;
}

// Particles Component (no changes)
interface ParticlesProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

function hexToRgb(hex: string): number[] {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const hexInt = parseInt(hex, 16);
  const red = (hexInt >> 16) & 255;
  const green = (hexInt >> 8) & 255;
  const blue = hexInt & 255;
  return [red, green, blue];
}

type Circle = {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
};

const Particles: React.FC<ParticlesProps> = ({
  className = '',
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = '#ffffff',
  vx = 0,
  vy = 0,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<Circle[]>([]);
  const mousePosition = useMousePosition();
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const rafID = useRef<number | null>(null);
  const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext('2d');
    }
    initCanvas();
    animate();
    const handleResize = () => {
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
      resizeTimeout.current = setTimeout(initCanvas, 200);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      if (rafID.current != null) window.cancelAnimationFrame(rafID.current);
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [color]);

  useEffect(() => {
    onMouseMove();
  }, [mousePosition.x, mousePosition.y]);

  useEffect(() => {
    initCanvas();
  }, [refresh]);

  const initCanvas = () => {
    resizeCanvas();
    drawParticles();
  };

  const onMouseMove = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const { w, h } = canvasSize.current;
      const x = mousePosition.x - rect.left - w / 2;
      const y = mousePosition.y - rect.top - h / 2;
      const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
      if (inside) {
        mouse.current.x = x;
        mouse.current.y = y;
      }
    }
  };

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);
      circles.current = [];
      for (let i = 0; i < quantity; i++) {
        const circle = circleParams();
        drawCircle(circle);
      }
    }
  };

  const circleParams = (): Circle => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const translateX = 0;
    const translateY = 0;
    const pSize = Math.floor(Math.random() * 2) + size;
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
    const dx = (Math.random() - 0.5) * 0.1;
    const dy = (Math.random() - 0.5) * 0.1;
    const magnetism = 0.1 + Math.random() * 4;
    return { x, y, translateX, translateY, size: pSize, alpha, targetAlpha, dx, dy, magnetism };
  };

  const rgb = hexToRgb(color);

  const drawCircle = (circle: Circle, update = false) => {
    if (context.current) {
      const { x, y, translateX, translateY, size, alpha } = circle;
      context.current.translate(translateX, translateY);
      context.current.beginPath();
      context.current.arc(x, y, size, 0, 2 * Math.PI);
      context.current.fillStyle = `rgba(${rgb.join(', ')}, ${alpha})`;
      context.current.fill();
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!update) circles.current.push(circle);
    }
  };

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
    }
  };

  const drawParticles = () => {
    clearContext();
    for (let i = 0; i < quantity; i++) {
      const circle = circleParams();
      drawCircle(circle);
    }
  };

  const remapValue = (value: number, start1: number, end1: number, start2: number, end2: number): number => {
    const remapped = ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  };

  const animate = () => {
    clearContext();
    circles.current.forEach((circle: Circle, i: number) => {
      const edge = [
        circle.x + circle.translateX - circle.size,
        canvasSize.current.w - circle.x - circle.translateX - circle.size,
        circle.y + circle.translateY - circle.size,
        canvasSize.current.h - circle.y - circle.translateY - circle.size,
      ];
      const closestEdge = edge.reduce((a, b) => Math.min(a, b));
      const remapClosestEdge = parseFloat(remapValue(closestEdge, 0, 20, 0, 1).toFixed(2));
      if (remapClosestEdge > 1) {
        circle.alpha += 0.02;
        if (circle.alpha > circle.targetAlpha) circle.alpha = circle.targetAlpha;
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge;
      }
      circle.x += circle.dx + vx;
      circle.y += circle.dy + vy;
      circle.translateX += (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) / ease;
      circle.translateY += (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) / ease;
      drawCircle(circle, true);
      if (
        circle.x < -circle.size ||
        circle.x > canvasSize.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSize.current.h + circle.size
      ) {
        circles.current.splice(i, 1);
        const newCircle = circleParams();
        drawCircle(newCircle);
      }
    });
    rafID.current = window.requestAnimationFrame(animate);
  };

  return (
    <div className={cn('pointer-events-none', className)} ref={canvasContainerRef} aria-hidden="true" {...props}>
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
};

// --- INNOVATIVE UI COMPONENTS ---

const WarpingGrid = () => {
  const mouse = useMousePosition();
  const mouseX = useSpring(mouse.x, { stiffness: 400, damping: 90 });
  const mouseY = useSpring(mouse.y, { stiffness: 400, damping: 90 });

  useEffect(() => {
    mouseX.set(mouse.x);
    mouseY.set(mouse.y);
  }, [mouse.x, mouse.y, mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        '--grid-size': '40px',
        '--grid-color': 'hsl(var(--border) / 0.5)',
        background: useTransform(
          [mouseX, mouseY],
          ([x, y]) => `
            radial-gradient(circle at ${x}px ${y}px, hsl(var(--primary)/0.15), transparent 30%),
            linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
          `
        ),
        backgroundSize: `100% 100%, var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size)`,
      }}
    />
  );
};

const InteractiveCard = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], ['18deg', '-18deg']), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], ['-18deg', '18deg']), springConfig);
  
  const glareX = useTransform(mouseX, [-0.5, 0.5], ['100%', '0%']);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ['100%', '0%']);
  const glareOpacity = useTransform([mouseX, mouseY], ([x, y]) => (Math.abs(x) > 0 || Math.abs(y) > 0 ? 1 : 0));

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d', rotateX, rotateY }}
      className={cn('relative rounded-lg', className)}
    >
      <div
        style={{ transform: 'translateZ(50px)', transformStyle: 'preserve-3d' }}
        className="border-neutral-800 flex h-full flex-col items-center justify-center rounded-lg border bg-neutral-900/50 p-6 backdrop-blur-md"
      >
        {children}
      </div>
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-lg"
        style={{
          opacity: glareOpacity,
          background: useTransform(
            () => `radial-gradient(circle at ${glareX.get()} ${glareY.get()}, hsla(0,0%,100%,0.1), transparent 60%)`
          ),
        }}
      />
    </motion.div>
  );
};

const WavyText = ({ text, className, ...rest }: { text: string; className?: string }) => {
  const letters = Array.from(text);
  return (
    <div className={cn('flex', className)} {...rest}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ y: 0 }}
          whileHover={{
            y: -10,
            scale: 1.1,
            rotate: Math.random() > 0.5 ? '5deg' : '-5deg',
            transition: { type: 'spring', stiffness: 350, damping: 10 },
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 5, mass: 0.5 }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

const users = [
  { imgUrl: 'https://avatars.githubusercontent.com/u/111780029' },
  { imgUrl: 'https://avatars.githubusercontent.com/u/123104247' },
  { imgUrl: 'https://avatars.githubusercontent.com/u/115650165' },
  { imgUrl: 'https://avatars.githubusercontent.com/u/71373838' },
];

export default function Home() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const magneticX = useSpring(0, { stiffness: 200, damping: 20, mass: 0.5 });
  const magneticY = useSpring(0, { stiffness: 200, damping: 20, mass: 0.5 });

  const handleMagneticMove = (e: MouseEvent) => {
    if (!buttonRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    if (distance < 150) {
      magneticX.set(deltaX * 0.2);
      magneticY.set(deltaY * 0.2);
    } else {
      magneticX.set(0);
      magneticY.set(0);
    }
  };

  const handleMagneticLeave = () => {
    magneticX.set(0);
    magneticY.set(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <>
      <GlobalStyles />
      <main
        onMouseMove={handleMagneticMove}
        onMouseLeave={handleMagneticLeave}
        className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
      >
        <WarpingGrid />
        <Particles
          className="absolute inset-0 z-0"
          quantity={80}
          ease={80}
          size={0.3}
          staticity={20}
          color="#ffffff"
        />
        
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            className="border-neutral-800 mb-8 inline-flex items-center gap-2 rounded-full border bg-neutral-900/50 px-4 py-2 backdrop-blur-sm"
          >
            <img src="https://i.postimg.cc/j5dW4vFd/Mvpblocks.webp" alt="logo" className="spin h-6 w-6" />
            <span className="text-sm font-medium">Xavin</span>
            <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ArrowRight className="h-4 w-4" />
            </motion.div>
          </motion.div>

          {/* MODIFIED: Increased font size */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className={cn('mb-4 flex cursor-pointer flex-wrap justify-center text-5xl tracking-tight sm:text-7xl', brico.className)}
          >
            <span className="font-normal text-neutral-200 mr-4">Join the</span>
            <WavyText text="Waitlist" className="font-bold bg-gradient-to-r from-rose-400 via-primary to-rose-500 bg-clip-text text-transparent" />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-neutral-300 mx-auto mt-4 mb-12 max-w-lg leading-relaxed sm:text-lg"
          >
            Be the first to access our Agentic AI website builder.
            <br className="hidden sm:block" /> Build Beautiful and stunning websites with Xavin.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, staggerChildren: 0.2 }}
            className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-3"
          >
            <InteractiveCard>
              <motion.div style={{ transform: 'translateZ(25px)' }} className="text-center">
                <BrainCircuit className="text-primary mx-auto mb-3 h-8 w-8" />
                <span className="text-xl font-bold">Powered by</span>
                <span className="block text-neutral-400 text-sm">Agentic AI</span>
              </motion.div>
            </InteractiveCard>
            <InteractiveCard>
              <motion.div style={{ transform: 'translateZ(25px)' }} className="text-center">
                <LayoutTemplate className="text-primary mx-auto mb-3 h-8 w-8" />
                <span className="text-2xl font-bold">Beautiful</span>
                <span className="block text-neutral-400 text-sm">Websites</span>
              </motion.div>
            </InteractiveCard>
            <InteractiveCard>
              <motion.div style={{ transform: 'translateZ(25px)' }} className="text-center">
                <Star className="text-primary mx-auto mb-3 h-8 w-8" />
                <span className="text-2xl font-bold">Early</span>
                <span className="block text-neutral-400 text-sm">Access</span>
              </motion.div>
            </InteractiveCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mx-auto flex max-w-lg flex-col gap-4 sm:flex-row"
          >
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="flex w-full flex-col gap-4 sm:flex-row"
                >
                  <div className="relative flex-1">
                    <motion.input
                      whileFocus={{ scale: 1.02, boxShadow: '0 0 0 2px hsl(var(--primary)/0.5)' }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-neutral-800 text-foreground placeholder:text-neutral-500 w-full rounded-lg border bg-neutral-900/50 px-6 py-4 text-lg backdrop-blur-md transition-colors focus:border-primary/50 focus:outline-none"
                    />
                  </div>
                  <motion.button
                    ref={buttonRef}
                    style={{ x: magneticX, y: magneticY }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="group text-primary-foreground focus:ring-primary/50 relative overflow-hidden rounded-lg bg-gradient-to-b from-rose-500 to-primary px-8 py-4 text-lg font-semibold text-white shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] focus:ring-2 focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                      <Sparkles className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                    </span>
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="thank-you-message"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6 }}
                  className="border-primary/20 text-primary flex-1 cursor-pointer rounded-lg border bg-neutral-900/50 px-6 py-4 text-lg font-medium backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] active:brightness-125"
                >
                  <span className="flex items-center justify-center gap-2">
                    Thanks for joining! <Sparkles className="h-5 w-5 animate-pulse" />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* NEW: Added text below the form */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-neutral-500 mt-4 text-sm"
          >
            Join to get free samples ✨
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-12 flex items-center justify-center gap-2"
          >
            <div className="flex -space-x-4">
              {users.map((user, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: -10 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 + i * 0.15 }}
                  whileHover={{ y: -6, scale: 1.1, zIndex: 10 }}
                  className="border-background from-rose-500 size-12 rounded-full border-2 bg-gradient-to-r to-primary p-[2px]"
                >
                  <div className="overflow-hidden rounded-full">
                    <img src={user.imgUrl} alt="Avatar" className="rounded-full" width={48} height={48} />
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              className="text-neutral-400 ml-3 text-base"
            >
              <span className="text-primary font-semibold">100+</span> already joined ✨
            </motion.span>
          </motion.div>
        </div>
      </main>
    </>
  );
}

// --- GLOBAL STYLES ---

const GlobalStyles = () => (
  <style jsx global>{`
    :root {
      --background: 20 14.3% 4.1%;
      --foreground: 0 0% 95%;
      --card: 24 9.8% 10%;
      --card-foreground: 0 0% 95%;
      --popover: 0 0% 9%;
      --popover-foreground: 0 0% 95%;
      --primary: 346.8 77.2% 49.8%;
      --primary-foreground: 355.7 100% 97.3%;
      --secondary: 240 3.7% 15.9%;
      --secondary-foreground: 0 0% 98%;
      --muted: 0 0% 15%;
      --muted-foreground: 240 5% 64.9%;
      --accent: 12 6.5% 15.1%;
      --accent-foreground: 0 0% 98%;
      --destructive: 0 62.8% 30.6%;
      --destructive-foreground: 0 85.7% 97.3%;
      --border: 240 3.7% 15.9%;
      --input: 240 3.7% 15.9%;
      --ring: 346.8 77.2% 49.8%;
      --radius: 0.5rem;
    }

    * {
      box-sizing: border-box;
      border-color: hsl(var(--border));
    }

    html,
    body {
      padding: 0;
      margin: 0;
    }

    body {
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
      cursor: default;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spin { animation: spin 8s linear infinite; }

    @keyframes pulse { 50% { opacity: 0.5; } }
    .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  `}</style>
);