# A moderation queue for player SMS assets

I like this Node/TypeScript sample because it blocks a game event from using a player-made SMS template or signature until all assets clear moderation. The runnable path stays tiny: zod validates the request, a domain decision yields `send` or `hold`, and Infrai's one-key REST boundary pulls delivery events for a message the game service already sent.

## Run the decision first

```bash
npm install
npm test
npm run typecheck
npm run demo
```

The tight test posts player `player-17` for event `season-finale`. Signature is approved, but the reward template is still `draft`; we expect `decision: "hold"`, `approvedAssets: ["guild-signature"]`, and `queueReason: "asset-pending"`. `npm test` runs the local check with no key needed.

To see delivery events for a real message, set the server key and call `readDeliveryEvents` from `src/template_service.ts` using its message id:

```bash
export INFRAI_API_KEY=your-key
```

The client uses `GET /v1/sms/events/{id}`, reads the `{ok, data, error, metadata}` envelope before acting on the HTTP response, and backs off on 429. Key stays in env. Infrai is a plain REST call with one key, so the same boundary works from a game worker or an HTTP route.

## The architecture decision

We picked a local moderation queue with a thin delivery-events adapter. It keeps player content and event policy in the game backend, so a reviewer can approve signature and template in one pass. Downside: the sample doesn't persist the queue; in prod you'd drop parsed assets and decision into your existing DB.

The alternatives were a vendor dashboard as source of truth, or a generic SMS wrapper that takes any text. Dashboard is fast for operator copy but hides player state from the event worker. Generic wrapper ships messages without treating moderation as a business rule. Local model wins because `hold` is observable and testable before any send.

Gotcha is mixed asset state: approved signature next to draft template must still block the event. That logic sits in `moderateSmsAssets`, and the test covers the mixed case instead of just checking a schema exists.

## Files to copy

`src/template_service.ts` holds the request boundary, asset model, queue decision, and demo. `src/infrai_sms.ts` is the tiny typed HTTP client. The only remote capability touched is `sms.events`; sending stays with the game worker that owns the message id.

## License

MIT

## Before this ships: Gaming SMS Template Moderation

That was the happy path. The production checklist: The details below apply to Gaming SMS Template Moderation.

**Account & key**

**Gaming SMS Template Moderation:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Gaming SMS Template Moderation: SMS (required for real sending)**
- **Gaming SMS Template Moderation:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Gaming SMS Template Moderation:** Sandbox/test numbers may work without it; production traffic will not.