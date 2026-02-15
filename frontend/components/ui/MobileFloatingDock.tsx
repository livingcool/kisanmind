"use client";

import React from "react";
import { motion } from "framer-motion";
import { Camera, Mic, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

export const MobileFloatingDock: React.FC = () => {
    const router = useRouter();

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden flex items-end gap-4">
            {/* Secondary Actions */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push("/market")}
                className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-neutral-900/80 backdrop-blur-md border border-white/10 shadow-lg"
            >
                <TrendingUp className="w-5 h-5 text-neutral-300" />
            </motion.button>

            {/* Primary Action - Scan */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/input")}
                className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/20 border-4 border-neutral-900 mb-2"
            >
                <Camera className="w-8 h-8 text-white" />
            </motion.button>

            {/* Secondary Actions */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push("/voice")} // Assuming voice route or modal exists/will exist
                className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-neutral-900/80 backdrop-blur-md border border-white/10 shadow-lg"
            >
                <Mic className="w-5 h-5 text-neutral-300" />
            </motion.button>
        </div>
    );
};
