import React from "react";
import AnimatedBackground from "../components/AnimatorGrid";
import LeftSection from "../components/authPage/Leftsection/LeftSectionauth";
import RighsectionJoinRoom from "../components/JoinRoom/RighsectionJoinRoom";

const JoinRoom = () => {
  return (
    <div className="absoulte top-0 left-0 h-[100dvh] w-full">
      <AnimatedBackground />
      <div className="relative h-full w-full flex flex-col lg:flex-row p-8 items-center justify-center">
        <LeftSection />
        <RighsectionJoinRoom />
      </div>
    </div>
  );
};

export default JoinRoom;
