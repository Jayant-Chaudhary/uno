import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Rightsection = () => {
  const [clicked, setClicked] = useState("");
  const navigate = useNavigate();

  async function handleClick(mode) {
    await setClicked(mode);
    if (clicked == "offline") {
      await navigate("/roomCreator");
    }else if(clicked=="online"){
      await navigate("/joinRoom")
    }

    setTimeout(() => {
      setClicked("");
    }, 250);
  }

  return (
    <div
      className="
        compact-ui
        relative
        z-10
        w-[90dvw]
        min-h-[50dvh]
        lg:w-1/2
        lg:h-[80dvh]
        overflow-hidden
        flex
        flex-col
        justify-center
        px-3
        sm:px-5
        lg:px-14
      "
    >
      {/* Heading */}
      <h1
        className="
          font-game

          text-3xl
          sm:text-4xl
          md:text-5xl
          lg:text-7xl

          leading-none

          text-pink-300

          [-webkit-text-stroke:1px_#2a2a2a]

          [text-shadow:
            2px_2px_0px_#00d9ff,
            5px_5px_0px_#111]
        "
      >
        Ab ayegi 
        rishton me 
        darar!
      </h1>

      {/* Subtitle */}
      <p
        className="
          mt-3
          lg:mt-5

          text-xs
          sm:text-sm
          lg:text-lg

          text-white/75

          leading-relaxed

          max-w-md
        "
      >
        Challenge your friends in the ultimate UNO showdown.
      </p>

      {/* Cards Container */}
      <div
        className="
          mt-2
          lg:mt-8

          flex
          flex-row

          gap-3
          lg:gap-5

          w-full
        "
      >
        {/* Offline Card */}
        <div
          onClick={() => handleClick("offline")}
          className={`
            compact-card


            cursor-pointer

            rounded-2xl

            border border-white/10

            bg-white/10
            backdrop-blur-md

            p-3
            lg:p-6

            transition-all
            duration-300

            hover:scale-[1.02]
            hover:bg-pink-500/20

            active:scale-95

            ${clicked === "offline" ? "scale-95 bg-pink-500/30" : ""}
          `}
        >
          <h2
            className="
              text-lg
              sm:text-xl
              lg:text-3xl

              font-bold
              text-white
            "
          >
            Create Room
          </h2>

          <p
            className="
              mt-1
              lg:mt-3

              text-[10px]
              sm:text-xs
              lg:text-base

              text-white/70

              leading-relaxed
            "
          >
            Create Room, Share the Code  and let the fun begins
          </p>
        </div>

        {/* Online Card */}
        <div
          onClick={() => handleClick("online")}
          className={`
            compact-card

            cursor-pointer

            rounded-2xl

            border border-white/10

            bg-white/10
            backdrop-blur-md

            p-3
            lg:p-6

            transition-all
            duration-300

            hover:scale-[1.02]
            hover:bg-cyan-500/20

            active:scale-95

            ${clicked === "online" ? "scale-95 bg-cyan-500/30" : ""}
          `}
        >
          <h2
            className="
              text-lg
              sm:text-xl
              lg:text-3xl

              font-bold
              text-white
            "
          >
            Join ROOM
          </h2>

          <p
            className="
              mt-1
              lg:mt-3

              text-[10px]
              sm:text-xs
              lg:text-base

              text-white/70

              leading-relaxed
            "
          >
            Play with friends even miles apart.Just need an Code.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Rightsection;
