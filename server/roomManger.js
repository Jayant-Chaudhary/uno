const db = require("./db");
const crypto = require("crypto");

//helpers
async function generateRoomCode() {
  const allowedchar = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let output = "";
  for (let i = 0; i < 6; i++) {
    let random = Math.floor(Math.random() * 36);
    output += allowedchar[random];
  }
  const existingRoom = await db.query(
    `
          SELECT room_id
          FROM rooms
          WHERE room_code = $1
            AND status != 'finished'
            AND expires_at > now()
        `,
    [output],
  );

  if (existingRoom.rows.length === 0) {
    console.log(output); //debugs
    return output;
  } else {
    return generateRoomCode();
  }
}

async function deleteRoom(roomId) {
  await db.query(
    `
      DELETE FROM rooms
      WHERE room_id = $1
    `,
    [roomId],
  );
}

async function findroom(roomcode) {
  const roomResult = await db.query(
    `
        SELECT *
        FROM rooms
        WHERE room_code = $1
      `,
    [roomcode],
  );

  if (roomResult.rows.length === 0) {
    throw new Error("Room not found");
  } else return roomResult;
}

//--creating room
async function createRoom(hostId, options = {}) {
  const maxPlayers = options.maxPlayers || 10;
  const roomCode = await generateRoomCode();
  const roomResult = await db.query(
    `
        INSERT INTO rooms (
          room_code,
          host_id,
          status,
          max_players,
          expires_at
        )

        VALUES (
          $1,
          $2,
          'waiting',
          $3,
          now() + interval '2 hours'
        )

        RETURNING *
      `,
    [roomCode, hostId, maxPlayers],
  );

  const room = roomResult.rows[0];
  await db.query(
    `
      INSERT INTO room_players (
        room_id,
        user_id,
        player_index,
        status
      )

      VALUES (
        $1,
        $2,
        0,
        'active'
      )
    `,
    [room.room_id, hostId],
  );
  console.log(room); //debugs
  return room;
}
// join room

