function buildPublicState(gameState, forPlayerId = null) {
  if (!gameState) return null;
  return {
    ...gameState,
    players: gameState.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatarEmoji: p.avatarEmoji,
      cardCount: p.hand.length,
      hand: p.id === forPlayerId ? p.hand : undefined,
    })),
    deck: undefined,
  };
}

module.exports = { buildPublicState };
