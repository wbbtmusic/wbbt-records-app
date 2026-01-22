import React, { useState, useEffect } from 'react';

const images = [
    '/assets/login-bg/bg1.png',
    '/assets/login-bg/bg2.jpg',
    '/assets/login-bg/bg3.png',
    '/assets/login-bg/bg4.png',
    '/assets/login-bg/bg5.png',
];

const BackgroundSlideshow: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000); // Change image every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Images */}
            {images.map((src, index) => (
                <div
                    key={src}
                    className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{ backgroundImage: `url(${src})` }}
                />
            ))}

            {/* Black Overlay with 5% Blur/Opacity as requested ("hafif cok az %5 blur") 
          Interpreting as low opacity black overlay to make text readable but keep image visible.
          The user said: "uzerinde siyah katman olsun hafif çok az %5 blur koy".
      */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
    );
};

export default BackgroundSlideshow;
