# My-Project AI Provider Router

The AI Provider Router is the central AI gateway for generation and embeddings.

- knowledge: ingestion, semantic search and memory embeddings
- agent: agent and chain generation
- production: user-facing chat and production generation

`AI_PROVIDER_ORDER` defines failover priority. Providers without configured credentials are skipped. Built-in providers are OpenAI, Google Gemini, Groq and Mistral; additional OpenAI-compatible providers can be registered through `AI_PROVIDER_REGISTRY_JSON` without changing application business logic.

Transient failures such as 429, 5xx, timeouts and network failures place a provider into a short cooldown. The router then tries the next compatible provider. Every attempt is recorded in `AIProviderEvent` with provider, purpose, operation, status, latency and fallback information. Secrets are never returned to the frontend.

Embeddings are stored with `embeddingProvider`, and retrieval only compares vectors from the same provider. Reindexing is available from the Provider Router UI after changing the preferred embedding provider.

Free-tier status is treated as configuration metadata, not a permanent guarantee. Provider terms, limits and model availability must be rechecked periodically.