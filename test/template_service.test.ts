import assert from "node:assert/strict";
import test from "node:test";
import { moderateSmsAssets } from "../src/template_service.js";

test("holds a live event when one player asset is still in moderation", () => {
  const result = moderateSmsAssets({
    playerId: "player-17",
    eventId: "season-finale",
    assets: [
      { assetId: "guild-signature", kind: "signature", name: "Guild", text: "Guild Arena", status: "approved" },
      { assetId: "reward-template", kind: "template", name: "Reward", text: "{player} earned {reward}", status: "draft" }
    ]
  });
  assert.deepEqual(result, {
    playerId: "player-17",
    eventId: "season-finale",
    decision: "hold",
    approvedAssets: ["guild-signature"],
    queueReason: "asset-pending"
  });
});
