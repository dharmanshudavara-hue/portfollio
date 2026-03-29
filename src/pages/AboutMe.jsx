import React from "react";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import DrawOutlineButton from "../components/DrawOutlineButton.jsx";
import { AnimatedText } from "../components/ui/AnimatedText.jsx";
import "./AboutMe.css";

const AboutMe = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { ease: "easeOut", duration: 0.8 },
        },
    };

    return (
        <section className="about-section">
            <div className="about-background-blob" />
            
            <motion.div 
                className="about-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="back-btn-wrapper">
                    <DrawOutlineButton to="/">
                        <FiArrowLeft /> BACK TO HOME
                    </DrawOutlineButton>
                </div>

                <motion.div variants={itemVariants}>
                    <AnimatedText text="About Me" textClassName="about-title" />
                </motion.div>

                <motion.div variants={itemVariants} className="about-content">
                    <p>
                        I am <span className="about-highlight">Dharmanshu</span>. An aspiring Electrical engineering student at 
                        <span className="about-accent"> Sardar Vallabhbhai National Institute of Technology-Surat</span>.
                    </p>
                    <p>
                        Tech and AI Enthusiast. I am currently into Web Designing and Web Developing and Exploring the real world problems of Cyber Security.
                    </p>
                    <p>
                        I am deeply passionate about blending logic with creativity. My engineering background gives me a strong foundation in problem-solving, while web development allows me to build engaging digital experiences. Simultaneously, I am constantly exploring the mechanics of protection and vulnerabilities to build a more secure digital world.
                    </p>
                </motion.div>
            </motion.div>
        </section>
    );
};

export default AboutMe;
