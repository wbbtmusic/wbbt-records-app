import React from 'react';
import { Cat, Sparkles, BrainCircuit } from 'lucide-react';

interface ComingSoonProps {
    title: string;
    subtitle?: string;
    theme?: 'default' | 'pink' | 'blue';
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title, subtitle, theme = 'default' }) => {

    const themeColors = {
        default: {
            text: 'text-indigo-400',
            bg: 'bg-indigo-500',
            glow: 'bg-indigo-600/30'
        },
        pink: {
            text: 'text-pink-400',
            bg: 'bg-pink-500',
            glow: 'bg-pink-600/30'
        },
        blue: {
            text: 'text-blue-400',
            bg: 'bg-blue-500',
            glow: 'bg-blue-600/30'
        }
    };

    const colors = themeColors[theme];

    return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4 relative overflow-hidden">

            {/* Restored Background Glow */}
            <div className={`absolute w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse-slow ${colors.glow}`}></div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Dynamic Icon */}
                <div className={`mb-8 p-6 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 animate-pulse`}>
                    {theme === 'pink' ? (
                        <Cat size={48} className={colors.text} />
                    ) : theme === 'blue' ? (
                        <BrainCircuit size={48} className={colors.text} />
                    ) : (
                        <Sparkles size={48} className={colors.text} />
                    )}
                </div>

                {/* Main Title */}
                <h1 className="text-6xl md:text-8xl font-black font-display tracking-tighter text-white mb-4">
                    {title.toUpperCase()}
                </h1>

                {/* Subtitle */}
                <p className="text-[#888] max-w-xl text-lg mb-12">
                    {subtitle || "We are preparing something special."}
                </p>

                {/* 99% Indicator */}
                <div className="flex flex-col items-center gap-4 w-full max-w-md">
                    <div className="flex items-end gap-2">
                        <span className={`text-6xl font-bold font-display ${colors.text}`}>99%</span>
                        <span className="text-white/40 font-bold mb-2 text-xl">Ready</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full w-[99%] rounded-full ${colors.bg} relative`}>
                            <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                        </div>
                    </div>

                    <div className="mt-4 px-4 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur-md">
                        <span className="text-sm font-bold text-white tracking-widest uppercase">Coming Soon</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComingSoon;
