import React from "react";
import { assetMap } from "../utils/assets";
import AnimatedGrid from "../components/AnimatorGrid";
import LeftSection from "../components/LandingPage/Leftsection/LeftSection";
import Rightsection from "../components/LandingPage/RightSection/Rightsection";
const Landing = () => {
  return (
    <div className="absolute h-full w-full flex ">
      <AnimatedGrid />
      <LeftSection />
      <Rightsection />
    </div>
  );
};

export default Landing;
