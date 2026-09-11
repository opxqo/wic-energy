import { motion, useReducedMotion } from "motion/react";

/**
 * PulsatingDots loader component adapted from Amicro:
 * https://amicro.vercel.app/loaders/pulsating-dots
 */
export function PulsatingDots({ className = "" }: { className?: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={`flex items-center justify-center space-x-2 ${className}`}
      aria-hidden="true"
      data-testid="pulsating-dots"
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2.5 h-2.5 bg-zinc-800 dark:bg-white rounded-full"
          animate={
            reducedMotion
              ? { opacity: 0.8 }
              : { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }
          }
          transition={
            reducedMotion
              ? { duration: 0 }
              : {
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}
