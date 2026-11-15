import { z } from "zod";
import { smsEvents } from "./infrai_sms.js";

const assetSchema = z.object({
  assetId: z.string().min(1),
  kind: z.enum(["template", "signature"]),
  name: z.string().min(1),
  text: z.string().min(1).max(500),
  status: z.enum(["draft", "approved", "rejected"])
});

export const moderationRequestSchema = z.object({
  playerId: z.string().min(1),
  eventId: z.string().min(1),
  assets: z.array(assetSchema).min(1).max(20)
}).strict();

export type ModerationRequest = z.infer<typeof moderationRequestSchema>;
export type ModerationResult = {
  playerId: string;
  eventId: string;
  decision: "send" | "hold";
  approvedAssets: string[];
  queueReason?: "asset-pending" | "asset-rejected";
};

export function moderateSmsAssets(input: unknown): ModerationResult {
  const request = moderationRequestSchema.parse(input);
  const rejected = request.assets.some((asset) => asset.status === "rejected");
  const pending = request.assets.some((asset) => asset.status === "draft");
  const decision = rejected || pending ? "hold" : "send";
  return {
    playerId: request.playerId,
    eventId: request.eventId,
    decision,
    approvedAssets: request.assets.filter((asset) => asset.status === "approved").map((asset) => asset.assetId),
    ...(rejected ? { queueReason: "asset-rejected" as const } : pending ? { queueReason: "asset-pending" as const } : {})
  };
}

export async function readDeliveryEvents(messageId: string) {
  return smsEvents(messageId);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = moderateSmsAssets({
    playerId: "player-17",
    eventId: "season-finale",
    assets: [
      { assetId: "guild-signature", kind: "signature", name: "Guild", text: "Guild Arena", status: "approved" },
      { assetId: "reward-template", kind: "template", name: "Reward", text: "{player} earned {reward}", status: "draft" }
    ]
  });
  console.log(JSON.stringify(result, null, 2));
}
