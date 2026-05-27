import React from "react";
import AnimatedBackground from "../components/AnimatorGrid";
import LeftSection from "../components/authPage/Leftsection/LeftSectionauth";
import RightSectionRoomCreator from "../components/RoomCreator/RightSectionRoomCreator";
const RoomCreator = () => {
  return (
    <div className="absolute top-0 left-0 h-[100dvh] w-full">
      <AnimatedBackground />
      <div className="relative h-full w-full flex flex-col lg:flex-row p-8 items-center justify-center">
        <LeftSection />
        <RightSectionRoomCreator />
      </div>
    </div>
  );
};

export default RoomCreator;
