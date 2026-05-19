const { createRoom, joinRoom } = require("./server/roomManger");
// const room = createRoom("09c4af9a-1341-4a26-a076-35da5b81ed53", {
//   maxPlayers: 6,
// });
// console.log(room.room_code); // e.g. "XK92PL"
// console.log(room.status); // "waiting"
// console.log(room.max_players); // 6

async function test() {
  try {
    const result = joinRoom(
      "LBS17A",
      "68861d57-5960-42af-8406-6d67586ecaf0",
      null,
    );
    console.log(result.players.length);
  } catch (err) {
    console.log("Error:", err.message);
  }
}

test();
