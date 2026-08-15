<!-- Source: https://app.snapserve.ai/docs/variables -->

# Variables

Inject per-call data into the agent prompt so every conversation is personalized.

## Syntax

In the agent system prompt (or greeting), use double curly braces:

textCopy
```
`Hello {{customer_name}}, I'm calling about {{order_id}}.`
```

## In the dashboard

1. Open an agent → builder.
1. Add variables in the Variables section (name + optional default).
1. Reference them in the prompt as `{{name}}`.
1. Save / publish the agent.

Campaigns and lead CSVs can map columns onto the same variable names so each dial is unique without changing the agent.
## Via API

Manage the registry with [list / create / update / delete agent variables](/docs/api-reference/listAgentVariables).

bashCopy
```
`curl https://app.snapserve.ai/api/agents/36/variables \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY"`
```

When placing an outbound call, pass runtime values in the call metadata / lead payload your integration uses (campaign field mappings or your own pre-call setup). For custom apps, keep the mapping layer in your backend and use the SnapServe agent that already expects those names.

## Next

[Agents & builder](/docs/agents) · [Make a call](/docs/api-reference/initiateOutboundCall)