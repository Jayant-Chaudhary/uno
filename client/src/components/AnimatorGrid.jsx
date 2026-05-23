import { useEffect, useRef } from "react";

function AnimatedBackground() {
  const orbRef = useRef(null);

  const mouse = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  const position = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrame;

    const animate = () => {
      // Smooth interpolation
      position.current.x += (mouse.current.x - position.current.x) * 0.08;

      position.current.y += (mouse.current.y - position.current.y) * 0.08;

      if (orbRef.current) {
        orbRef.current.style.transform = `
          translate(
            ${position.current.x - 150}px,
            ${position.current.y - 150}px
          )
        `;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);

      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br  from-[#090014] via-[#120022] to-black" />

      {/* Dot Pattern */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(rgba(168,85,247,0.45) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Smooth Orb */}
      <div
        ref={orbRef}
        className="absolute h-50 w-50 rounded-full bg-purple-500/30 blur-3xl"
      />
    </div>
  );
}

export default AnimatedBackground;
