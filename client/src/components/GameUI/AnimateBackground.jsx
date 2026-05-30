import { useEffect, useRef } from "react";

function AnimatedBackground({ isMyTurn, currentColor }) {
  const orbRef = useRef(null);
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const position = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  // Determine theme colors based on whose turn it is
  const themeColor = isMyTurn
    ? "rgba(34, 197, 94, 0.4)" // Bright Green
    : currentColor === "red"
      ? "rgba(220, 38, 38, 0.4)"
      : currentColor === "blue"
        ? "rgba(37, 99, 235, 0.4)"
        : currentColor === "yellow"
          ? "rgba(217, 119, 6, 0.4)"
          : "rgba(147, 51, 234, 0.4)"; // Default Purple

  const bgGradient = isMyTurn
    ? "from-[#021c0b] via-[#063316] to-black" // Deep green vibe
    : "from-[#090014] via-[#120022] to-black"; // Default dark vibe

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);
    let animationFrame;

    const animate = () => {
      position.current.x += (mouse.current.x - position.current.x) * 0.08;
      position.current.y += (mouse.current.y - position.current.y) * 0.08;
      if (orbRef.current) {
        orbRef.current.style.transform = `translate(${position.current.x - 150}px, ${position.current.y - 150}px)`;
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
    <div className="absolute inset-0 overflow-hidden transition-colors duration-700">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${bgGradient} transition-colors duration-1000`}
      />
      <div
        className="absolute inset-0 opacity-40 transition-colors duration-1000"
        style={{
          backgroundImage: `radial-gradient(${themeColor} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div
        ref={orbRef}
        className="absolute h-64 w-64 rounded-full blur-[80px] transition-colors duration-700"
        style={{ backgroundColor: themeColor.replace("0.4", "0.6") }}
      />
    </div>
  );
}

export default AnimatedBackground;
