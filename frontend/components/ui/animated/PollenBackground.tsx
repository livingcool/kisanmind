"use client";

import React, { useEffect, useRef } from "react";

export const PollenBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener("resize", resize);
        resize();

        // Particle configuration
        const particleCount = 100;
        const particles: {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;
        }[] = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: Math.random() * 0.5 + 0.2, // Drifting down mostly
                opacity: Math.random() * 0.5 + 0.1,
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw Background Gradient
            // We do this in CSS for better performance, so canvas is just particles
            // But we can add a subtle overlay here if needed.

            ctx.fillStyle = "#fbbf24"; // Amber/Gold pollen color

            particles.forEach((p) => {
                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Update position
                p.x += p.speedX + Math.sin(p.y * 0.01) * 0.2; // Add some sway
                p.y += p.speedY;

                // Reset if out of bounds
                if (p.y > height) {
                    p.y = -10;
                    p.x = Math.random() * width;
                }
                if (p.x > width) p.x = 0;
                if (p.x < 0) p.x = width;
            });

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Deep Dark Gradient Background (Darker/Black with hint of Green) */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-900 to-emerald-950" />

            {/* Pollen Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
        </div>
    );
};
