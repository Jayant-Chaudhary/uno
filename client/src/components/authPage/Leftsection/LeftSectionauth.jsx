import React from "react";
import { assetMap } from "../../../utils/assets";
import style from "./leftsectionauth.module.css";

const LeftSection = () => {
  return (
    <div
      className="
        relative z-10 flex items-center justify-center
        w-full h-[40vh]          /* portrait: full width, 30% height */
        lg:w-1/2 lg:h-full       /* landscape: half width, full height */
      "
    >
      <div className="relative flex items-center justify-center">
        {/* Glow */}
        <div
          className="
            absolute rounded-full bg-purple-600 blur-3xl opacity-30 animate-pulse
            [animation-duration:4s]
            w-36 h-36
            sm:w-52 sm:h-52
            lg:w-[28rem] lg:h-[28rem]
            xl:w-[34rem] xl:h-[34rem]
          "
        />
        {/* Logo */}
        <img
          src={assetMap.Logo}
          alt="Logo"
          className={`
            relative z-10 object-contain
            drop-shadow-[0_0_40px_rgba(255,0,200,0.5)]
            w-[60%] max-w-[400px]     /* portrait: compact */
            lg:w-[70%] lg:max-w-[550px] lg:min-w-[220px] /* landscape: full */
            ${style.float}
          `}
        />
      </div>
    </div>
  );
};

export default LeftSection;