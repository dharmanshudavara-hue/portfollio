import { useRef } from "react";
import { Link } from "react-router-dom";
import {
    motion,
    useMotionTemplate,
    useScroll,
    useTransform,
} from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import DrawOutlineButton from "../components/DrawOutlineButton.jsx";
import { AnimatedText } from "../components/ui/AnimatedText.jsx";
import AboutMe from "./AboutMe.jsx";

const SECTION_HEIGHT = 1500;

/*  HOME PAGE  */
export default function Home() {
    return (
        <>
            <Nav />
            <Hero />
            <Skills />
            <AboutMe />
            <Footer />
        </>
    );
}

/*  NAV  */
const Nav = () => {
    return (
        <nav className="nav">
            <a href="#" className="nav-logo">
                Port<span>folio</span>
            </a>
            <div style={{ display: 'flex', gap: '16px' }}>
                <DrawOutlineButton to="/projects">
                    MY PROJECTS <FiArrowRight />
                </DrawOutlineButton>
                <DrawOutlineButton to="/arcade">
                    ARCADE <FiArrowRight />
                </DrawOutlineButton>
                <DrawOutlineButton to="/contact">
                    CONTACT <FiArrowRight />
                </DrawOutlineButton>
            </div>
        </nav>
    );
};

/*  HERO  */
const Hero = () => {
    return (
        <div
            style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)` }}
            className="hero-wrapper"
        >
            <div style={{
                position: 'absolute',
                top: '90px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 50,
                color: '#32cd32'
            }}>
                <AnimatedText text="Scroll !!" />
            </div>
            <CenterImage />
            <ParallaxImages />
            <div className="hero-gradient" />
        </div>
    );
};

const CenterImage = () => {
    const { scrollY } = useScroll();

    const clip1 = useTransform(scrollY, [0, 1500], [25, 0]);
    const clip2 = useTransform(scrollY, [0, 1500], [75, 100]);

    const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

    const backgroundSize = useTransform(
        scrollY,
        [0, SECTION_HEIGHT + 500],
        ["170%", "100%"]
    );

    const opacity = useTransform(
        scrollY,
        [SECTION_HEIGHT, SECTION_HEIGHT + 500],
        [1, 0]
    );

    return (
        <motion.div
            className="center-image"
            style={{
                clipPath,
                backgroundSize,
                opacity,
                backgroundImage: "url('/WEB DEVELOPER.png')",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        />
    );
};

/* PARALLAX IMAGES */
const ParallaxImages = () => {
    return (
        <div className="parallax-container">
            <ParallaxImg
                src="/WEB DESIGNER.png"
                alt="Web Designer"
                start={-200}
                end={200}
                className="parallax-img parallax-img-1"
            />
            <ParallaxImg
                src="/MUSICIAN.png"
                alt="Musician"
                start={200}
                end={-250}
                className="parallax-img parallax-img-2"
            />
            <ParallaxImg
                src="/PFOTOGRAPHER.png"
                alt="Photographer"
                start={-200}
                end={200}
                className="parallax-img parallax-img-3"
            />
            <ParallaxImg
                src="/CYBER SECURITY.png"
                alt="Cyber Security"
                start={0}
                end={-500}
                className="parallax-img parallax-img-4"
            />
            <ParallaxImg
                src="/WEB DEVELOPER.png"
                alt="Web Developer"
                start={-100}
                end={300}
                className="parallax-img parallax-img-5"
            />
        </div>
    );
};

const ParallaxImg = ({ className, alt, src, start, end }) => {
    const ref = useRef(null);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: [`${start}px end`, `end ${end * -1}px`],
    });

    const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
    const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.85]);
    const y = useTransform(scrollYProgress, [0, 1], [start, end]);
    const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;

    return (
        <motion.img
            src={src}
            alt={alt}
            className={className}
            ref={ref}
            style={{ transform, opacity }}
        />
    );
};

/*  SKILLS SECTION  */
const Skills = () => {
    return (
        <section id="my-skills" className="skills-section">
            <motion.h1
                initial={{ y: 48, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ ease: "easeInOut", duration: 0.75 }}
                className="skills-title"
            >
                What I <span>Do</span>
            </motion.h1>
            <SkillItem
                title="Web Development"
                subtitle="Frontend & Backend"
                meta="React • Node • Next.js"
            />
            <SkillItem
                title="Web Design"
                subtitle="UI/UX & Visual Design"
                meta="Figma • Adobe XD"
            />
            <SkillItem
                title="Photography"
                subtitle="Creative & Commercial"
                meta="Portraits • Events"
            />
            <SkillItem
                title="Music"
                subtitle="Production & Performance"
                meta="Composing • Mixing"
            />
            <SkillItem
                title="Cyber Security"
                subtitle="Analysis & Protection"
                meta="Pen Testing • Audits"
            />
        </section>
    );
};

const SkillItem = ({ title, subtitle, meta }) => {
    return (
        <motion.div
            initial={{ y: 48, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ ease: "easeInOut", duration: 0.75 }}
            className="skill-item"
        >
            <div className="skill-info">
                <p className="skill-title">{title}</p>
                <p className="skill-subtitle">{subtitle}</p>
            </div>
            <div className="skill-meta">
                <p>{meta}</p>
            </div>
        </motion.div>
    );
};

/*  FOOTER  */
const Footer = () => {
    return (
        <footer className="footer">
            <p>© 2026 Portfolio. Built by Dharmanshu.</p>
        </footer>
    );
};
