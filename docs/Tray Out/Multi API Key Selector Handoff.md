# Multi API Key Selector Handoff

## Affected Files

GitHub paths for the co-programmer:

- `https://github.com/arabicroute/saas-proofreading/tree/main/src/components/tabs/ConfigTab.tsx`
- `https://github.com/arabicroute/saas-proofreading/tree/main/src/context/AppContext.tsx`
- `https://github.com/arabicroute/saas-proofreading/tree/main/src/components/shared/ConnectionPanel.tsx`
- `https://github.com/arabicroute/saas-proofreading/tree/main/src/components/tabs/InputTab.tsx`
- `https://github.com/arabicroute/saas-proofreading/tree/main/src/components/tabs/PlaygroundTab.tsx`
- `https://github.com/arabicroute/saas-proofreading/tree/main/src/lib/cohereClient.ts`
- `https://github.com/arabicroute/saas-proofreading/tree/main/src/lib/proofreadingSession.ts`
- `https://github.com/arabicroute/saas-proofreading/tree/main/docs/Tray%20Out/Multi%20API%20Key%20Selector%20Handoff.md`

## Objective

Replace the current free-text API key input in the Config tab with a dropdown that lists up to 10 labeled API keys. When the user selects one of the labels, the app should use the corresponding API key for:

- connection test
- proofreading session requests
- Playground single-chunk test requests

## Current State

Right now the app stores a single `apiKey` string in app state and the Config tab renders it as a text/password input.

Current flow:

- `ConfigTab` sets `state.apiKey`
- `ConnectionPanel` uses `state.apiKey` for the connection test
- `InputTab` passes `state.apiKey` into the proofreading session
- `PlaygroundTab` passes `state.apiKey` into the Playground request
- `cohereClient.ts` sends the selected client key to the local proxy as `apiKey`

The proxy already supports a client-supplied key in the request body, so this task should remain client-side only unless the co-programmer sees a strong reason otherwise.

## Required Change

Change the API Key card in `ConfigTab` from a free-text input to a dropdown showing label names for keys 1 through 10.

Expected behavior:

- The dropdown shows the configured labels
- Selecting a label updates the app’s active `apiKey`
- The selected key is the one used for all existing request paths
- If a key slot has no configured key value, it should not appear in the dropdown
- If no client keys are configured, the UI should degrade gracefully and keep the current “server-side key is fine” behavior

## Env Contract

The co-programmer does not have access to the local env file, so use this variable contract exactly.

For each slot `1..10`:

- key value: `VITE_COHERE_API_KEY_1` ... `VITE_COHERE_API_KEY_10`
- label value: `VITE_COHERE_API_KEY_LABEL_1` ... `VITE_COHERE_API_KEY_LABEL_10`

Local non-secret label values have been set as:

- `VITE_COHERE_API_KEY_LABEL_1=Key 1`
- `VITE_COHERE_API_KEY_LABEL_2=Key 2`
- `VITE_COHERE_API_KEY_LABEL_3=Key 3`
- `VITE_COHERE_API_KEY_LABEL_4=Key 4`
- `VITE_COHERE_API_KEY_LABEL_5=Key 5`
- `VITE_COHERE_API_KEY_LABEL_6=Key 6`
- `VITE_COHERE_API_KEY_LABEL_7=Key 7`
- `VITE_COHERE_API_KEY_LABEL_8=Key 8`
- `VITE_COHERE_API_KEY_LABEL_9=Key 9`
- `VITE_COHERE_API_KEY_LABEL_10=Key 10`

Important:

- Only labels were added in the local env file for this handoff
- Actual key values remain local/private and must not be committed
- The implementation should tolerate missing labels and missing key values

## Recommended Implementation

### 1. Build a client-side key options list

Create a small helper or constant that reads the 10 `import.meta.env` pairs and produces a filtered list like:

- `label`
- `value`
- `slot`

Recommended rules:

- include a slot only if the key value exists and is non-empty
- use the configured label if present
- otherwise fall back to `Key {n}`

This can live in:

- `ConfigTab.tsx`, if kept local and simple, or
- a small config/helper module if the co-programmer wants reuse

### 2. Keep `AppState.apiKey` as the active key string

To minimize churn, the simplest path is to keep `apiKey: string` in `AppState` and store the selected key’s actual value there.

That avoids changing downstream request code in:

- `ConnectionPanel`
- `InputTab`
- `PlaygroundTab`
- `proofreadingSession.ts`
- `cohereClient.ts`

Optional enhancement:

- store the selected slot id separately if the co-programmer wants the UI to remember which label was selected more explicitly

That is optional. The minimum viable change is keeping `apiKey` as the selected key string.

### 3. Replace the API Key input with a dropdown

In `ConfigTab.tsx`:

- replace the current password input in the API Key card
- render a `<select>` listing the available labeled keys
- on change, dispatch `SET_API_KEY` with the selected key’s value

Recommended UX:

- show a placeholder option like `Select API key`
- if no key options exist, render a disabled select or a small warning note
- keep the explanatory copy that server-side `COHERE_API_KEY` is preferred/allowed

### 4. Preserve existing connection behavior

No request-path rewrite should be necessary if `state.apiKey` continues to hold the selected key string.

The following should continue to work unchanged once `apiKey` is set from the dropdown:

- connection test
- proofreading runs
- Playground test run

## Suggested Acceptance Criteria

- Config tab shows a dropdown instead of a free-text API key field
- Dropdown displays the available label list for configured key slots
- Selecting a label updates the active API key in app state
- Connection test uses the selected key
- Proofreading requests use the selected key
- Playground test requests use the selected key
- Missing key slots are omitted from the dropdown
- Missing labels fall back to `Key {n}`
- If no client-side keys are configured, the UI does not crash
- `npm run build` passes

## Non-Goals

Do not add these unless truly necessary:

- server-side key rotation logic
- encrypted client-side storage of keys
- API key management UI beyond the dropdown
- changes to the existing proxy behavior
- persistence of the selected key unless explicitly needed

## Handoff Summary

Please implement a labeled multi-key selector in the Config tab using env pairs `VITE_COHERE_API_KEY_1..10` and `VITE_COHERE_API_KEY_LABEL_1..10`, with the selected option feeding the existing `apiKey` request path.
