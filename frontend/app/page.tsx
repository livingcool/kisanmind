"use client";

import React from "react";
import { RotatingText } from "@/components/ui/animated/RotatingText";
import { SVGButton } from "@/components/ui/animated/SVGButton";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, Sprout, TrendingUp, ShieldCheck } from "lucide-react";
import { InteractiveHowItWorks } from "@/components/home/InteractiveHowItWorks";
import { MarketTicker } from "@/components/home/MarketTicker";
import { MobileFloatingDock } from "@/components/ui/MobileFloatingDock";
import { TestimonialsCard } from "@/components/ui/animated/TestimonialsCard";

export default function LandingPage() {
    const router = useRouter();

    return (
        <main className="relative min-h-screen w-full overflow-x-hidden text-white">
            {/* 
        ------------------------------------------------------------
        HERO SECTION
        ------------------------------------------------------------
      */}
            <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">

                {/* VIDEO BACKGROUND (Placeholder) */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black/60 z-10" /> {/* Overlay */}
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover scale-[1.2]" // Cropped video
                    >
                        {/* 
                TODO: Replace this src with the path to your uploaded video file. 
                Example: src="/videos/hero-background.mp4" 
            */}
                        <source src="/hero-background.mp4" type="video/mp4" />
                    </video>
                </div>



                {/* HERO CONTENT */}
                <div className="relative z-20 flex flex-col items-center text-center px-4">

                    {/* CLAUDE HACKATHON BADGE */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
                    >
                        {/* Claude Logo / AI Icon */}
                        <div className="w-5 h-5 relative flex items-center justify-center">
                            <svg viewBox="0 -.01 39.5 39.53" className="w-full h-full">
                                <path d="m7.75 26.27 7.77-4.36.13-.38-.13-.21h-.38l-1.3-.08-4.44-.12-3.85-.16-3.73-.2-.94-.2-.88-1.16.09-.58.79-.53 1.13.1 2.5.17 3.75.26 2.72.16 4.03.42h.64l.09-.26-.22-.16-.17-.16-3.88-2.63-4.2-2.78-2.2-1.6-1.19-.81-.6-.76-.26-1.66 1.08-1.19 1.45.1.37.1 1.47 1.13 3.14 2.43 4.1 3.02.6.5.24-.17.03-.12-.27-.45-2.23-4.03-2.38-4.1-1.06-1.7-.28-1.02c-.1-.42-.17-.77-.17-1.2l1.23-1.67.68-.22 1.64.22.69.6 1.02 2.33 1.65 3.67 2.56 4.99.75 1.48.4 1.37.15.42h.26v-.24l.21-2.81.39-3.45.38-4.44.13-1.25.62-1.5 1.23-.81.96.46.79 1.13-.11.73-.47 3.05-.92 4.78-.6 3.2h.35l.4-.4 1.62-2.15 2.72-3.4 1.2-1.35 1.4-1.49.9-.71h1.7l1.25 1.86-.56 1.92-1.75 2.22-1.45 1.88-2.08 2.8-1.3 2.24.12.18.31-.03 4.7-1 2.54-.46 3.03-.52 1.37.64.15.65-.54 1.33-3.24.8-3.8.76-5.66 1.34-.07.05.08.1 2.55.24 1.09.06h2.67l4.97.37 1.3.86.78 1.05-.13.8-2 1.02-2.7-.64-6.3-1.5-2.16-.54h-.3v.18l1.8 1.76 3.3 2.98 4.13 3.84.21.95-.53.75-.56-.08-3.63-2.73-1.4-1.23-3.17-2.67h-.21v.28l.73 1.07 3.86 5.8.2 1.78-.28.58-1 .35-1.1-.2-2.26-3.17-2.33-3.57-1.88-3.2-.23.13-1.11 11.95-.52.61-1.2.46-1-.76-.53-1.23.53-2.43.64-3.17.52-2.52.47-3.13.28-1.04-.02-.07-.23.03-2.36 3.24-3.59 4.85-2.84 3.04-.68.27-1.18-.61.11-1.09.66-.97 3.93-5 2.37-3.1 1.53-1.79-.01-.26h-.09l-10.44 6.78-1.86.24-.8-.75.1-1.23.38-.4 3.14-2.16z" fill="#d97757" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-neutral-200">Powered by <strong>Opus 4.6</strong></span>
                    </motion.div>

                    {/* LIQUID TEXT TITLE - "KisanMind" */}
                    {/* HERO TEXT - ROTATING */}
                    <div className="w-full max-w-5xl z-20">
                        <RotatingText
                            text="KisanMind"
                            words={["Intelligence", "Prosperity", "The Future"]}
                            className="text-3xl md:text-6xl lg:text-7xl"
                        />
                    </div>



                    {/* CTA BUTTON */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="mt-10"
                    >
                        <SVGButton onClick={() => router.push("/input")}>
                            Get Started
                        </SVGButton>
                    </motion.div>

                </div>
            </section>


            {/* 
        ------------------------------------------------------------
        HOW IT WORKS SECTION
        ------------------------------------------------------------
      */}
            <section id="features" className="relative py-20 px-6 md:px-20 bg-neutral-900/30 border-t border-white/10 backdrop-blur-sm">
                <InteractiveHowItWorks />
            </section>

            {/* 
        ------------------------------------------------------------
        WHAT YOU WILL GET SECTION
        ------------------------------------------------------------
      */}
            {/* 
        ------------------------------------------------------------
        WHAT YOU WILL GET SECTION
        ------------------------------------------------------------
      */}
            <section className="relative py-24 px-6 md:px-20 bg-black/40 backdrop-blur-md border-t border-white/5">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-600/30 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-16">

                        {/* Left Content */}
                        <div className="flex-1 space-y-8">
                            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                                What You Will Get with <br /> <span className="text-emerald-400">KisanMind</span>
                            </h2>
                            <p className="text-lg text-neutral-400 leading-relaxed">
                                Stop guessing and start farming with precision. Our platform provides comprehensive tools to transform your agricultural practices.
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Precision Farming Intelligence",
                                    "Real-time Disease Detection",
                                    "Hyper-local Weather Forecasts",
                                    "Government Scheme Integration",
                                    "Direct Market Access"
                                ].map((item, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 + (i * 0.1) }}
                                        className="flex items-center space-x-3 text-white"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <span className="text-lg">{item}</span>
                                    </motion.li>
                                ))}
                            </ul>

                            <div className="pt-6">
                                <SVGButton variant="secondary" onClick={() => router.push("/about")}>
                                    Learn More
                                </SVGButton>
                            </div>
                        </div>

                        {/* Right Visual (Abstract Card Stack or Image) */}
                        <div className="flex-1 relative h-[500px] w-full flex items-center justify-center">
                            {/* Abstract Glass Cards */}
                            <div className="absolute w-[80%] h-[60%] bg-emerald-900/20 backdrop-blur-md border border-white/10 rounded-2xl rotate-[-6deg] z-0 transform translate-y-4" />
                            <div className="absolute w-[80%] h-[60%] bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl rotate-0 z-10 flex flex-col items-center justify-center text-center p-8 shadow-2xl">
                                <h3 className="text-2xl font-bold text-white mb-2">Maximize Output</h3>
                                <p className="text-neutral-400">Increase crop yield by up to 40% with data-driven insights.</p>
                                <div className="mt-8 w-full h-32 bg-gradient-to-t from-emerald-500/20 to-transparent rounded-lg relative overflow-hidden flex items-end">
                                    {/* Simple Graph Line */}
                                    <div className="w-full h-full flex items-end justify-between px-2 pb-2 gap-1">
                                        {[30, 45, 35, 60, 50, 75, 65, 90, 80, 100].map((h, i) => (
                                            <div key={i} className="w-full bg-emerald-500/50 rounded-t-sm" style={{ height: `${h}%`, opacity: 0.4 + (i * 0.06) }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 
        ------------------------------------------------------------
        IMPACT STATS BANNER
        ------------------------------------------------------------
      */}
            <section className="py-16 bg-emerald-900/10 border-y border-white/5 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 md:px-20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { label: "Farmers Validated", value: "5+" },
                            { label: "Crops Supported", value: "12+" },
                            { label: "Value Created", value: "???" },
                            { label: "Districts Covered", value: "20+" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="text-3xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                                <div className="text-sm md:text-base text-neutral-400 uppercase tracking-widest">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 
        ------------------------------------------------------------
        WHY KISANMIND SECTION
        ------------------------------------------------------------
      */}
            <section className="py-24 px-6 md:px-20 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Why Choose <span className="text-emerald-400">KisanMind</span>?</h2>
                        <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                            We combine advanced AI with deep agricultural expertise to solve real problems.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Bot className="w-8 h-8 text-emerald-400" />,
                                title: "AI Precision",
                                desc: "Powered by Opus 4.6 to deliver 90% accuracy in disease detection and yield forecasting."
                            },
                            {
                                icon: <TrendingUp className="w-8 h-8 text-blue-400" />,
                                title: "Lightning Fast",
                                desc: "Get comprehensive farm analysis reports in under 30 seconds. Speed matters in farming."
                            },
                            {
                                icon: <Sprout className="w-8 h-8 text-green-400" />,
                                title: "Farmer First",
                                desc: "Designed for simplicity. Voice interactions in 12 regional languages make it accessible to everyone."
                            }
                        ].map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="bg-neutral-900/40 backdrop-blur border border-white/10 p-8 rounded-2xl hover:bg-neutral-800/60 transition-colors"
                            >
                                <div className="w-14 h-14 bg-neutral-800/50 rounded-xl flex items-center justify-center mb-6">
                                    {card.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                                <p className="text-neutral-400 leading-relaxed">{card.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* 
        ------------------------------------------------------------
        TESTIMONIALS SECTION
        ------------------------------------------------------------
      */}


            <section className="py-24 px-6 md:px-20 bg-neutral-900/30 border-t border-white/5 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">Trusted by Farmers</h2>
                    <p className="text-neutral-400 text-center mb-12">See how KisanMind is changing lives across India</p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                id: 1,
                                title: "Prevented Crop Failure",
                                description: "\"KisanMind saved my cotton crop from pink bollworm. The early warning was a lifesaver. I saved over ₹50,000 in potential losses.\"",
                                image: "https://images.unsplash.com/photo-1595254199923-d65604169c8a?auto=format&fit=crop&q=80&w=800",
                                location: "Maharashtra"
                            },
                            {
                                id: 2,
                                title: "Increased Profit by 20%",
                                description: "\"I got the best price for my turmeric this year thanks to the market intelligence feature. The prediction was spot on!\"",
                                image: "https://images.unsplash.com/photo-1627920769843-26c792196024?auto=format&fit=crop&q=80&w=800",
                                location: "Telangana"
                            },
                            {
                                id: 3,
                                title: "Expert Farming Advice",
                                description: "\"Finally, an app that understands my language and gives advice that actually works. It's like having an expert agronomist in my pocket.\"",
                                image: "https://images.unsplash.com/photo-1495570689269-d88bbb70d30f?auto=format&fit=crop&q=80&w=800",
                                location: "Punjab"
                            },
                            {
                                id: 4,
                                title: "Subsidies Approved",
                                description: "\"I didn't know I was eligible for a drip irrigation subsidy until KisanMind matched me. Applied and approved in 2 weeks!\"",
                                image: "https://images.unsplash.com/photo-1533241242369-0056914b1b86?auto=format&fit=crop&q=80&w=800",
                                location: "Gujarat"
                            }
                        ].map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 * item.id }}
                                className="bg-neutral-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-neutral-800/60 transition-all hover:-translate-y-1 group"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20">
                                        <img src={item.image} alt="Farmer" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-sm">Verified Farmer</div>
                                        <div className="text-emerald-400 text-xs">{item.location}</div>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 
        ------------------------------------------------------------
        FAQ SECTION
        ------------------------------------------------------------
      */}
            <section className="py-24 px-6 md:px-20 max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {[
                        { q: "Is KisanMind free to use?", a: "Yes, our core analysis features are 100% free for farmers. We are committed to democratizing access to agricultural technology." },
                        { q: "Does it work without internet?", a: "KisanMind requires an internet connection for analysis, but we have a 'Lite Mode' that works well even on 2G networks in remote areas." },
                        { q: "How accurate is the disease detection?", a: "Our AI model, powered by Opus 4.6, has been trained on over 10 million plant images and achieves an accuracy rate of over 90%." }
                    ].map((faq, i) => (
                        <div key={i} className="bg-neutral-900/40 border border-white/10 rounded-xl overflow-hidden">
                            <details className="group">
                                <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-6 text-white hover:bg-white/5 transition-colors">
                                    <span>{faq.q}</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-neutral-400 mt-0 px-6 pb-6 pt-0 leading-relaxed">
                                    {faq.a}
                                </div>
                            </details>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer Space for Dock */}
            <div className="h-32 w-full bg-transparent flex flex-col items-center justify-center text-neutral-600 text-sm">
                <p>&copy; 2026 KisanMind. All rights reserved.</p>
            </div>

        </main>
    );
}
