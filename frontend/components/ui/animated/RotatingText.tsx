"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface RotatingTextProps {
    text: string;           // The constant text (e.g., "KisanMind")
    words: string[];        // The changing words (e.g., ["Intelligence", "Precision"])
    interval?: number;      // Time in ms between changes
    className?: string;     // Wrapper class
}

export const RotatingText: React.FC<RotatingTextProps> = ({
    text,
    words,
    interval = 3000,
    className = "",
}) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, interval);
        return () => clearInterval(timer);
    }, [words.length, interval]);

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 items-center text-center md:text-left gap-2 md:gap-4 w-full ${className}`}>

            {/* Constant Text - Right Aligned on Desktop to anchor it */}
            <div className="flex justify-center md:justify-end">
                <span className="font-bold text-white tracking-tight whitespace-nowrap">
                    {text}
                </span>
            </div>

            {/* Changing Text - Left Aligned */}
            <div className="relative flex justify-center md:justify-start min-w-[200px] md:min-w-[400px]">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={index}
                        initial={{ y: 20, opacity: 0, filter: "blur(5px)" }}
                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                        exit={{ y: -20, opacity: 0, filter: "blur(5px)" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="block bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent font-bold whitespace-nowrap"
                    >
                        {words[index]}
                    </motion.span>
                </AnimatePresence>
            </div>
        </div>
    );
};
