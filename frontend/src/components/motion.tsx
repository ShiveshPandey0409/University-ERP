import type { ReactNode } from "react";

import { motion, type Variants } from "framer-motion";

/** Page-level entrance transition (fade + slight rise). */
export function MotionPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

/** A flex row that staggers its children in on mount. */
export function StaggerRow({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      style={{ display: "flex", flexWrap: "wrap", gap: 16 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, grow }: { children: ReactNode; grow?: boolean }) {
  return (
    <motion.div variants={staggerItem} style={{ flex: grow ? 1 : undefined, minWidth: grow ? 190 : undefined }}>
      {children}
    </motion.div>
  );
}
