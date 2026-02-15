"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

const MARKET_DATA = [
    { crop: "Wheat", price: "₹2,125", change: "+1.2%", up: true },
    { crop: "Rice", price: "₹3,450", change: "-0.5%", up: false },
    { crop: "Cotton", price: "₹6,800", change: "+2.1%", up: true },
    { crop: "Soybean", price: "₹4,200", change: "+0.8%", up: true },
    { crop: "Maize", price: "₹1,950", change: "-1.1%", up: false },
    { crop: "Potato", price: "₹1,200", change: "+3.5%", up: true },
    { crop: "Onion", price: "₹3,200", change: "+15.0%", up: true },
    { crop: "Sugarcane", price: "₹315", change: "0.0%", up: true },
];

export const MarketTicker: React.FC = () => {
    return (
        <div className="w-full bg-neutral-900/60 border-y border-white/5 backdrop-blur-sm overflow-hidden py-3">
            <div className="flex whitespace-nowrap">
                {/* Double the list for seamless loop */}
                {[...MARKET_DATA, ...MARKET_DATA].map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ x: 0 }}
                        animate={{ x: "-100%" }}
                        transition={{
                            duration: 30,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        className="flex items-center gap-2 mx-8 min-w-max"
                    >
                        <span className="font-semibold text-neutral-300">{item.crop}:</span>
                        <span className="text-white font-mono">{item.price}</span>
                        <span className={`text-xs flex items-center ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.up ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {item.change}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