async function joinRoom(roomCode, userId = null, guestName = null) {
  if (!userId && !guestName) {
    throw new Error("Guest name required");
  }
  if (userId && guestName) {
    throw new Error("login using one method");
  }

  const roomResult = await findroom(roomCode);

  if (roomResult.rows.length === 0) {
    throw new Error("Room not found");
  }

  const room = roomResult.rows[0];

  if (room.status !== "waiting") {
    throw new Error("Game already started");
  }

  const isExpired = new Date(room.expires_at) < new Date();

  if (isExpired) {
    throw new Error("Room expired");
  }
  const playerCountResult = await db.query(
    `
        SELECT COUNT(*)::INT AS count
        FROM room_players
        WHERE room_id = $1
          AND status = 'active'
      `,
    [room.room_id],
  );

  const currentPlayers = playerCountResult.rows[0].count;

  if (currentPlayers >= room.max_players) {
    throw new Error("Room is full");
  }
  if (userId) {
    const existingPlayer = await db.query(
      `
          SELECT id
          FROM room_players
          WHERE room_id = $1
            AND user_id = $2
        `,
      [room.room_id, userId],
    );

    if (existingPlayer.rows.length > 0) {
      throw new Error("User already in room");
    }
  }
  const reconnectToken = userId ? null : crypto.randomBytes(16).toString("hex");

  const playerIndex = currentPlayers;
  await db.query(
    `
      INSERT INTO room_players (
        room_id,
        user_id,
        guest_name,
        player_index,
        status,
        reconnect_token
      )

      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
    `,
    [room.room_id, userId, guestName, playerIndex, "active", reconnectToken],
  );
  await db.query(
    `
      UPDATE rooms
      SET last_activity = now()
      WHERE room_id = $1
    `,
    [room.room_id],
  );
  const playersResult = await db.query(
    `
        SELECT
          rp.id,
          rp.player_index,
          rp.status,
          rp.joined_at,

          rp.user_id,

          rp.guest_name,

          u.username,
          u.avatar_index

        FROM room_players rp

        LEFT JOIN users u
          ON rp.user_id = u.user_id

        WHERE rp.room_id = $1

        ORDER BY rp.player_index ASC
      `,
    [room.room_id],
  );
  return {
    room,
    players: playersResult.rows,
    reconnectToken,
  };
}
//game leaving
async function leaveRoom(roomCode, userId = null, socketId = null) {
  const roomResult = await findroom(roomCode);

  if (roomResult.rows.length === 0) {
    throw new Error("Room not found");
  }

  const room = roomResult.rows[0];

  let playerResult;

  if (userId) {
    playerResult = await db.query(
      `
          SELECT *
          FROM room_players
          WHERE room_id = $1
            AND user_id = $2
            AND status = 'active'
        `,
      [room.room_id, userId],
    );
  } else if (socketId) {
    playerResult = await db.query(
      `
          SELECT *
          FROM room_players
          WHERE room_id = $1
            AND socket_id = $2
            AND status = 'active'
        `,
      [room.room_id, socketId],
    );
  } else {
    throw new Error("userId or socketId required");
  }

  if (playerResult.rows.length === 0) {
    throw new Error("Player not found in room");
  }

  const player = playerResult.rows[0];

  await db.query(
    `
      UPDATE room_players
      SET status = 'left'
      WHERE id = $1
    `,
    [player.id],
  );

  const activePlayersResult = await db.query(
    `
        SELECT *
        FROM room_players
        WHERE room_id = $1
          AND status = 'active'
        ORDER BY player_index ASC
      `,
    [room.room_id],
  );

  const activePlayers = activePlayersResult.rows;

  if (room.host_id && player.user_id === room.host_id) {
    if (activePlayers.length > 0) {
      let index = 0;
      while (activePlayers[index].user_id == null) {
        index++;
      }
      const newHost = activePlayers[index];

      if (newHost.user_id) {
        await db.query(
          `
            UPDATE rooms
            SET host_id = $1
            WHERE room_id = $2
          `,
          [newHost.user_id, room.room_id],
        );
      }
    }
  }

  if (activePlayers.length === 0) {
    await db.query(
      `
        UPDATE rooms
        SET status = 'finished'
        WHERE room_id = $1
      `,
      [room.room_id],
    );
  }

  await db.query(
    `
      UPDATE rooms
      SET last_activity = now()
      WHERE room_id = $1
    `,
    [room.room_id],
  );

  return await getRoomState(roomCode);
}

async function getRoomState(roomCode) {
  const roomResult = await findroom(roomCode);
  if (roomResult.rows.length === 0) {
    throw new Error("Room not found");
  }

  const room = roomResult.rows[0];
  const playersResult = await db.query(
    `
        SELECT

          rp.id,
          rp.player_index,
          rp.status,
          rp.joined_at,
          rp.socket_id,

          rp.user_id,
          rp.guest_name,

          u.username,
          u.avatar_index

        FROM room_players rp

        LEFT JOIN users u
          ON rp.user_id = u.user_id

        WHERE rp.room_id = $1
          AND rp.status = 'active'

        ORDER BY rp.player_index ASC
      `,
    [room.room_id],
  );

  return {
    room,
    players: playersResult.rows,
  };
}

