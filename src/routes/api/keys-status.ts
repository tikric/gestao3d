import { createFileRoute } from "@tanstack/react-router";
import { assertInternalCaller } from "./_auth";

export const Route = createFileRoute("/api/keys-status")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const blocked = assertInternalCaller(request);
        if (blocked) return blocked;
        return new Response(
          JSON.stringify({
            GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
            TAVILY_API_KEY: !!process.env.TAVILY_API_KEY,
            GROQ_API_KEY: !!process.env.GROQ_API_KEY,
            JINA_API_KEY: !!process.env.JINA_API_KEY,
            SERPAPI_KEY: !!process.env.SERPAPI_KEY,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
