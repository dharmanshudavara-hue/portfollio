import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Intro({ onComplete }) {
    const [isExiting, setIsExiting] = useState(false);
    const videoRef = useRef(null);
    const audioRef = useRef(null);

    // 🎬 Fade out audio smoothly
    const fadeOutAudio = () => {
        if (!audioRef.current) return;

        const audio = audioRef.current;
        let volume = audio.volume;

        const fade = setInterval(() => {
            if (volume > 0.05) {
                volume -= 0.05;
                audio.volume = volume;
            } else {
                audio.volume = 0;
                audio.pause();
                clearInterval(fade);
            }
        }, 50);
    };

    const handleVideoEnd = () => {
        setIsExiting(true);
        fadeOutAudio();

        setTimeout(() => {
            onComplete();
        }, 1000); // Matches fade animation
    };

    useEffect(() => {
        // 🎥 Play video
        if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {
                handleVideoEnd();
            });
        }

        // 🎵 Play intro sound
        if (audioRef.current) {
            const audio = audioRef.current;
            audio.volume = 0.6; // Adjust volume here (0–1)

            const playAudio = () => {
                audio.play().catch(() => {
                    console.log("Autoplay blocked, waiting for user interaction.");
                });
            };

            playAudio();

            // Fallback: play on first user click
            window.addEventListener("click", playAudio, { once: true });
        }
    }, []);

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    className="intro-container"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                >
                    {/* 🎥 Intro Video */}
                    <video
                        ref={videoRef}
                        className="intro-video"
                        src="/intro.mp4"
                        autoPlay
                        muted
                        playsInline
                        onEnded={handleVideoEnd}
                        onError={handleVideoEnd}
                    />

                    {/* 🎵 Background Intro Audio */}
                    <audio
                        ref={audioRef}
                        src="/intro-sound.mp3"
                        preload="auto"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
