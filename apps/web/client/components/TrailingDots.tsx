import { motion, useReducedMotion } from "motion/react";

/** A compact query progress indicator adapted from the supplied TrailingDots pattern. */
export function TrailingDots() {
  const reducedMotion = useReducedMotion();

  return (
    <span
      className="trailing-dots"
      aria-hidden="true"
      data-testid="trailing-dots"
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <motion.span
          key={index}
          className="trailing-dots-orbit"
          initial={false}
          animate={reducedMotion ? { rotate: index * 72 } : { rotate: 360 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : {
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.1,
                  ease: "easeInOut",
                }
          }
        >
          <span
            className={index === 0 ? "trailing-dot active" : "trailing-dot"}
            style={{ opacity: 1 - index * 0.2 }}
          />
        </motion.span>
      ))}
    </span>
  );
}
