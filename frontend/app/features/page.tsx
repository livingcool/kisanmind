"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, Sprout, TrendingUp, ShieldCheck, Zap, Globe, ArrowLeft, Camera, Smartphone, Database, Satellite } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FeaturesPage() {
    const router = useRouter();

    const features = [
        {
            icon: <Brain className="w-8 h-8 text-emerald-400" />,
            title: "Multi-Modal AI Analysis",
            description: "Our system combines data from various sources. The Vision Agent analyzes photos of your crops for disease, while the Data Agent parses soil health reports to recommend the perfect fertilizer mix.",
            highlight: "Dual-Agent System"
        },
        {
            icon: <TrendingUp className="w-8 h-8 text-blue-400" />,
            title: "Real-Time Market Intelligence",
            description: "We connect directly to 50+ Mandi APIs across India to give you live price updates. Our predictive models forecast price trends so you know exactly when to sell for maximum profit.",
            highlight: "Live Data"
        },
        {
            icon: <Smartphone className="w-8 h-8 text-purple-400" />,
            title: "Voice-First Interaction",
            description: "Farming is hands-on work. That's why KisanMind supports voice commands in 12+ Indian languages. Just speak to the app to log data or ask questions.",
            highlight: "12+ Languages"
        },
        {
            icon: <Satellite className="w-8 h-8 text-cyan-400" />,
            title: "Satellite Monitoring",
            description: "Get a bird's eye view of your farm with NDVI imaging. We track crop density and health over time using satellite data to spot issues before they become visible on the ground.",
            highlight: "NDVI Imaging"
        },
        {
            icon: <Database className="w-8 h-8 text-orange-400" />,
            title: "Government Scheme Matching",
            description: "Never miss out on a subsidy again. Our system automatically matches your farm profile with eligible government schemes and grants, helping you apply with a single click.",
            highlight: "Auto-Match"
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-green-400" />,
            title: "Secure & Private",
            description: "Your farm data is your property. We use enterprise-grade encryption to ensure your data is safe and never shared without your permission.",
            highlight: "End-to-End Encryption"
        },
    ];

    return (
        <div className="flex h-screen w-full overflow-hidden bg-neutral-950 text-white">
            {/* 
        ------------------------------------------------------------
        LEFT SIDEBAR - FIXED
        ------------------------------------------------------------
      */}
            <aside className="hidden md:flex flex-col justify-between w-[40%] h-full p-8 lg:p-12 relative overflow-hidden bg-neutral-900/40 border-r border-white/5 backdrop-blur-xl">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px]" />
                </div>

                {/* Content Wrapper */}
                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <div>
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group mb-8"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Home</span>
                        </button>

                        <div className="flex items-center gap-3 mb-8">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="font-semibold text-xs text-neutral-300 uppercase tracking-widest">System Online</span>
                            </div>
                        </div>


                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Capabilities & <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Intelligence</span>
                        </h2>
                        <p className="text-lg text-neutral-400 max-w-md leading-relaxed">
                            A breakdown of the specialized AI agents and technologies working 24/7 to optimize your farm.
                        </p>
                    </div>

                    {/* Bottom Stats - System Status style */}
                    <div className="mt-auto space-y-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-neutral-400 text-sm">Active Agents</span>
                                <span className="text-emerald-400 font-mono font-bold">5/5</span>
                            </div>
                            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-full" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-2xl font-bold text-white mb-1">12+</div>
                                <div className="text-xs text-neutral-500 uppercase">Languages</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-2xl font-bold text-white mb-1">50+</div>
                                <div className="text-xs text-neutral-500 uppercase">Mandis Connected</div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* 
        ------------------------------------------------------------
        RIGHT CONTENT - SCROLLABLE
        ------------------------------------------------------------
      */}
            <main className="flex-1 h-full overflow-y-auto relative w-full scroll-smooth">
                {/* Mobile Header */}
                <div className="md:hidden p-6 flex items-center justify-between bg-neutral-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
                    <button onClick={() => router.push('/')} className="p-2 -ml-2">
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                    <span className="font-bold text-lg">Features</span>
                    <div className="w-6" />
                </div>

                <div className="max-w-4xl mx-auto p-6 md:p-12 lg:p-16 space-y-8">
                    <div className="md:hidden mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Capabilities</h1>
                        <p className="text-neutral-400">What KisanMind can do for you.</p>
                    </div>

                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-neutral-900/60 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:bg-neutral-800/60 hover:border-white/20 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                <span className="text-xs font-mono text-neutral-500 border border-neutral-800 px-2 py-1 rounded bg-neutral-900">
                                    {feature.highlight}
                                </span>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-neutral-800/50 rounded-2xl group-hover:bg-white/10 transition-colors shrink-0">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-400 transition-all">
                                        {feature.title}
                                    </h3>
                                    <p className="text-neutral-400 leading-relaxed text-lg">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Footer Area */}
                    <div className="pt-12 text-center">
                        <p className="text-neutral-500 mb-6">Ready to transform your farm?</p>
                        <button
                            onClick={() => router.push('/input')}
                            className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-colors"
                        >
                            Start Analysis Now
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
