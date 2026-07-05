"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export function LoginEnter({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className="w-full max-w-[400px]">{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.988 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.38, ease: EASE }}
      className="w-full max-w-[400px]"
    >
      {children}
    </motion.div>
  );
}

export function LoginFooterLink({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <p className="mt-5 text-center">{children}</p>;
  }

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, delay: 0.12, ease: EASE }}
      className="mt-5 text-center"
    >
      {children}
    </motion.p>
  );
}
