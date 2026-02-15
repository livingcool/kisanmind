"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Target, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen w-full relative pt-24 px-6 md:px-20 text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            About KisanMind
          </h1>
          <p className="text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            Empowering farmers with intelligent insights to cultivate a prosperous future.
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <div className="bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="p-4 bg-emerald-900/30 rounded-2xl">
                <Target className="w-12 h-12 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4 text-white">Our Mission</h2>
                <p className="text-lg text-neutral-300 leading-relaxed">
                  At KisanMind, our mission is to bridge the gap between traditional farming wisdom and modern technological advancement. We believe that every farmer deserves access to the best data, analysis, and tools to maximize their yield and income. By leveraging the power of <span className="text-emerald-400 font-semibold">Opus 4.6</span> AI, we provide personalized, actionable insights that truly make a difference.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vision Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-20"
        >
          <div className="bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="p-4 bg-cyan-900/30 rounded-2xl">
                <Heart className="w-12 h-12 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4 text-white">Why We Build</h2>
                <p className="text-lg text-neutral-300 leading-relaxed">
                  Farmers are the backbone of our society. We build to support them. Our platform is designed to be intuitive, accessible, and powerful. We are committed to creating a sustainable ecosystem where technology and nature work in harmony for abundant growth.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Powered By Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center pb-20"
        >
          <div className="inline-block bg-neutral-800/50 backdrop-blur border border-white/5 rounded-full px-8 py-4">
            <span className="text-neutral-400 text-lg">Powered by </span>
            <span className="text-2xl font-bold text-white ml-2">Opus 4.6</span>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
