import React, { useState, useEffect } from 'react';

interface AvatarProps {
    src?: string | null;
    alt: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // sm: 32px, md: 40px, lg: 48px, xl: 80px, 2xl: 128px
    className?: string;
    fallbackColor?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', className = '', fallbackColor = 'from-indigo-500 to-purple-500' }) => {
    const [imgError, setImgError] = useState(false);

    // Reset error state if src changes
    useEffect(() => {
        setImgError(false);
    }, [src]);

    const getInitials = (name: string) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-20 h-20 text-xl',
        '2xl': 'w-32 h-32 text-4xl'
    };

    if (src && !imgError) {
        return (
            <img
                src={src}
                alt={alt}
                className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div className={`rounded-full bg-gradient-to-tr ${fallbackColor} flex items-center justify-center font-bold text-white shadow-lg ${sizeClasses[size]} ${className}`}>
            {getInitials(alt)}
        </div>
    );
};

export default Avatar;
