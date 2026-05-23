import React from "react";
import { assetMap } from "../../../utils/assets";
import style from "./leftsection.module.css";

const LeftSection = () => {
  return (
    <div
      className="
      relative
      w-3/5 
      lg: w-1/2
      h-screen
      z-10
      flex
      items-center
      justify-center
      overflow-hidden
    "
    >
      <div className="relative flex items-center justify-center">
        {/* Glow */}
        <div
          className="absolute

    w-52 h-52
    sm:w-64 sm:h-64
    md:w-80 md:h-80
    lg:w-[28rem] lg:h-[28rem]
    xl:w-[34rem] xl:h-[34rem]

    rounded-full
    bg-purple-600

    [animation-duration:4s]
    blur-3xl
    opacity-30
    animate-pulse
    
          "
        />

        {/* Logo */}
        <img
          src={assetMap.Logo}
          alt="UNO Logo"
          className={`
            relative
            z-10
            w-[70%]
            max-w-[550px]
            min-w-[220px]
            object-contain

            drop-shadow-[0_0_40px_rgba(255,0,200,0.5)]

            ${style.float}
          `}
        />
      </div>
    </div>
  );
};

export default LeftSection;
