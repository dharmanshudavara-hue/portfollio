import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lenis from "lenis";
import { Analytics } from "@vercel/analytics/react";
import Home from "./pages/Home.jsx";
import Projects from "./pages/Projects.jsx";
import ContactMe from "./pages/ContactMe.jsx";
import Intro from "./components/Intro.jsx";

export default function App() {
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        if (showIntro) return;

        const lenis = new Lenis({
            lerp: 0.05,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, [showIntro]);

    return (
        <BrowserRouter>
            {showIntro ? (
                <Intro onComplete={() => setShowIntro(false)} />
            ) : (
                <div style={{ backgroundColor: "#09090b", minHeight: "100vh" }}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/contact" element={<ContactMe />} />
                    </Routes>
                </div>
            )}
            <Analytics />
        </BrowserRouter>
    );
}
