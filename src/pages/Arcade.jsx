import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import DrawOutlineButton from "../components/DrawOutlineButton.jsx";
import FlappyBird from "../components/FlappyBird.jsx";
import Beatmaker from "../components/Beatmaker.jsx";

export default function Arcade() {
    const [activeGame, setActiveGame] = useState(null); // null | 'flappy' | 'beatmaker'

    return (
        <div className="arcade-section">
            <ArcadeNav />
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="arcade-content"
            >
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="arcade-title"
                >
                    Ar<span>cade</span> & Play<span>ground</span>
                </motion.h1>

                <AnimatePresence mode="wait">
                    {!activeGame ? (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="arcade-menu"
                        >
                            <p className="arcade-subtitle">
                                Select an interactive experience.
                            </p>
                            <div className="arcade-cards">
                                <div className="arcade-card" onClick={() => setActiveGame('flappy')}>
                                    <img src="/flappybird.png" alt="Flappy Bird" />
                                    <div className="arcade-card-overlay">
                                        <h3>Pixel Flappy Bird</h3>
                                    </div>
                                </div>
                                <div className="arcade-card" onClick={() => setActiveGame('beatmaker')}>
                                    <img src="/neonbeatmaker.png" alt="Neon Beatmaker" />
                                    <div className="arcade-card-overlay">
                                        <h3>Neon Beatmaker</h3>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="arcade-active-view"
                        >
                            <button className="arcade-back-btn" onClick={() => setActiveGame(null)}>
                                <FiArrowLeft /> BACK TO ARCADE
                            </button>

                            {activeGame === 'flappy' && (
                                <>
                                    <div className="arcade-game-container">
                                        <div className="arcade-game-border">
                                            <FlappyBird />
                                        </div>
                                    </div>
                                    <div className="arcade-controls-hint">
                                        <div className="arcade-key">SPACE</div>
                                        <span>or</span>
                                        <div className="arcade-key">CLICK</div>
                                        <span>or</span>
                                        <div className="arcade-key">TAP</div>
                                        <span className="arcade-hint-text">to flap</span>
                                    </div>
                                </>
                            )}

                            {activeGame === 'beatmaker' && (
                                <div className="arcade-game-container">
                                    <Beatmaker />
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <footer className="footer">
                <p>© 2026 Portfolio. Built by Dharmanshu.</p>
            </footer>
        </div>
    );
}

const ArcadeNav = () => {
    return (
        <nav className="nav">
            <a href="/" className="nav-logo">
                Port<span>folio</span>
            </a>
            <div style={{ display: "flex", gap: "16px" }}>
                <DrawOutlineButton to="/">
                    <FiArrowLeft /> HOME
                </DrawOutlineButton>
                <DrawOutlineButton to="/projects">
                    MY PROJECTS <FiArrowRight />
                </DrawOutlineButton>
                <DrawOutlineButton to="/contact">
                    CONTACT <FiArrowRight />
                </DrawOutlineButton>
            </div>
        </nav>
    );
};
