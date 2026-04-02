import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './DynamicBackground.css';

const DynamicBackground = () => {
    const location = useLocation();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const isHomePage = location.pathname === '/';
    const containerRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isHomePage) return;
            
            const { clientX, clientY } = e;
            const moveX = (clientX - window.innerWidth / 2) / 25;
            const moveY = (clientY - window.innerHeight / 2) / 25;
            
            setMousePos({ x: moveX, y: moveY });
            
            // Also update CSS variables for smoother CSS-only effects
            if (containerRef.current) {
                containerRef.current.style.setProperty('--mouse-x', `${clientX}px`);
                containerRef.current.style.setProperty('--mouse-y', `${clientY}px`);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isHomePage]);

    if (isHomePage) return null;

    return (
        <div className="dynamic-bg-container" ref={containerRef}>
            <div className="bg-glow" />
            
            {/* Floating 3D Shapes - Following Home Page Reference */}
            <div 
                className="bg-shape bg-torus" 
                style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px) rotate(${mousePos.x * 0.1}deg)` }}
            />
            <div 
                className="bg-shape bg-sphere" 
                style={{ transform: `translate(${mousePos.x * -0.8}px, ${mousePos.y * -0.8}px)` }}
            />
            <div 
                className="bg-shape bg-ring" 
                style={{ transform: `translate(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px)` }}
            />
            <div 
                className="bg-shape bg-cube" 
                style={{ transform: `translate(${mousePos.x * -0.4}px, ${mousePos.y * 0.6}px) rotate(${mousePos.y * 0.2}deg)` }}
            />

            {/* Subtle Gradient Overlays */}
            <div className="bg-overlay" />
        </div>
    );
};

export default DynamicBackground;
