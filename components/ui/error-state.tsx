"use client";

import { AlertCircle, WifiOff, ServerCrash, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ErrorStateProps {
  error?: Error | string;
  onRetry?: () => void;
  title?: string;
  description?: string;
  type?: "generic" | "network" | "server" | "notfound";
  className?: string;
}

export function ErrorState({
  error,
  onRetry,
  title,
  description,
  type = "generic",
  className = "",
}: ErrorStateProps) {
  const getErrorContent = () => {
    switch (type) {
      case "network":
        return {
          icon: WifiOff,
          defaultTitle: "Connection Lost",
          defaultDescription:
            "Please check your internet connection and try again.",
          color: "text-orange-500",
        };
      case "server":
        return {
          icon: ServerCrash,
          defaultTitle: "Server Error",
          defaultDescription:
            "Something went wrong on our end. We're working to fix it.",
          color: "text-red-500",
        };
      case "notfound":
        return {
          icon: AlertCircle,
          defaultTitle: "Not Found",
          defaultDescription: "The content you're looking for doesn't exist.",
          color: "text-gray-500",
        };
      default:
        return {
          icon: AlertCircle,
          defaultTitle: "Something Went Wrong",
          defaultDescription:
            "An unexpected error occurred. Please try again.",
          color: "text-red-500",
        };
    }
  };

  const { icon: Icon, defaultTitle, defaultDescription, color } = getErrorContent();
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="mb-4"
      >
        <Icon className={`w-16 h-16 ${color}`} />
      </motion.div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title || defaultTitle}
      </h3>

      <p className="text-gray-600 mb-2 max-w-md">
        {description || defaultDescription}
      </p>

      {errorMessage && (
        <p className="text-sm text-gray-500 mb-6 max-w-md font-mono bg-gray-100 px-3 py-2 rounded">
          {errorMessage}
        </p>
      )}

      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCcw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </motion.div>
  );
}

// Hook for error boundary usage
import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <ErrorState
          error={this.state.error}
          onRetry={this.reset}
          type="generic"
        />
      );
    }

    return this.props.children;
  }
}
