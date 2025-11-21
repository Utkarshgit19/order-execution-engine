// src/services/routing.js

function chooseBestRoute({ raydiumOut, meteoraOut }) {
  if (raydiumOut >= meteoraOut) {
    return {
      dex: "raydium",
      expectedOut: raydiumOut,
    };
  }

  return {
    dex: "meteora",
    expectedOut: meteoraOut,
  };
}

module.exports = {
  chooseBestRoute,
};
