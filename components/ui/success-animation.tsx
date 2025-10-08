"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Heart, Star, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  message?: string;
  icon?: "check" | "heart" | "star" | "sparkles";
  duration?: number;
}

export function SuccessAnimation({
  show,
  onComplete,
  message = "Success!",
  icon = "check",
  duration = 2000,
}: SuccessAnimationProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  const getIcon = () => {
    switch (icon) {
      case "check":
        return <Check className="w-16 h-16 text-white" />;
      case "heart":
        return <Heart className="w-16 h-16 text-white fill-white" />;
      case "star":
        return <Star className="w-16 h-16 text-white fill-white" />;
      case "sparkles":
        return <Sparkles className="w-16 h-16 text-white" />;
      default:
        return <Check className="w-16 h-16 text-white" />;
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative"
          >
            {/* Success circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-8 shadow-2xl"
            >
              {getIcon()}
            </motion.div>

            {/* Confetti particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI) / 6) * 100,
                  y: Math.sin((i * Math.PI) / 6) * 100,
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  ease: "easeOut",
                }}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: [
                    "#ec4899",
                    "#8b5cf6",
                    "#06b6d4",
                    "#10b981",
                  ][i % 4],
                }}
              />
            ))}
          </motion.div>

          {/* Message */}
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-1/3 text-white text-2xl font-semibold"
            >
              {message}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for easier usage
export function useSuccessAnimation() {
  const [show, setShow] = useState(false);
  const [config, setConfig] = useState<{
    message?: string;
    icon?: "check" | "heart" | "star" | "sparkles";
    duration?: number;
  }>({});

  const showSuccess = (props?: {
    message?: string;
    icon?: "check" | "heart" | "star" | "sparkles";
    duration?: number;
  }) => {
    setConfig(props || {});
    setShow(true);
  };

  const SuccessAnimationComponent = () => (
    <SuccessAnimation
      show={show}
      onComplete={() => setShow(false)}
      {...config}
    />
  );

  return { showSuccess, SuccessAnimation: SuccessAnimationComponent };
}
