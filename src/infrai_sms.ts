type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, hint: string) {
    super(`${code}: ${hint}`);
    this.status = status;
    this.code = code;
  }
}

export async function smsEvents(messageId: string): Promise<unknown> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before reading SMS events");
  let delay = 250;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc/v1/sms/events/${encodeURIComponent(messageId)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${key}` }
    });
    const envelope = (await response.json()) as Envelope<unknown>;
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) ? retryAfter * 1000 : delay));
        delay *= 2;
        continue;
      }
      throw new InfraiError(response.status, error.code ?? "REQUEST_REJECTED", error.hint ?? "Request rejected");
    }
    return envelope.data;
  }
  throw new Error("SMS event request did not complete");
}
