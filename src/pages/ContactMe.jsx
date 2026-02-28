import React, { useRef } from "react";
import { useMotionValue, motion, useSpring, useTransform } from "framer-motion";
import { FiArrowRight, FiArrowLeft } from "react-icons/fi";
import DrawOutlineButton from "../components/DrawOutlineButton.jsx";

const ContactMe = () => {
    return (
        <section className="contact-section">
            <div className="contact-container" style={{ position: 'relative' }}>
                <DrawOutlineButton
                    to="/"
                    style={{ position: 'absolute', top: '20px', left: '0' }}
                >
                    <FiArrowLeft /> BACK TO HOME
                </DrawOutlineButton>
                <h1 className="contact-title" style={{ marginTop: '40px' }}>
                    Let's <span>Connect</span>
                </h1>
                <Link
                    heading="LinkedIn"
                    subheading="Professional Network"
                    imgSrc="/Linkedin.png"
                    href="https://www.linkedin.com/in/dharmanshu-davara-a6b01138b?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                />
                <Link
                    heading="GitHub"
                    subheading="Open Source & Projects"
                    imgSrc="/GitHub.webp"
                    href="https://github.com/dharmanshudavara-hue"
                />
                <Link
                    heading="Instagram"
                    subheading="Life & Behind the Scenes"
                    imgSrc="/Instagram.png"
                    href="https://www.instagram.com/dharmanshu_davara04/"
                />
                <Link
                    heading="Mail"
                    subheading="Direct Contact"
                    imgSrc="/Mail.png"
                    href="mailto:dharmanshudavara@gmail.com"
                />
            </div>
        </section>
    );
};

const Link = ({ heading, imgSrc, subheading, href }) => {
    const ref = useRef(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const top = useTransform(mouseYSpring, [0.5, -0.5], ["40%", "60%"]);
    const left = useTransform(mouseXSpring, [0.5, -0.5], ["60%", "70%"]);

    const handleMouseMove = (e) => {
        const rect = ref.current.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    return (
        <motion.a
            href={href}
            ref={ref}
            onMouseMove={handleMouseMove}
            initial="initial"
            whileHover="whileHover"
            target="_blank"
            rel="noopener noreferrer"
            className="hover-link-group hover-link-container"
        >
            <div>
                <motion.span
                    variants={{
                        initial: { x: 0 },
                        whileHover: { x: -16 },
                    }}
                    transition={{
                        type: "spring",
                        staggerChildren: 0.075,
                        delayChildren: 0.25,
                    }}
                    className="hover-link-heading"
                >
                    {heading.split("").map((l, i) => (
                        <motion.span
                            variants={{
                                initial: { x: 0 },
                                whileHover: { x: 16 },
                            }}
                            transition={{ type: "spring" }}
                            className="hover-link-letter"
                            key={i}
                        >
                            {l}
                        </motion.span>
                    ))}
                </motion.span>
                <span className="hover-link-subheading">
                    {subheading}
                </span>
            </div>

            <motion.img
                style={{
                    top,
                    left,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                variants={{
                    initial: { scale: 0, rotate: "-12.5deg" },
                    whileHover: { scale: 1, rotate: "12.5deg" },
                }}
                transition={{ type: "spring" }}
                src={imgSrc}
                className="hover-link-img"
                alt={`Image representing a link for ${heading}`}
            />

            <motion.div
                variants={{
                    initial: {
                        x: "25%",
                        opacity: 0,
                    },
                    whileHover: {
                        x: "0%",
                        opacity: 1,
                    },
                }}
                transition={{ type: "spring" }}
                className="hover-link-icon-wrapper"
            >
                <FiArrowRight className="hover-link-icon" />
            </motion.div>
        </motion.a>
    );
};

export default ContactMe;
