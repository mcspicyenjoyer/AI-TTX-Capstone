# TTX Platform: SME Walkthrough

**For first-time facilitators and participants. Checked against the current five-inject technical workflow on 6 November 2026.**

A tabletop exercise is a guided discussion about an incident. Your team receives updates, considers the available information and records what it would do, why, and what it still needs to know. You do not need to solve the whole incident immediately. Recording an uncertainty or deciding to wait for evidence can be a valid response.

This guide takes you from preparation to the after-action review. It explains what to click, what to check and when another person needs to help. The [short demo route](evaluation/full-demo-rehearsal-2026-11-05.md#suggested-demo-route) is for presenting prepared examples, not learning the whole workflow.

## Before You Begin

**This version is an operator-supported prototype, not a self-service service for real company incidents.** Use only the approved fictional/example organisation data. Do not upload your company's actual network diagrams, confidential plans, personal data or credentials. Agree the discussion-only boundary once at the briefing: no real calls, payments, notifications or system changes.

The implemented exercise has five sequential injects and three participant roles. It supports suspected ransomware/file-unavailability scenarios, not an unrestricted industry or incident-template catalogue. The separate operational workstream is not yet a playable exercise. Exercise completion is not proof of recovery capability or Cyber Trust certification.

### Who Does What?

| Person           | Responsibility                                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Operator**     | Starts the application and AI workers, supplies access codes, configures the confirmed organisation used for generation, and backs up saved data. This is a technical setup role, not another participant account. |
| **Facilitator**  | Reviews the organisation and scenario, controls what is released, leads discussion, records decisions and reviews the final findings. This person uses the `facilitator` account.                                  |
| **Participants** | Represent the assigned functions, read their own information, discuss options and agree the team's response. The prepared example uses business leadership, engineering operations and internal IT.                |

For preparation, involve someone who understands the example's systems and someone who understands its business priorities. A facilitator should not guess technical relationships merely to finish the forms.

### Choose Your Route

| What you want to do                                               | Start here                                                                                                                                                                          |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Understand the prepared demonstration without changing it         | Sign in, inspect the confirmed intake, then inspect the completed exercise and its report. Use the [demo route](evaluation/full-demo-rehearsal-2026-11-05.md#suggested-demo-route). |
| Edit an existing draft, try images and prepare a new play-through | [Step 4](#step-4-generate-or-select-a-package), selecting an unfrozen **Review** draft rather than the completed reference package.                                                 |
| Prepare a different example organisation from documents           | [Step 1](#step-1-open-the-platform-and-sign-in), then follow every step, including the operator handoff in Step 3.                                                                  |
| Join as a participant                                             | Read [Participant Instructions](#participant-instructions). You do not need the preparation screens.                                                                                |

For the currently prepared demonstration, the address is [http://127.0.0.1:3031/](http://127.0.0.1:3031/). Merging code into `main` does not change this address. On a different installation, use the address supplied by its operator. A `127.0.0.1` address works only on the computer running the service; it is not a link colleagues can use from their own laptops.

### A Few Terms You Will See

| Term                         | Meaning                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Profile**                  | The reviewed account of the organisation: its systems, services, people, suppliers and known gaps.                                               |
| **Inject**                   | One update in the incident, such as a report that files cannot be opened. The current exercise has five.                                         |
| **Artefact / story message** | A piece of information within an inject, such as an email, ransom note or PowerShell transcript. An optional image can represent its saved text. |
| **Package**                  | The scenario, roles, briefing, five injects and facilitator material prepared before play.                                                       |
| **Freeze**                   | Approve the reviewed package as a read-only version and create its exercise run. It does not start play or send an inject.                       |
| **Snapshot**                 | A fixed copy of the completed exercise record used as the source for a report.                                                                   |
| **AAR**                      | After-action review: findings and proposed improvements based on that snapshot.                                                                  |

**The overall sequence:** review organisation -> configure generation -> review package -> freeze -> Step 0 and briefing -> release and discuss five injects -> complete -> debrief -> snapshot -> reviewed AAR.

### Jump to a Step

1. [Sign in](#step-1-open-the-platform-and-sign-in)
2. [Prepare and review the organisation](#step-2-prepare-and-review-the-organisation)
3. [Operator handoff for a new profile](#step-3-ask-the-operator-to-select-the-confirmed-profile)
4. [Generate or select a package](#step-4-generate-or-select-a-package)
5. [Review preparation and injects](#step-5-review-preparation-and-all-five-injects)
6. [Add optional images](#step-6-add-an-image-if-it-helps-the-discussion)
7. [Accept and freeze](#step-7-accept-and-freeze-the-package)
8. [Prepare people and start](#step-8-prepare-the-people-and-start)
9. [Release, discuss and close](#step-9-release-discuss-and-close-each-inject)
10. [Debrief and AAR](#step-10-debrief-capture-the-record-and-review-the-aar)

For role-only instructions, see [Participants](#participant-instructions). For blocked controls, see [Help](#when-something-does-not-work).

## Step 1: Open the Platform and Sign In

**Who:** facilitator; participants sign in separately when invited.

1. Ask the operator for the correct address, username and access code. There is no public registration process in this version.
2. Open the address and sign in. Do not share a facilitator code with participants.
3. For a one-computer demonstration, use genuinely separate browser profiles or different browsers for the different accounts. Additional tabs or incognito windows can share a login.
4. As facilitator, find **Source intake**, **Package generation** and **Exercises** in the navigation.

**Check before continuing:** you are signed in as the intended person, on the intended instance. Codes and records from port 3030 are not interchangeable with those on port 3031.

The **Organisation profile** landing page currently opens the first authorised fixture. It is not a selector for every uploaded organisation. To inspect your prepared organisation, use **Source intake > Preparation draft > Review** instead.

## Step 2: Prepare and Review the Organisation

**Who:** facilitator, supported by the people who understand the example organisation. Do this before the participant session, not while everyone is waiting for the first inject.

If the intended preparation already says **Confirmed snapshot**, inspect its sources and outstanding context, then go to Step 3. Otherwise:

### Import the Sources

1. Open **Source intake**, expand **New preparation**, enter **Organisation name**, read and tick the data-requirements acknowledgement, then select **Create draft**.
2. In **Sources**, choose **Document**. Enter **Source title**, **Version** and **Source type**, select the **Source file**, acknowledge its data requirements and select **Import source**.
3. Repeat for the supporting documents. Select the appropriate source type: **Network diagram**, **BCP**, **BIA**, **DRP** or **Guided context**.
4. For an explicitly supplied statement rather than a file, choose **Guided evidence**. Complete **Source title**, **Version**, **Source type** and **Attributed source statement**, identifying where the statement came from. Tick the acknowledgement and select **Import source**. Do not present an assumption as independently verified evidence.

| Input                                                                                  | What works in this version                                                                                                                        |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Network diagram, required for confirmation                                             | Uncompressed editable draw.io XML, or an editable SVG retaining its draw.io XML. A screenshot, ordinary SVG or scanned diagram is not equivalent. |
| Business continuity plan (BCP), impact analysis (BIA), or disaster recovery plan (DRP) | Text-bearing DOCX/PDF, or UTF-8 `.md`/`.txt`. Scanned PDFs and image-only files are not supported.                                                |
| Additional context                                                                     | An attributed guided statement about the example organisation.                                                                                    |

Each file must be no larger than 4 MiB. Keep the original files available for comparison: the platform keeps extracted passages and source references, not a downloadable archive of the original uploads. Continuity files are optional at intake, but package preparation needs a suitable BCP/DRP-classified source for **Plan being exercised**; ask the operator if that reference is missing.

**Expected result:** the source appears in the list, with passages available in **Source evidence**. Importing a document is not the same as understanding or approving all its contents.

### Extract Candidates, Then Review Them

If AI is available, select **Extract candidates**, read the subscription-use confirmation and proceed only when the selected sources are appropriate to send. This action sends all imported sources in that draft for extraction. Wait for the result before editing; changes can invalidate an in-progress request. AI extraction is optional: you can review and add candidates manually.

Work through **Entities** first, then **Claims**:

| Screen              | What to check                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entities**        | An entity is a named thing, such as a file server, business service, person or supplier. Check its name, **Kind** and **Decision**. Reject duplicate items and decorative diagram shapes rather than treating them as real systems. |
| **Claims**          | A claim says something about an entity or connects it to another. Check **Subject**, **Property**, **Related entity** or **Value**, **Knowledge status**, **Explanation** and **Decision** against its source.                      |
| **Source evidence** | Choose **Evidence source** and **Passage** to read the supporting text. The evidence icon opens the relevant source. For manual additions, select support before **Add entity**, or use **Add selected evidence** on a claim.       |

There are two different decisions here:

| Field                                                                            | Meaning                                                                                                    |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Decision: Pending / Accepted / Rejected**                                      | Whether you have reviewed the candidate and want to keep it in the profile.                                |
| **Knowledge status: Sourced claim / Proposal / Assumption / Unknown / Conflict** | What kind of information you are keeping, and how certain it is. Accepting it does not change this status. |

For example, a plan might propose restoring a service within four hours. You can accept that statement with **Knowledge status: Proposal**, **Property: RTO hours** and **Value: 4**. That records a target, not proof that the team can restore the service in four hours. RTO is the target recovery time; RPO is the target amount of data loss measured in time.

To add a missing claim manually, ensure its entity exists, select **Add claim**, expand the new item and complete its fields. Select the supporting source passage and use **Add selected evidence**. Check its explanation, knowledge status and review decision before saving; a source passage must actually support what you are recording.

Enter a clear **Review rationale**, such as "Compared the diagram and continuity plan; rejected duplicate icons and retained recovery times as proposals", then select **Save review**. Save regularly, and finish one review before navigating away.

### Confirm the Profile

1. Open **Review** and read **Outstanding context**. Resolve contradictions or explicitly retain a supported unknown/conflict; do not invent answers to make a warning disappear.
2. Decide every candidate: no entity or claim may remain **Pending**. Confirmation also needs a supported network diagram, accepted entities and claims, and valid evidence/relationships.
3. Save any remaining edits. Tick **I reviewed the source evidence, proposals, assumptions and remaining gaps.**
4. Select **Confirm profile snapshot**.

**Expected result:** **Confirmed snapshot** appears, with **Export confirmed profile** available. The export is structured JSON, not a presentation or PDF report. The confirmed preparation is read-only; changed input requires a new preparation draft.

## Step 3: Ask the Operator to Select the Confirmed Profile

**This handoff is required for a new organisation.** Confirming a profile does not automatically make it the organisation used by the generator.

1. Give the operator the preparation you confirmed and its exported profile/reference details.
2. Ask them to configure that exact confirmed version as the generation target and restart the application and its AI workers. This should happen before play, with saved work protected.
3. Sign in again. Open **Package generation** and check **Confirmed profile binding**: the organisation name and reviewed version should be the intended ones.
4. Check that the threat-library assessment is **Applicable**. If not, review the stated missing context with the operator rather than changing facts simply to pass the check.

The existing 3031 demonstration profile is already configured. You do not need this handoff merely to inspect it or generate another package from that same confirmed version. There is currently no in-app industry picker or general-purpose profile-switch button.

**Expected result:** the intended profile is shown and **Generate draft** is available when AI and request capacity are available.

## Step 4: Generate or Select a Package

**Who:** facilitator, privately. Participants should not see future injects or facilitator criteria.

1. In **Package generation**, select **Generate draft** and confirm subscription use. Wait for the queued/generating state to finish; do not repeatedly request new drafts because generation is taking time.
2. Alternatively, choose an existing unfrozen **Review** entry from **Package draft**. This is the quickest route for the prepared demonstration.
3. Read **Scenario and objectives**, **Background shared with players**, **Player roles** and **Threat pathway**. Confirm that the incident, its impact and the decisions make sense for the reviewed organisation.

**Expected result:** the package is available for **Facilitator review**, with five numbered inject tabs. A new draft initially has zero accepted injects. Nothing has been delivered to participants.

Do not choose the completed reference package expecting to replay it. Its frozen package and completed run are retained evidence. Prepare a different draft for a new play-through; the current interface does not reopen the completed run.

## Step 5: Review Preparation and All Five Injects

### Finish Preparation First

1. In **Preparation**, select **Plan being exercised** and assign the appropriate confirmed people to each role.
2. Review **Shared Step 0 references**, each role's briefing and the shared background. Shared information should establish the starting situation, not reveal future technical discoveries or the solution.
3. If you changed anything, select **Save preparation**. If the saved preparation is already correct, continue without saving; the button is disabled when nothing has changed.

Some controls allow several selections. On Windows, use Ctrl-click to add or remove an individual choice without replacing the other selections; check the resulting list before saving.

**Important:** changing preparation clears all inject acceptances and image attachments. Finish this section before generating images or doing the final acceptance pass.

### Review Each Numbered Inject

For each of the five tabs:

1. Read the event and **Decision point**. An information update does not necessarily need a new major decision.
2. Check **Elapsed minutes**. This is the incident's story clock, not a timer that forces you to wait that long in the room.
3. Check each role's **Profile evidence** and **Questions**. Give a role what it would reasonably know, rather than every specialist fact.
4. Review each story message's **Kind**, **From**, **Headline**, **Message** and **Received by**. Check names, dates, timing, claims and recipients against the scenario.
5. Review **Expected actions**, **Evaluation criteria** and **Facilitator notes**. These guide facilitation and review; they are not participant instructions or proof that an action happened.
6. Select **Save edit** after making changes. Inspect **Saved role-specific messages** to confirm what was actually saved. An edited inject returns to **Pending**.

If an inject is unsuitable, use **Reject inject**, correct it and review it again. Rejection is not deletion. Finish optional images in Step 6 before the final acceptance in Step 7.

## Step 6: Add an Image, If It Helps the Discussion

Images are optional. Text-only injects still work. A ransom-note image may make a message easier to recognise; a **PowerShell transcript** represents saved console text and is never executed by the platform.

1. In an unfrozen draft, finish the story message. If you changed it, select **Save edit**; otherwise use the existing saved message without trying to save again.
2. Select **Generate image**, confirm subscription use, then wait for **Image ready for review.**
3. Compare the image with the saved message. Check every important word, number, date and assertion, not just whether it looks convincing.
4. Only if it is suitable, select **Attach image** and confirm. The status should say **Image attached.** A generated image is not attached automatically.
5. If it is wrong, leave it unattached and keep the text, or deliberately request another image within the available limit. **Remove image** detaches an attachment without deleting the message text.

Attaching an image resets that inject's acceptance. Later changes to its text, recipients or timing can detach it; preparation changes clear every attachment. Recheck attachments before freezing. Participants see an attached image only after its inject is released to their role.

For the prepared 3031 example, the separate Review draft has a saved PowerShell message at inject 2, story message 2. Use that draft for an image demonstration, not the frozen reference package.

## Step 7: Accept and Freeze the Package

1. Return to each inject and select **Accept inject** only after its saved text, recipients and any attached image have been reviewed.
2. Check that all five are **Accepted**. Resolve any **Objective coverage must be resolved before freezing** warning; restoring the necessary assessment coverage may require revisiting the injects.
3. Select **Approve and freeze package** and confirm.
4. Note the **Frozen run** identifier, then open **Exercises** and select that run.

**Expected result:** **Approved and frozen**, five accepted injects and a corresponding exercise run. The package is now read-only. It cannot be edited or have its images replaced. Freezing does not start the run, send any messages or answer Step 0 for the team.

## Step 8: Prepare the People and Start

**Who:** facilitator and representatives of every assigned participant role.

1. Check the selected exercise and assignments. Have participants sign in using their own role accounts, in separate browser sessions, and choose the same exercise.
2. In Step 0, ask the team whom they would contact first, how they would find/use the contact route, and what fallback they would use. References may be consulted. Record their answers rather than supplying a model answer first.
3. Select respondents covering **every participant role**, not only the recipients of the first inject. Choose the **Facilitator decision** and fill **Decision rationale and gap disposition**.
4. Choose **Ready** only when the starting arrangements have a reviewed basis, then select **Record Step 0 decision**. If clarification is needed or the exercise should be held, record that decision honestly instead. Correct the gaps or record a reviewed exercise assumption before recording a later Ready decision.
5. Review the briefing and required acknowledgements, then select **Confirm briefing and start**.

**Expected result:** the run becomes active, with the first inject ready for facilitator approval. The Ready decision is a check of stated contact arrangements, not a test that real people are reachable. Do not make real calls during this discussion exercise.

## Step 9: Release, Discuss and Close Each Inject

Repeat this sequence for all five positions. The facilitator controls the pace; the platform does not send the next update automatically.

### Release the Update

1. Review the current inject and intended recipients.
2. Select **Approve inject**, then **Release to inbox**. These are separate actions.
3. Ask participants to check their inbox. Different roles may receive different information and images. A missing image is not automatically an error if that role was not selected to receive it.

### Discuss and Record the Team Response

Participants read their own information, share relevant observations in the discussion and agree a response. Nominate one person to enter the team's **Agreed actions**, **Team rationale** and **Information requests**, select **Submit team response**, and check that the saved response revision appears. Other assigned participants can revise that same response; these are not separate private submissions. Avoid several people editing simultaneously.

A useful response might say: "We would ask the incident lead to decide whether the affected service should be isolated. We would preserve the available evidence first and need the supplier to clarify the recovery position." This describes intended actions and missing information, not actions already performed.

Questions entered in the form do not contact suppliers or send external messages. The facilitator answers during the discussion. To retain a clarification, use **Facilitator Clarifications > Current position answer**, enter the actual **Participant question**, and either record a supported answer with **Confirmed claim IDs** or select **Not known at this time**. Select **Record clarification** before closing the current position. This log is facilitator-only: recording an answer does not deliver it to participant inboxes. Communicate it to the team as well.

### Review and Close

1. Read the latest saved response. Optionally select **Interpret response** to request AI assistance, then compare its action assessments and quoted evidence with what the team actually wrote. Enter **Review rationale**, then use **Accept interpretation**, **Save edited assessment**, **Reject interpretation** or **Record manual override** as appropriate. **New manual assessment** is available without AI. This interpretation review is separate from the disposition below.
2. Record the facilitator's disposition separately, using **Record disposition**. Note unresolved gaps and the reason for the decision. A clarification-required or hold disposition prevents closure until reviewed.
3. When ready to progress, ensure the current response has a **Reviewed** disposition, enter **Closure rationale** and select **Close position**.
4. If no response was received, record that fact in **Facilitator observations**, record the missing response in **Unresolved gaps**, save a **Reviewed** disposition and explain the unanswered closure in **Closure rationale**. Do not invent a team answer.
5. Move to the next position and repeat approval, release, discussion, review and closure.

**Check before continuing:** the current position is closed. An AI interpretation does not close it, release another inject or choose a scenario branch. If the team revises its response, review the new version; older assessments may now be stale.

### Pause or Finish

Use **Pause run** when discussion needs to stop. Participants can still read saved information, but new responses and progression are blocked. Keep unsaved work in the open page; it is not a durable backup. Select **Resume run** when ready, and reapprove any unreleased inject because an earlier approval is no longer valid.

After all five positions are closed, enter **Completion rationale** and select **Complete run**. Completion means the discussion has ended, not that the organisation recovered successfully. A justified decision to hold restoration can remain the final outcome. A completed run cannot be reopened through the current interface.

## Step 10: Debrief, Capture the Record and Review the AAR

**Who:** facilitator, with participant feedback and the people responsible for proposed improvements.

### Record the Debrief Before Taking the Snapshot

1. In the completed generated exercise, open **Record report**.
2. In **Debrief**, record **Participant feedback (your summary)**, **Facilitator observations** and **Exercise design limitations** as appropriate. Select the participants whose feedback you are summarising. Do not attribute feedback to people who did not give it.
3. Select **Record debrief**.
4. Review the saved exercise responses and any interpretations you intend to include, then select **Capture record snapshot**.

**Expected result:** a saved snapshot containing the captured record, with citations to its evidence. It does not update automatically when you add later debrief notes or review another interpretation. Capture a new snapshot if those changes must appear in the report.

### Draft and Review the Findings

1. Select the intended **Snapshot**, check the remaining attempts, then choose **Draft AAR**. This starts the AI request immediately; there is no separate subscription-use confirmation dialog. **New manual AAR** is available when AI is unavailable or a manual review is preferred.
2. Treat **Unreviewed draft** as a proposal. Read each finding and follow its evidence links into the captured record. Check that a statement about what someone proposed is not described as something they actually carried out.
3. Use **Edit draft** to correct findings or proposed improvements; **Preview draft** returns to the reading view. Manual findings also need supporting snapshot citations, not unsupported free-form conclusions.
4. In **Proposed Improvement Actions**, leave **Owner** as **Unassigned** unless a person has actually accepted responsibility. The owner list uses people in the confirmed profile. An assigned owner also needs a date in the **Due** column; agree these outside the application before saving them.
5. Enter **Review rationale**. Use **Accept AAR** for suitable unchanged AI output, **Save AAR edits** for edited output, **Save manual AAR** for a manual report, or **Reject AAR** if the proposal is unsuitable. Assigning an owner changes the output, so save it as an edit.

**Expected result:** a saved reviewed AAR or an explicitly rejected proposal, with an honest record of findings and proposed actions. Neither a valid quotation nor AI acceptance proves operational capability.

For a manual AAR or a new finding, enter edit mode and use the plus icon under **Strengths** or **Areas for improvement**; its tooltip names the action. Choose **Finding category**, then the supporting **Record** and **Field**. Expand **Captured field**, and put a matching passage in **Exact excerpt**. Do not rewrite a quotation to make it fit. To add an action, use the plus icon labelled **Add improvement proposal**, write the proposal and select the finding IDs that support it in **Evidence**. Preview the result and save it with a review rationale. If you are unsure which category or evidence applies, leave the report unapproved and review it with the facilitator/operator.

There is no report PDF/download control or completed-action tracker in this version. Review the report in the platform, then track agreed actions in the organisation's normal process. The operator's private data backup is not a participant report and must not be distributed as one.

## Participant Instructions

You only need your assigned account and the exercise selected by the facilitator.

1. Sign in using the operator-supplied address and your own access code. In the prepared example, accounts are `player-business`, `player-engineering` and `player-it`. Use the account assigned to your function, not the facilitator account.
2. Choose the exercise the facilitator names. Read the references available to you and contribute to the Step 0 contact discussion. Read your briefing in the **Briefing** tab when it becomes available.
3. Wait for the facilitator to release an inject. Each released inject opens in its own numbered tab: the situation, any story messages, what you know (tagged Fact, Proposal, Unknown and so on) and the questions to discuss. Select **Enlarge image** to see an image full size. If you are reading an earlier inject when a new one arrives, the new tab is marked **New** instead of opening. You are not expected to see every other role's information or future messages.
4. Discuss what your function knows, what it does not know, and what the team would do next. Do not run commands shown in an artefact or contact a real supplier as part of the exercise.
5. Agree one response in the **Team response** panel beside the inject (below it on a narrow screen). The nominated scribe fills **Agreed actions**, **Team rationale** and optional **Information requests**, then selects **Submit team response**. To correct an existing response, select **Revise team response**, make the changes, then **Submit team response** again. Check the saved response before moving on.
6. Tell the facilitator about questions or missing information. The response form is not a chat system; the facilitator communicates clarification answers during discussion.
7. When paused, keep unsent text in the open page and wait. Reloading or signing out can lose unsaved work.
8. After the last inject, contribute feedback: what was clear, which decisions were difficult, what information was missing and what should change. The facilitator records the debrief and shares the reviewed conclusions.

The facilitator's interpretations, private notes and AAR are not participant screens. Ask the facilitator to share the reviewed findings rather than expecting access through your participant account.

## When Something Does Not Work

| What you see                                      | What to do                                                                                                                                                                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The page will not open                            | Check the operator's address and that the service is started. `127.0.0.1` on another laptop points to that laptop, not to the demonstration computer. Do not change network exposure yourself.                                                                                            |
| Sign-in stopped working after a restart           | Sign in again with the code for this instance. Saved records remain; sessions do not survive a restart.                                                                                                                                                                                   |
| A review field is locked                          | Check whether you selected a confirmed intake, frozen package or completed run. Use the appropriate new draft for changes, not the retained reference record.                                                                                                                             |
| **Confirm profile snapshot** is disabled          | Save edits, decide every Pending candidate and tick the review acknowledgement. Read validation errors for missing evidence, relationships or unresolved contradictions.                                                                                                                  |
| Generation shows the wrong organisation           | Stop. Ask the operator to configure the exact confirmed profile. Confirming a new intake does not switch the generator.                                                                                                                                                                   |
| **Generate draft** is disabled                    | Check the profile binding, threat applicability, unsaved work, AI status and any displayed limit. Ask the operator to check the package worker.                                                                                                                                           |
| An AI job remains queued                          | Ask the operator to check the worker for that specific mode. One working AI feature does not prove all five workers are running. Do not keep queuing replacement requests.                                                                                                                |
| **Generate image** is disabled                    | Save the message/preparation, use an unfrozen draft, and check AI availability, any active image job and the package's image limit. Images are optional.                                                                                                                                  |
| An image disappeared from the draft               | Text, recipient, clock or preparation edits may have invalidated its attachment. Review the saved version, attach a suitable image again and reaccept the affected inject.                                                                                                                |
| **Approve and freeze package** is disabled        | Check all five acceptances, saved preparation and objective coverage. Image attachment or later edits may have reset acceptance.                                                                                                                                                          |
| Start, release or close is blocked                | Check Step 0, briefing, run state, current approval/recipients, the latest response and its disposition. Close the current position before progressing.                                                                                                                                   |
| The run or response changed while you were typing | Read the latest saved version, select **Review latest state**, compare your retained draft with the new information, then submit the intended revision. Do not overwrite another person's contribution without discussion.                                                                |
| Step 0 says its context changed                   | Use **Refresh context and keep draft**, review the refreshed information and tick **I have reviewed this draft against the refreshed context.** If the package or assignments changed, use **Discard unsaved check** and record a new check against the new context instead.              |
| A participant cannot see an image                 | Check that it was attached before freezing and its inject was released to that participant's role. Different role visibility is intentional.                                                                                                                                              |
| "Request outcome not confirmed" appears           | Use the displayed exact-retry control, such as **Retry same request** or **Retry exact request**. Do not refresh and submit a new command just because the reply was lost. If already reloaded, check saved state with the operator before trying again.                                  |
| AI fails or reaches its limit                     | Keep the recorded failure. Existing draft review, text-only injects, manual interpretation and manual AAR remain available where their prerequisites exist. A failed new package generation does not create a usable package; use a reviewed existing draft or ask the operator for help. |
| A snapshot or AAR omits later feedback            | Record the feedback, capture a new snapshot and prepare/review an AAR against that snapshot. Earlier snapshots do not silently change.                                                                                                                                                    |

Save before switching views, closing the browser or signing out. If the application asks whether to discard unsaved work, stay on the page unless you genuinely want to discard it. A server restart pauses interrupted active runs; the facilitator must review the state and resume explicitly.

## Operator Handoff and Current Limits

Participants should not need terminal commands. Before inviting them, ask the operator to confirm:

- The correct application, saved dataset and role access codes are available, with a private backup.
- The intended confirmed organisation is configured and the three role accounts can access the right run.
- Separate workers for extraction, packages, images, interpretations and AARs are ready if live AI is needed. Restart the workers after restarting the application or Docker.
- No unexpected jobs are queued, and enough application/subscription capacity remains. Current application caps include ten extraction requests per intake, ten package drafts per facilitator, ten image requests per package, thirty started interpretations and three started AAR attempts per dataset. Failures can consume limits; there is no automatic retry or paid fallback.
- The chosen role labels and supported ransomware pathway suit the example. This version is not a general industry-template catalogue, a ten-inject generated exercise or a branching scenario engine.

Operator instructions: [setup](../README.md#setup), [package target configuration](../README.md#five-inject-generation), [image and full-demo workers](../README.md#story-image-generation), and [data transfer](../README.md#moving-laptops). The operator should use the existing 3031 instance for this demonstration, not run the default setup command and assume it contains the same saved records.

This guide was reviewed against the current interface source, browser workflows and demonstration state. It is a guide to the implemented prototype, not evidence that a first-time SME has independently completed a usability trial. [WORK](WORK.md) records the precise checks and remaining limitations.
