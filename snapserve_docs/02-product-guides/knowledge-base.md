<!-- Source: https://app.snapserve.ai/docs/knowledge-base -->

# Knowledge base

Upload documents so the agent can answer product/policy questions from your content during a call.

## In the dashboard

1. Open [Knowledge bases](https://app.snapserve.ai/app/knowledge-bases).
1. Create a source and upload files (or paste text).
1. Attach the source to one or more agents in the agent builder.
1. Test the agent — answers should cite your material when relevant.

## Tips

- Keep docs short and factual; prefer FAQs and SKUs over huge PDFs.
- Re-upload when policies change — stale docs confuse callers.
- Combine with a clear system prompt: when to search KB vs escalate.

## Via API

Use [Knowledge Base endpoints](/docs/api-reference/listKnowledgeSources) to list/create/upload sources and [attach](/docs/api-reference/attachKnowledgeSourceToAgent) them to agents.