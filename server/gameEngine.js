function generateDeck() {
  let deck = [];
  let color = ["red", "blue", "yellow", "green"];
  color.forEach((element) => {
    for (let j = 0; j < 2; j++) {
      const identity = j === 0 ? "a" : "b";
      for (let i = 0; i < 10; i++) {
        if (i <= 8) {
          let cardNum = i + 1;
          let obj = {
            id: `${element}_${identity}_${cardNum}`,
            color: `${element}`,
            type: "number",
            value: cardNum,
          };
          deck.push(obj);
        } else {
          deck.push({
            id: `${element}_${identity}_rev`,
            color: `${element}`,
            type: "reverse",
            value: null,
          });
          deck.push({
            id: `${element}_${identity}_skip`,
            color: `${element}`,
            type: "skip",
            value: null,
          });
          deck.push({
            id: `${element}_${identity}_draw2`,
            color: `${element}`,
            type: "draw2",
            value: null,
          });
        }
      }
    }
    deck.push({
      id: `${element}_0`,
      color: `${element}`,
      type: "number",
      value: 0,
    });
  });
  for (let k = 0; k < 4; k++) {
    let wildCardNum = k + 1;
    deck.push({
      id: `wild_${wildCardNum}`,
      color: `wild`,
      type: "wild",
      value: null,
    });
    deck.push({
      id: `wild_draw4_${wildCardNum}`,
      color: `wild`,
      type: "wild_draw4",
      value: null,
    });
  }
  console.log(`[DECK] Generated a full new UNO deck of ${deck.length} cards.`);
  if (deck.length !== 108) {
    throw new Error("Deck generation failed");
  }
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const random = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[random]] = [deck[random], deck[i]];
  }
  return deck;
}

function getStartingHandSize(playerCount) {
  if (playerCount >= 2 && playerCount <= 4) {
    return 7;
  }
  if (playerCount >= 5 && playerCount <= 8) {
    return 6;
  }
  if (playerCount >= 9 && playerCount <= 15) {
    return 5;
  }
  if (playerCount >= 16 && playerCount <= 20) {
    return 4;
  }
  return null;
}

function dealCard(state) {
  const { deck, players, discardPile } = state;
  const handSize = getStartingHandSize(players.length);
  if (handSize == null) {
    throw new Error("invalid handsize check the number of players");
  }
  const cardNeeded = handSize * players.length + 1;
  if (deck.length < cardNeeded) {
    throw new Error("invalid card needed ");
  }

  // for distributing card one by one
  for (let round = 0; round < handSize; round++) {
    players.forEach((player) => {
      const card = deck.shift();
      if (!card) {
        throw new Error("Deck ran out");
      }
      if (card) {
        player.hand.push(card);
      }
    });
  }
  let firstCard = deck.shift();
  while (firstCard.type == "wild" || firstCard.type == "wild_draw4") {
    deck.push(firstCard);
    firstCard = deck.shift();
  }

  discardPile.push(firstCard);

  state.currentColor = firstCard.color;
  state.currentValue = firstCard.value;

  state.deck = deck;
  state.players = players;
  state.discardPile = discardPile;
  state.currentType = firstCard.type;
  state.skip = false;

  return state;
}

//checking what are the valid moves
function isValidPlay(card, state) {
  //wild card check
  if (card.type === "wild" || card.type === "wild_draw4") {
    return true;
  }
  //color check
  if (card.color === state.currentColor) {
    return true;
  }
  //number check
  if (card.type === "number" && card.value === state.currentValue) {
    return true;
  }
  // action cards
  if (card.type !== "number" && card.type === state.currentType) {
    return true;
  }

  return false;
}

function playCard(state, playerId, cardId, chosenColor) {
  const validPlayer = state.players.find((player) => player.id === playerId);
  if (!validPlayer) {
    throw new Error("Player not found");
  }
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.id !== playerId) {
    throw new Error("Not your turn");
  }

  const validCard = validPlayer.hand.find((card) => card.id === cardId);
  if (!validCard) {
    throw new Error("Card not found");
  }
  if (!isValidPlay(validCard, state)) {
    throw new Error("invalid move");
  }
  const validColors = ["red", "blue", "green", "yellow"];

  if (
    (validCard.type === "wild" || validCard.type === "wild_draw4") &&
    !validColors.includes(chosenColor)
  ) {
    throw new Error("Invalid chosen color");
  }

  const indexOfCard = validPlayer.hand.findIndex((card) => card.id === cardId);

  const removedCard = validPlayer.hand.splice(indexOfCard, 1)[0];

  state.discardPile.push(removedCard);

  if (validCard.type === "wild" || validCard.type === "wild_draw4") {
    state.currentColor = chosenColor;
    state.currentType = validCard.type;
    state.currentValue = validCard.value;
  } else {
    state.currentType = validCard.type;
    state.currentColor = validCard.color;
    state.currentValue = validCard.value;
  }

  applySpecialCard(state, validCard, chosenColor);

  checkUno(state, playerId);

  if (checkWinner(state, playerId)) {
    console.log(`[GAME_OVER] Player ${validPlayer.name} has won the match.`);
    state.gameOver = true;
    state.winner = playerId;
    return state;
  }

  nextTurn(state);

  return state;
}

