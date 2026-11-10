# Current screen storyboard

Updated 10 November 2026 at the user's request in the existing **TTX Platform - Screen Storyboard** file.

- [Current figure](https://www.figma.com/design/4oCPzxBPHnEpsp4qRz2YV3?node-id=13-3): page `13:2`, **10 November 2026 - Implemented workflow**, root frame `13:3`.
- [September archive](https://www.figma.com/design/4oCPzxBPHnEpsp4qRz2YV3?node-id=1-2): page `0:1`, **Archive - September 2026 concepts**. Original imported frame `1:2` is preserved.
- File key: `4oCPzxBPHnEpsp4qRz2YV3`.

## Meaning and limits

These are simplified editable UI states derived from the current implementation, not screenshots, observed exercise records, a runnable prototype or a new requirements baseline. All example content is synthetic. Separate facilitator and participant sign-ins are assumed. Read left to right within each row.

| Panel | Implemented workflow represented                                             | Panel / screen frame |
| ----- | ---------------------------------------------------------------------------- | -------------------- |
| 01    | Source intake, Document type, native import and optional extraction          | `13:9` / `13:11`     |
| 02    | Knowledge status, review decision, rationale and immutable confirmation      | `13:77` / `13:79`    |
| 03    | Operator-bound confirmed profile, applicability and package generation       | `13:135` / `13:137`  |
| 04    | Five review steps, role preview, inject acceptance and package freeze        | `13:190` / `13:192`  |
| 05    | Recorded Step 0 Ready decision, briefing and explicit start                  | `13:268` / `13:270`  |
| 06    | Released-inject tabs, literal story body, separate image and shared response | `13:311` / `13:313`  |
| 07    | Interpretation review, separate disposition and closure                      | `13:358` / `13:360`  |
| 08    | Completed-run debrief, immutable snapshot and compact cited records          | `13:410` / `13:412`  |
| 09    | Snapshot-bound AAR draft, proposed actions and explicit review               | `13:468` / `13:470`  |

The figure explicitly retains the operator profile-binding step and worker-management limitation. It does not depict a coaching retry, automatic release, response-dependent branch engine, generated ten-position workflow, completed operational exercise, real incident execution or measured workload savings. Five positions remain an intermediate Form B checkpoint; independent human evaluation and final acceptance remain open. [PROJECT](../PROJECT.md), [architecture](../architecture.md#current-screen-storyboard---10-november-2026) and [WORK](../WORK.md) retain their separate authority.

## Maintenance and verification

[Build source](build-current-storyboard.js) is JavaScript for the Figma `use_figma` Plugin API, not a Node command or application dependency. It uses native auto-layout frames and editable Inter text, with colours from the application. The existing file had no reusable components, variables or styles, and design-system discovery found no matching library; no unrelated community kit was introduced. The script stops if the named current page already exists. Inspect and update that page rather than blindly rerunning or deleting it; the recorded IDs above belong to this published instance, not a later rebuild.

The current frame contains **270 editable text nodes and 249 descendant frames**, with zero image fills; it is not a screenshot embedded in Figma. Final size is **3344 x 3457**. A first render exposed text-height overlap caused by setting auto-resize before fixed width. The helper and existing nodes were corrected; the final screenshot was visually inspected, and structural checks found no direct-sibling overlap, out-of-parent bounds or invalid text dimensions/auto-resize state. This verifies the figure's layout, not runtime behaviour. The application separately passes the checks recorded in WORK.

The September `ttx-screen-concepts.svg`, `.png`, `.excalidraw` and generator remain historical. They do not automatically synchronise with this current Figma page; links in README and architecture now point to the current figure and identify that distinction. Future changes should update the current page, this build source, relevant screen captions and these maintenance notes together.
