import bgimg from "../assets/landingpage/bgindex.jpeg";
import logo from "../assets/landingpage/Logo.svg";

//  SOUND MAP
// export const soundMap = {
//   play: playSound,
//   draw: drawSound,
//   uno: unoSound,
//   win: winSound,
// };

export const assetMap = {
  //bg images
  Bgimg: bgimg,
  Logo: logo,
};
// all assets

export const allImages = Object.values(assetMap);

//export const allSounds = Object.values(soundMap);

// IMAGE PRELOADER

export function preloadImages(images) {
  return Promise.all(
    images.map((src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();

        img.src = src;

        img.onload = () => resolve(src);

        img.onerror = () => reject(src);
      });
    }),
  );
}

//  SOUND PRELOADER

// export function preloadSounds(sounds) {
//   return Promise.all(
//     sounds.map((src) => {
//       return new Promise((resolve) => {
//         const audio = new Audio();

//         audio.src = src;

//         audio.oncanplaythrough = () => resolve(src);

//         audio.onerror = () => resolve(src);
//       });
//     }),
//   );
// }

// LOAD EVERYTHING

export async function preloadAssets() {
  await Promise.all([preloadImages(allImages)]);
}
