import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    motion,
    useMotionTemplate,
    useScroll,
    useTransform,
} from "framer-motion";
import { FiArrowLeft, FiArrowUpRight, FiExternalLink } from "react-icons/fi";
import DrawOutlineButton from "../components/DrawOutlineButton.jsx";

const SECTION_HEIGHT = 1500;

const PROJECTS = [
    {
        title: "SVNIT Clone",
        subtitle: "University Website Redesign",
        image: "/SVNIT.png",
        link: "https://svnitclone.vercel.app/",
        tech: "HTML • CSS • JavaScript",
    },
    {
        title: "AirPods Landing Page",
        subtitle: "Product Showcase Website",
        image: "/AirPods.png",
        link: "https://airpods-frontend.vercel.app/",
        tech: "React • Framer Motion • CSS",
    },
    {
        title: "eduDiary",
        subtitle: "Attendance Tracking Platform",
        image: "/edudiary.png",
        link: "https://edudiary.vercel.app/",
        tech: "Web Application • React • Node.js",
    },
];

/*  PROJECTS PAGE  */
export default function Projects() {
    return (
        <>
            <Nav />
            <ProjectsHero />
            <ProjectsList />
            <Footer />
        </>
    );
}

/*  NAV  */
const Nav = () => {
    return (
        <nav className="nav">
            <Link to="/" className="nav-logo">
                Port<span>folio</span>
            </Link>
            <DrawOutlineButton to="/">
                <FiArrowLeft /> BACK HOME
            </DrawOutlineButton>
        </nav>
    );
};

/*  PROJECTS HERO  */
const ProjectsHero = () => {
    return (
        <div
            style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)` }}
            className="hero-wrapper"
        >
            <CenterImage />
            <ParallaxProjectImages />
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
                backgroundImage: "url('/SVNIT.png')",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        />
    );
};

/*  PARALLAX PROJECT IMAGES  */
const ParallaxProjectImages = () => {
    return (
        <div className="parallax-container">
            <ParallaxImg
                src="/SVNIT.png"
                alt="SVNIT Clone"
                start={-200}
                end={200}
                className="parallax-img parallax-img-1"
                link="https://svnitclone.vercel.app/"
            />
            <ParallaxImg
                src="/AirPods.png"
                alt="AirPods Landing Page"
                start={200}
                end={-250}
                className="parallax-img parallax-img-2"
                link="https://airpods-frontend.vercel.app/"
            />
            <ParallaxImg
                src="/edudiary.png"
                alt="EduDiary Platform"
                start={-200}
                end={200}
                className="parallax-img parallax-img-3"
                link="https://edudiary.vercel.app/"
            />
        </div>
    );
};

const ParallaxImg = ({ className, alt, src, start, end, link }) => {
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
        <motion.a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            ref={ref}
            style={{ transform, opacity, display: "block" }}
            className={className}
        >
            <img
                src={src}
                alt={alt}
                style={{ width: "100%", display: "block", borderRadius: "12px" }}
            />
        </motion.a>
    );
};

/*  PROJECTS LIST  */
const ProjectsList = () => {
    return (
        <section id="projects-list" className="projects-section">
            <motion.h1
                initial={{ y: 48, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ ease: "easeInOut", duration: 0.75 }}
                className="projects-title"
            >
                My <span>Projects</span>
            </motion.h1>

            <div className="projects-grid">
                {PROJECTS.map((project, i) => (
                    <ProjectCard key={i} project={project} index={i} />
                ))}
            </div>
        </section>
    );
};

const ProjectCard = ({ project, index }) => {
    return (
        <motion.a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="project-card"
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ ease: "easeInOut", duration: 0.75, delay: index * 0.15 }}
            viewport={{ once: true }}
        >
            <div className="project-card-image-wrapper">
                <img
                    src={project.image}
                    alt={project.title}
                    className="project-card-image"
                />
                <div className="project-card-overlay">
                    <div className="project-card-overlay-content">
                        <FiExternalLink className="project-card-overlay-icon" />
                        <span>View Live</span>
                    </div>
                </div>
            </div>
            <div className="project-card-info">
                <div>
                    <h3 className="project-card-title">{project.title}</h3>
                    <p className="project-card-subtitle">{project.subtitle}</p>
                </div>
                <div className="project-card-meta">
                    <p>{project.tech}</p>
                    <FiArrowUpRight className="project-card-arrow" />
                </div>
            </div>
        </motion.a>
    );
};


/* ========================= FOOTER ========================= */
const Footer = () => {
    return (
        <footer className="footer">
            <p>© 2026 Portfolio. Built with passion & creativity.</p>
        </footer>
    );
};
