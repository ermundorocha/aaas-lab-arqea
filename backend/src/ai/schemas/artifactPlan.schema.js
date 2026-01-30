export const ArtifactPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "artifacts"],
  properties: {
    title: { type: "string", minLength: 3 },
    summary: { type: "string", minLength: 10 },
    artifacts: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "contentType", "content"],
        properties: {
          path: { type: "string", minLength: 3 },
          contentType: { type: "string", enum: ["text/markdown", "application/json", "application/xml"] },
          content: { type: "string", minLength: 1 }
        }
      }
    }
  }
};