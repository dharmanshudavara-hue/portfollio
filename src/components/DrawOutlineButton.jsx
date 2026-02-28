import React, { useState } from "react";
import { Link } from "react-router-dom";

const DrawOutlineButton = ({ children, className = "", to, onClick, ...rest }) => {
    const Component = to ? Link : "button";
    const [clickCount, setClickCount] = useState(0);

    const handleClick = (e) => {
        setClickCount((prev) => prev + 1);
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

            {/* Hidden iframe that re-renders on click to trigger the sound */}
            {clickCount > 0 && (
                <iframe
                    key={clickCount}
                    width="0"
                    height="0"
                    frameBorder="no"
                    scrolling="no"
                    src="https://quicksounds.com/sound/22305/fahhh"
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                    allow="autoplay"
                ></iframe>
            )}

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
