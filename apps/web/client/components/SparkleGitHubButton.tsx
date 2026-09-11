import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Star } from "lucide-react";

const spring = { type: "spring", stiffness: 600, damping: 25 } as const;

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .08 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.15-4.56-5.11 0-1.13.39-2.05 1.04-2.78-.1-.26-.45-1.31.1-2.74 0 0 .85-.28 2.75 1.06A9.3 9.3 0 0 1 12 6.1c.85 0 1.7.12 2.5.34 1.9-1.34 2.75-1.06 2.75-1.06.55 1.43.2 2.48.1 2.74.65.73 1.04 1.65 1.04 2.78 0 3.97-2.35 4.85-4.58 5.1.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.23 10.23 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

export function SparkleGitHubButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.a
      href="https://github.com/opxqo/wic-energy"
      target="_blank"
      rel="noreferrer"
      aria-label="在 GitHub 查看 WIC Energy 项目"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className="sparkle-button"
    >
      <div className="sparkle-icon" aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          {!isHovered ? (
            <motion.div
              key="github"
              initial={{ y: -15, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -15, opacity: 0, scale: 0.8 }}
              transition={spring}
              className="sparkle-icon-item"
            >
              <GitHubMark />
            </motion.div>
          ) : (
            <motion.div
              key="star"
              initial={{ y: 15, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 15, opacity: 0, scale: 0.8 }}
              transition={spring}
              className="sparkle-icon-item sparkle-star"
            >
              <Star className="sparkle-star-icon" />
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -45, y: 10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0, rotate: 45, y: 10 }}
                transition={{ ...spring, delay: 0.05 }}
                className="sparkle-mark"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6-6.2-4.5-6.2 4.5 2.4-7.6L2 9.6h7.6z" />
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className="sparkle-label">Star on GitHub</span>
    </motion.a>
  );
}
