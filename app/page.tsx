// wait/app/page.tsx

'use client';

// Make sure to run npm install @formspree/react
import type { ComponentPropsWithoutRef, MouseEvent, PropsWithChildren } from 'react';
import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { ArrowRight, Sparkles, Star, BrainCircuit, LayoutTemplate } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Bricolage_Grotesque } from 'next/font/google';
import { AuroraText } from "@/components/ui/aurora-text"
// --- UTILITIES & SETUP ---

const brico = Bricolage_Grotesque({
  subsets: ['latin'],
});

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// --- HOOKS & BASE COMPONENTS ---

interface MousePositionValue {
  x: number;
  y: number;
}

function useMousePosition(): MousePositionValue {
  const [mousePosition, setMousePosition] = React.useState<MousePositionValue>({
    x: 0,
    y: 0,
  });

  React.useEffect(() => {
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
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  const context = React.useRef<CanvasRenderingContext2D | null>(null);
  const circles = React.useRef<Circle[]>([]);
  const mousePosition = useMousePosition();
  const mouse = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasSize = React.useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const rafID = React.useRef<number | null>(null);
  const resizeTimeout = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  React.useEffect(() => {
    onMouseMove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mousePosition.x, mousePosition.y]);

  React.useEffect(() => {
    initCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

// --- UI COMPONENTS ---

const InteractiveCard = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], ['10deg', '-10deg']), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], ['-10deg', '10deg']), springConfig);
  
  const glareX = useTransform(mouseX, [-0.5, 0.5], ['100%', '0%']);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ['100%', '0%']);

  // Type the transform callback as [number, number] so TypeScript knows the inputs are numbers.
  const glareOpacity = useTransform(
    [mouseX, mouseY],
    ([x, y]: [number, number]) => {
      if (typeof x !== 'number' || typeof y !== 'number') return 0;
      return Math.abs(x) > 0 || Math.abs(y) > 0 ? 1 : 0;
    }
  );

  // Build the gradient as a MotionValue string using the glare MotionValues.
  const gradient = useTransform(
    [glareX, glareY, glareOpacity],
    // types here: glareX/glareY resolve to strings like '100%' and opacity is a number
    ([gx, gy, o]: [string, string, number]) =>
      `radial-gradient(circle at ${gx} ${gy}, hsla(0,0%,100%,${0.1 * o}), transparent 60%)`
  );

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
          // pass the computed gradient MotionValue here
          background: gradient,
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
  const [state, handleSubmit] = useForm("mpwkwbdj");

  return (
    <>
      <GlobalStyles />
      <div className="spline-container fixed inset-0 -z-10">
        <iframe src="https://my.spline.design/aidatamodelinteraction-mdTL3FktFVHgDvFr5TKtnYDV" frameBorder="0" width="100%" height="100%" id="aura-spline"></iframe>
      </div>

      <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden">
        <motion.div
          className="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:py-16 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="border-neutral-800 mb-8 inline-flex items-center gap-2 rounded-full border bg-neutral-900/50 px-4 py-2 backdrop-blur-sm"
          >
            <img src="/image.png" alt="logo" className="spin h-6 w-6" />
            <span className="text-sm font-medium">Xavin</span>
            <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ArrowRight className="h-4 w-4" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className={cn('mb-4 flex flex-wrap justify-center text-4xl tracking-tight sm:text-5xl md:text-7xl', brico.className)}
          >
            <span className="font-normal text-neutral-200 mr-4">Join the</span>
            <AuroraText>Waitlist</AuroraText>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-neutral-300 mx-auto mt-4 mb-12 max-w-lg leading-relaxed text-base sm:text-lg"
          >
            Get early access to Xavin and create the most beautiful websites with zero effort.
          
            <br className="hidden sm:block" /> </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, staggerChildren: 0.2 }}
            // MODIFIED: Reverted to `hidden sm:grid` to hide cards on mobile.
            className="hidden sm:grid mb-12 grid-cols-1 gap-8 sm:grid-cols-3"
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
            className="mx-auto flex max-w-lg flex-col gap-4"
          >
            <AnimatePresence mode="wait">
              {!state.succeeded ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
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
                      id="email"
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      required
                      className="border-neutral-800 text-foreground placeholder:text-neutral-500 w-full rounded-lg border bg-neutral-900/50 px-6 py-4 text-lg backdrop-blur-md transition-colors focus:border-primary/50 focus:outline-none"
                    />
                    <ValidationError
                      prefix="Email"
                      field="email"
                      errors={state.errors}
                      className="text-red-500 absolute -bottom-6 left-2 text-sm"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={state.submitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="group text-primary-foreground focus:ring-primary/50 relative overflow-hidden rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] focus:ring-2 focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="absolute inset-0 block w-full -translate-x-full transform bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-full"></span>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {state.submitting ? 'Joining...' : 'Join Waitlist'}
                      <Sparkles className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                    </span>
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="thank-you-message"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6 }}
                  className="border-primary/20 text-primary flex-1 cursor-pointer rounded-lg border bg-neutral-900/50 px-6 py-4 text-lg font-medium backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] active:brightness-125"
                >
                  <span className="flex items-center justify-center gap-2">
                    Thanks for joining! <Sparkles className="h-5 w-5 animate-pulse" />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-neutral-500 mt-8 text-sm"
          >
            Join to get free samples ✨
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2"
          >
            <div className="flex -space-x-4">
              {users.map((user, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: -10 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 + i * 0.15 }}
                  className="border-background size-12 rounded-full border-2 bg-gradient-to-r from-sky-500 to-primary p-[2px]"
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
              className="text-neutral-400 mt-4 sm:mt-0 sm:ml-3 text-base"
            >
              <span className="text-primary font-semibold">100+</span> already joined ✨
            </motion.span>
          </motion.div>
        </motion.div>
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
      
      /* Primary color is #3B82F6 */
      --primary: 217 91% 60%;
      --primary-foreground: 210 40% 98%;

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
      
      --ring: 217 91% 60%;
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
