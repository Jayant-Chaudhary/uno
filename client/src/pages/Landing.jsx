import React from "react";
import { assetMap } from "../utils/assets";
import AnimatedGrid from "../components/AnimatorGrid";
import LeftSection from "../components/authPage/Leftsection/LeftSectionauth";
import Rightsection from "../components/LandingPage/RightSection/Rightsection";
const Landing = () => {
  return (
    <div className="absolute top-0 left-0 h-[100dvh] w-full overflow-hidden">
      <AnimatedGrid />
      <div className="relative h-full w-full flex flex-col lg:flex-row p-4 sm:p-8 items-center justify-center overflow-y-auto lg:overflow-hidden gap-8 lg:gap-0">
        <LeftSection />
        <Rightsection />
      </div>
    </div>
  );
};

export default Landing;
