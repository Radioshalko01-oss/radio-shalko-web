"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export function LoginEnter({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className="w-full max-md:max-w-none md:max-w-[400px]">{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.988 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.38, ease: EASE }}
      className="w-full max-md:max-w-none md:max-w-[400px]"
    >
      {children}
    </motion.div>
  );
}

export function LoginFooterLink({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <p className="shrink-0 bg-background px-6 pb-8 pt-4 text-center max-md:pb-10 md:mt-5 md:bg-transparent md:px-0 md:pb-0 md:pt-0">
        {children}
      </p>
    );
  }

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, delay: 0.12, ease: EASE }}
      className="shrink-0 bg-background px-6 pb-8 pt-4 text-center max-md:pb-10 md:mt-5 md:bg-transparent md:px-0 md:pb-0 md:pt-0"
    >
      {children}
    </motion.p>
  );
}
