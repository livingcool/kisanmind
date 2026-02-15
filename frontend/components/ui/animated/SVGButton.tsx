"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface SVGButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode;
    className?: string;
    variant?: "primary" | "secondary";
}

export function SVGButton({ children, className, variant = "primary", ...props }: SVGButtonProps) {
    const isPrimary = variant === "primary";

    return (
        <motion.button
            className={cn(
                "relative flex items-center justify-center px-8 py-3 font-bold text-lg overflow-hidden group focus:outline-none",
                isPrimary ? "text-white" : "text-emerald-700",
                className
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            {...props}
        >
            {/* SVG Background */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 200 60"
                    preserveAspectRatio="none"
                    className="w-full h-full"
                >
                    <defs>
                        <linearGradient id={`grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            {isPrimary ? (
                                <>
                                    <stop offset="0%" style={{ stopColor: "#059669", stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: "#34d399", stopOpacity: 1 }} />
                                </>
                            ) : (
                                <>
                                    <stop offset="0%" style={{ stopColor: "#f0fdf4", stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: "#dcfce7", stopOpacity: 1 }} />
                                </>
                            )}

                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <path
                        d="M 20 5 L 180 5 C 190 5 195 10 195 20 L 195 40 C 195 50 190 55 180 55 L 20 55 C 10 55 5 50 5 40 L 5 20 C 5 10 10 5 20 5 Z"
                        fill={`url(#grad-${variant})`}
                        stroke={isPrimary ? "#34d399" : "#059669"}
                        strokeWidth="2"
                        filter="url(#glow)"
                        className="transition-all duration-300"
                    />

                    {/* Decorative Lines */}
                    <path
                        d="M 10 20 L 10 40"
                        stroke={isPrimary ? "#ffffff" : "#059669"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                    />
                    <path
                        d="M 190 20 L 190 40"
                        stroke={isPrimary ? "#ffffff" : "#059669"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                    />
                </svg>
            </div>

            {/* Button Content */}
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
}
