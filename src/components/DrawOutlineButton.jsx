import React, { useRef } from "react";
import { Link } from "react-router-dom";
import fahhSound from "../assets/fahh.mp3";

const DrawOutlineButton = ({ children, className = "", to, onClick, ...rest }) => {
    const Component = to ? Link : "button";
    const audioRef = useRef(null);

    const handleClick = (e) => {
        if (!audioRef.current) {
            audioRef.current = new Audio(fahhSound);
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play();

        if (onClick) {
            onClick(e);
        }
    };

    return (
        <Component
            to={to}
            {...rest}
            onClick={handleClick}
            className={`draw-outline-btn ${className}`}
        >
            <span>{children}</span>

            {/* TOP */}
            <span className="outline-top" />

            {/* RIGHT */}
            <span className="outline-right" />

            {/* BOTTOM */}
            <span className="outline-bottom" />

            {/* LEFT */}
            <span className="outline-left" />
        </Component>
    );
};

export default DrawOutlineButton;
