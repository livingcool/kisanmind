"use client";

import React from "react";
import { Bot, Sprout, TrendingUp, ScanFace, LineChart } from "lucide-react";
import { TestimonialsCard } from "@/components/ui/animated/TestimonialsCard";

const STEPS = [
    {
        id: "analysis",
        title: "AI Analysis",
        description: "Snap a photo or upload soil data. Our AI models analyze composition, moisture, and local climate instantly.",
        icon: Bot,
        color: "text-emerald-400",
        bg: "bg-emerald-900/40",
        border: "border-emerald-500/50",
        visualIcon: ScanFace,
        visualColor: "text-emerald-400"
    },
    {
        id: "crops",
        title: "Crop Selection",
        description: "Receive tailored crop recommendations that match your land's potential and market demand.",
        icon: Sprout,
        color: "text-blue-400",
        bg: "bg-blue-900/40",
        border: "border-blue-500/50",
        visualIcon: Sprout,
        visualColor: "text-blue-400"
    },
    {
        id: "market",
        title: "Market Insights",
        description: "Sell at predicting peak prices. We track global trends to maximize your profit margins.",
        icon: TrendingUp,
        color: "text-purple-400",
        bg: "bg-purple-900/40",
        border: "border-purple-500/50",
        visualIcon: LineChart,
        visualColor: "text-purple-400"
    }
];

export const InteractiveHowItWorks: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
                <div className="h-1 w-20 bg-emerald-500 mx-auto rounded-full" />
            </div>

            <div className="flex justify-center">
                <TestimonialsCard
                    width={600}
                    items={STEPS.map((step) => ({
                        id: step.id,
                        title: step.title,
                        description: step.description,
                        content: (
                            <div className={`w-full h-full flex flex-col items-center justify-center ${step.bg} relative`}>
                                {/* Animated Background Element */}
                                <div className={`absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,${step.color.includes('emerald') ? '#10b981' : step.color.includes('blue') ? '#3b82f6' : '#a855f7'},transparent_70%)]`} />

                                <div className={`relative z-10 w-24 h-24 rounded-2xl flex items-center justify-center border-2 ${step.border} backdrop-blur-md shadow-xl mb-4`}>
                                    <step.visualIcon className={`w-12 h-12 ${step.visualColor}`} />
                                </div>
                                <div className="text-xs uppercase tracking-widest text-white/50 font-semibold">Step {STEPS.indexOf(step) + 1}</div>
                            </div>
                        )
                    }))}
                />
            </div>
        </div>
    );
};