function nextTurn(state) {
  const playercount = state.players.length;
  let nextindex =
    (state.currentPlayerIndex + state.direction + playercount) % playercount;
  if (state.skip) {
    nextindex = (nextindex + state.direction + playercount) % playercount;
    state.skip = false;
  }

  // Skip disconnected players if there are more than 2 players in the game
  if (playercount > 2) {
    let loops = 0;
    while (state.players[nextindex].socketId === null && loops < playercount) {
      nextindex = (nextindex + state.direction + playercount) % playercount;
      loops++;
    }
  }

  state.currentPlayerIndex = nextindex;
  return state;
}

function applySpecialCard(state, card, chosenColor) {
  switch (card.type) {
    case "skip": {
      state.skip = true;
      break;
    }
    case "reverse": {
      state.direction *= -1;
      if (state.players.length === 2) state.skip = true;
      break;
    }
    case "draw2": {
      state.skip = true;

      const playercount = state.players.length;

      let nextindex =
        (state.currentPlayerIndex + state.direction + playercount) %
        playercount;

      drawCards(state, state.players[nextindex], 2);

      break;
    }
    case "wild": {
      state.currentColor = chosenColor;
      break;
    }
    case "wild_draw4": {
      state.currentColor = chosenColor;

      state.skip = true;

      const playercount = state.players.length;

      let nextindex =
        (state.currentPlayerIndex + state.direction + playercount) %
        playercount;

      drawCards(state, state.players[nextindex], 4);

      break;
    }
    case "number":
      break;
  }
  return state;
}

function checkWinner(state, playerId) {
  const validPlayer = state.players.find((player) => player.id === playerId);
  if (!validPlayer) {
    throw new Error("Player not found");
  }
  if (validPlayer.hand.length == 0) {
    return true;
  } else {
    return false;
  }
}

function checkUno(state, playerId) {
  const validPlayer = state.players.find((player) => player.id === playerId);
  if (!validPlayer) {
    throw new Error("Player not found");
  }
  if (validPlayer.hand.length == 1) {
    state.pendingUno = {
      playerId: playerId,
      timestamp: Date.now(),
    };
  } else if (state.pendingUno && state.pendingUno.playerId === playerId) {
    state.pendingUno = null;
  }
}

function reshuffleDeck(state) {
  if (state.deck.length > 0) {
    return state;
  }
  if (state.discardPile.length <= 1) {
    throw new Error("Not enough cards to reshuffle");
  }

  const topCard = state.discardPile.at(-1);

  const reshuffleCards = state.discardPile.slice(0, -1);
  state.deck = shuffleDeck(reshuffleCards);

  state.discardPile = [topCard];

  return state;
}

function drawCards(state, player, amount) {
  for (let i = 0; i < amount; i++) {
    if (state.deck.length === 0) {
      reshuffleDeck(state);
    }

    const card = state.deck.shift();

    if (!card) {
      throw new Error("Deck ran out");
    }

    player.hand.push(card);
  }
}
function callOut(state, callerId, targetId) {
  const caller = state.players.find((player) => player.id === callerId);

  if (!caller) {
    throw new Error("Caller not found");
  }

  const target = state.players.find((player) => player.id === targetId);

  if (!target) {
    throw new Error("Target player not found");
  }

  // cannot call out yourself
  if (callerId === targetId) {
    throw new Error("Cannot call out yourself");
  }

  // no pending uno exists
  if (!state.pendingUno) {
    drawCards(state, caller, 2);

    return state;
  }

  if (state.pendingUno.playerId === targetId) {
    const timePassed = Date.now() - state.pendingUno.timestamp;

    if (timePassed < 25000) {
      drawCards(state, target, 2);
    } else {
      drawCards(state, caller, 2);
    }

    state.pendingUno = null;

    return state;
  }
  drawCards(state, caller, 2);

  return state;
}

module.exports = {
  generateDeck,
  shuffleDeck,
  dealCard,
  playCard,
  drawCards,
  callOut,
  isValidPlay,
  nextTurn,
};
