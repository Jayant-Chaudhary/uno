
const deck = generateDeck();
console.log("=== generateDeck ===");
console.log("Total cards:", deck.length);                           // 108
console.log("Unique ids:", new Set(deck.map(c => c.id)).size);     // 108
console.log("Unique types:", [...new Set(deck.map(c => c.type))]); // 5 distinct types
console.log("Colors:", [...new Set(deck.map(c => c.color))]);      // red blue yellow green wild

const shuffled = shuffleDeck(deck);
console.log("\n=== shuffleDeck ===");
console.log("Total after shuffle:", shuffled.length);               // 108
console.log("Unique ids after shuffle:", new Set(shuffled.map(c => c.id)).size); // 108
console.log("First card same as before?", shuffled[0].id === deck[0].id); // likely false

const state = {
  deck: shuffled,
  players: [
    { id: "p1", name: "Jayant", hand: [] },
    { id: "p2", name: "Alex",   hand: [] },
    { id: "p3", name: "Sam",    hand: [] },
  ],
  discardPile: [],
  currentColor: null,
  currentValue: null,
  direction: 1,
  currentPlayerIndex: 0,
  pendingUno: null,
};

const dealt = dealCard(state);
console.log("\n=== dealCard ===");
console.log("P1 hand size:", dealt.players[0].hand.length);         // 7
console.log("P2 hand size:", dealt.players[1].hand.length);         // 7
console.log("P3 hand size:", dealt.players[2].hand.length);         // 7
console.log("Deck remaining:", dealt.deck.length);                  // 108 - 21 - 1 = 86
console.log("Discard pile:", dealt.discardPile);                    // 1 card, non-wild
console.log("Current color:", dealt.currentColor);                  // red/blue/green/yellow
console.log("Current value:", dealt.currentValue);                  // number or null
console.log("First card is wild?", dealt.discardPile[0].type === "wild" || dealt.discardPile[0].type === "wild_draw4"); // false