async function disconnectPlayer(roomCode, socketId) {
  const roomResult = await findroom(roomCode);
  if (roomResult.rows.length === 0) {
    throw Error("Room not found");
  }
  const room = roomResult.rows[0];
  const playerResult = await db.query(
    `
        SELECT *
        FROM room_players
        WHERE room_id = $1
          AND socket_id = $2
          AND status = 'active'
      `,
    [room.room_id, socketId],
  );

  if (playerResult.rows.length === 0) {
    return null;
  }

  const player = playerResult.rows[0];

  const updatedPlayerResult = await db.query(
    `
        UPDATE room_players

        SET
          status = 'disconnected',
          socket_id = NULL,
          disconnect_count =
            disconnect_count + 1

        WHERE id = $1

        RETURNING *
      `,
    [player.id],
  );

  const updatedPlayer = updatedPlayerResult.rows[0];

  const isHost = player.user_id && player.user_id === room.host_id;

  if (isHost && room.status === "waiting") {
    await deleteRoom(room.room_id);

    return updatedPlayer;
  }

  const activePlayersResult = await db.query(
    `
        SELECT COUNT(*)::INT AS count
        FROM room_players
        WHERE room_id = $1
          AND status = 'active'
      `,
    [room.room_id],
  );

  const activePlayers = activePlayersResult.rows[0].count;

  if (activePlayers === 0) {
    await db.query(
      `
        UPDATE rooms
        SET status = 'finished'
        WHERE room_id = $1
      `,
      [room.room_id],
    );
  }

  await db.query(
    `
      UPDATE rooms
      SET last_activity = now()
      WHERE room_id = $1
    `,
    [room.room_id],
  );

  return updatedPlayer;
}

async function reconnectPlayer(
  roomCode,
  userId = null,
  reconnectToken = null,
  newSocketId,
) {
  if (!userId && !reconnectToken) {
    throw new Error("userId or reconnectToken required");
  }
  if (userId && reconnectToken) {
    throw new Error("userId and reconnectToken both can't be there");
  }

  const roomResult = await db.query(
    `
        SELECT *
        FROM rooms
        WHERE room_code = $1
      `,
    [roomCode],
  );

  if (roomResult.rows.length === 0) {
    throw new Error("Room not found");
  }

  const room = roomResult.rows[0];
  let playerResult;
  if (userId) {
    playerResult = await db.query(
      `
          SELECT *
          FROM room_players
          WHERE room_id = $1
            AND user_id = $2
            AND status = 'disconnected'
        `,
      [room.room_id, userId],
    );
  } else {
    playerResult = await db.query(
      `
          SELECT *
          FROM room_players
          WHERE room_id = $1
            AND reconnect_token = $2
            AND status = 'disconnected'
        `,
      [room.room_id, reconnectToken],
    );
  }

  if (playerResult.rows.length === 0) {
    throw new Error("Player not found or not disconnected");
  }
  const player = playerResult.rows[0];
  const updatedPlayerResult = await db.query(
    `
        UPDATE room_players

        SET
          status = 'active',
          socket_id = $1

        WHERE id = $2

        RETURNING *
      `,
    [newSocketId, player.id],
  );

  const updatedPlayer = updatedPlayerResult.rows[0];

  await db.query(
    `
      UPDATE rooms
      SET last_activity = now()
      WHERE room_id = $1
    `,
    [room.room_id],
  );
  return {
    player: updatedPlayer,
    room,
    gameState: room.game_state,
  };
}

async function playAgain(roomCode, hostId) {
  const roomResult = await db.query(
    `
        SELECT *
        FROM rooms
        WHERE room_code = $1
      `,
    [roomCode],
  );

  if (roomResult.rows.length === 0) {
    throw new Error("Room not found");
  }
  const room = roomResult.rows[0];

  if (room.host_id !== hostId) {
    throw new Error("Only host can restart game");
  }

  if (room.status !== "finished") {
    throw new Error("Game is not finished");
  }

  await db.query(
    `
      DELETE FROM room_players
      WHERE room_id = $1
        AND status IN (
          'left',
          'disconnected'
        )
    `,
    [room.room_id],
  );

  await db.query(
    `
      UPDATE room_players

      SET
        status = 'active'
      WHERE room_id = $1
    `,
    [room.room_id],
  );

  await db.query(
    `
      UPDATE rooms

      SET
        status = 'waiting',

        game_state = NULL,

        rounds_played =
          rounds_played + 1,

        expires_at =
          now() + interval '2 hours',

        last_activity = now()

      WHERE room_id = $1
    `,
    [room.room_id],
  );
  return await getRoomState(roomCode);
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomState,
  disconnectPlayer,
  reconnectPlayer,
  playAgain,
};
