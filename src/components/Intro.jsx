import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Intro({ onComplete }) {
    const [isExiting, setIsExiting] = useState(false);
    const videoRef = useRef(null);

    const handleVideoEnd = () => {
        setIsExiting(true);
        setTimeout(() => {
            onComplete();
        }, 1000); // 1-second fade out
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.defaultMuted = true;
            videoRef.current.muted = true;

            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.error("Autoplay prevented or video failed to load:", error);
                    // If video fails to play, skip the intro so we don't block the site
                    handleVideoEnd();
                });
            }
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
                    {/* Hidden audio iframe to play the requested sound */}
                    <iframe
                        width="0"
                        height="0"
                        frameBorder="no"
                        scrolling="no"
                        src="https://quicksounds.com/sound/22305/fahhh"
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                        allow="autoplay"
                    ></iframe>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
