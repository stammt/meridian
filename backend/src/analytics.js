import { PostHog } from "posthog-node";

const posthog = new PostHog(process.env.POSTHOG_API_KEY || "disabled", {
  host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
  disabled: !process.env.POSTHOG_API_KEY,
});

process.on("SIGTERM", () => posthog.shutdown());
process.on("SIGINT", () => posthog.shutdown());

export async function trackAnthropicCall(anthropic, params, meta) {
  const start = Date.now();
  let response;
  try {
    response = await anthropic.messages.create(params);
  } catch (err) {
    posthog.capture({
      distinctId: meta.userId || "system",
      event: "claude_api_call",
      properties: {
        operation: meta.operation,
        model: params.model,
        max_tokens: params.max_tokens,
        success: false,
        error_message: err.message,
        error_type: err.constructor.name,
        latency_ms: Date.now() - start,
      },
    });
    throw err;
  }

  const usage = response.usage || {};
  posthog.capture({
    distinctId: meta.userId || "system",
    event: "claude_api_call",
    properties: {
      operation: meta.operation,
      model: params.model,
      max_tokens: params.max_tokens,
      success: true,
      latency_ms: Date.now() - start,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_creation_input_tokens: usage.cache_creation_input_tokens || 0,
      cache_read_input_tokens: usage.cache_read_input_tokens || 0,
      total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
      stop_reason: response.stop_reason,
    },
  });

  return response;
}
