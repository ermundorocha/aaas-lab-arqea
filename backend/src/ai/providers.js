/**
 * Contrato do Provider:
 * generateStructured({ system, prompt, schema }) -> objeto JSON validado
 */

export class AIProviderError extends Error {
  constructor(message, meta = {}) {
    super(message);
    this.name = "AIProviderError";
    this.meta = meta;
  }
}
