# Verae staging user-test plan

Last updated: 2026-07-20
Target: `https://app-uat.veraehealth.com` and `https://api-uat.veraehealth.com`
Data rule: staging must contain synthetic people, documents, results, and appointments only.

## Objective

Prove that a prospective or invited member, an established member, a doctor, and an administrator can complete their critical journeys without confusion, data leakage, silent failure, or a dead end. The plan combines task-based user testing with functional, privacy, accessibility, responsive, and recovery checks.

## Release decision

- **Go:** all P0/P1 cases pass; no cross-account data is visible; all create/update actions survive refresh; email, OAuth, MFA, document, lab-result, and care-plan journeys are verified end to end.
- **Conditional go:** P2 issues have an owner and an accepted workaround; performance and accessibility budgets are met or explicitly accepted.
- **No-go:** any P0/P1 failure, broken account recovery, role bypass, draft clinical data shown to a member, missing audit history for a clinical mutation, or a member-facing dead end.

Severity definitions:

- **P0:** security/privacy breach, corruption or loss of clinical data, or complete outage.
- **P1:** critical journey cannot be completed and has no safe workaround.
- **P2:** important defect with a workaround, misleading state, or material accessibility/responsive problem.
- **P3:** polish, copy, or low-impact inconsistency.

## Test accounts and fixtures

Prepare these isolated accounts before the session. Keep credentials outside this document.

| Fixture | Required state |
| --- | --- |
| M1 — new invite | Temporary password valid; no setup steps completed |
| M2 — expired invite | Temporary password expired; setup incomplete |
| M3 — profile incomplete | Setup complete; health profile not complete |
| M4 — established member | Profile complete; upcoming teleconsult; no results or plan |
| M5 — results member | Released report with normal, borderline, high, low, text, and historical values |
| M6 — care-plan member | Released care plan with several focus areas and actions |
| D1 — new doctor | Activation email valid; MFA not enrolled |
| D2 — established doctor | MFA enrolled; assigned M4–M6 only |
| A1 — admin | MFA enrolled; developer mode available |
| U1 — unassigned member | Must never be visible to D2 |
| Files | Valid PDF, password-protected PDF, scanned PDF, wrong file type, oversize file, duplicate, and harmless malware-test fixture approved for staging |

Every mutation case should record the synthetic account, timestamp, expected result, actual result, request ID if visible, and whether refresh/re-login preserved the state.

## Execution matrix

### A. Public routing, legal, and resilience

| ID | Test | Expected result | Priority |
| --- | --- | --- | --- |
| A01 | Open the app UAT root | Redirects once to `/member`; no loop or flash of unrelated content | P1 |
| A02 | Open `/member.html` | Redirects to clean `/member` URL and retains safe query parameters | P2 |
| A03 | Open an unknown portal path | Safe sign-in or not-found outcome; no stack trace or blank screen | P2 |
| A04 | Open Terms, Privacy, and Informed Consent directly | Correct title and full English content; footer links work | P1 |
| A05 | Follow “Back to home” from each legal page on app UAT | Returns to the expected portal landing state | P2 |
| A06 | Use back/forward and refresh on each legal and auth state | State remains coherent; sensitive URL fragments are removed | P1 |
| A07 | Simulate offline/API failure during initial load | Human-readable recovery state; no permanent blank screen | P1 |
| A08 | Check live and readiness endpoints | Both return 200 with security headers and no sensitive payload | P1 |
| A09 | Open staging API docs | Documentation is available only on staging when `EXPOSE_API_DOCS` is intended to be enabled | P2 |

### B. Sign-in, recovery, Google, and MFA

| ID | Test | Expected result | Priority |
| --- | --- | --- | --- |
| B01 | Submit empty sign-in form | Browser/client validation identifies email and password | P2 |
| B02 | Enter malformed email and password under 10 characters | Invalid fields are blocked without an API call | P2 |
| B03 | Enter unknown email and plausible password | Generic error; does not disclose whether the account exists | P1 |
| B04 | Enter wrong password for a real account | Same generic error and safe retry behavior | P1 |
| B05 | Repeated failed sign-ins | Rate limit/CAPTCHA behavior is clear and does not lock valid users silently | P1 |
| B06 | Toggle “New to Verae?” | Invitation hint opens, announces expanded state, and is keyboard operable | P3 |
| B07 | Open and leave forgot-password mode | Email is retained intentionally; back returns to sign-in without stale errors | P2 |
| B08 | Request reset for unknown and known accounts | Identical confirmation copy; one valid, expiring email for known account | P1 |
| B09 | Use reset link once, twice, and after expiry | First use succeeds; reused/expired links show safe “Link unavailable” state | P1 |
| B10 | Reset with short, mismatched, and valid passwords | Rules are clear; mismatch is inline; valid reset revokes other sessions | P1 |
| B11 | Google sign-in with the invited email | Returns to the correct setup or portal state | P1 |
| B12 | Google sign-in with a different email during setup | Explains mismatch and preserves a password fallback | P1 |
| B13 | Cancel/deny Google consent or lose network on callback | Returns to a recoverable state without creating a duplicate identity | P1 |
| B14 | Staff sign-in with MFA | Six numeric digits required; wrong/expired code is rejected; valid code succeeds | P1 |
| B15 | Refresh/back on `?twofactor=1` and then sign out | Challenge survives the needed remount and the URL flag clears after success/sign-out | P1 |
| B16 | Session expiry while navigating | Redirects to sign-in without exposing cached clinical content | P0 |
| B17 | Sign out, then use back button | Authenticated screens and API data do not reappear | P0 |

### C. Invited-member setup

| ID | Test | Expected result | Priority |
| --- | --- | --- | --- |
| C01 | Sign in with a valid temporary password | Lands on “Secure your account,” not the member dashboard | P1 |
| C02 | Choose a new password | Minimum and confirmation rules apply; setup resumes after refresh/re-login | P1 |
| C03 | Choose Google instead | Only matching invited email is linkable; safe recovery on callback failure | P1 |
| C04 | Verify email with wrong, expired, and valid OTP | Six digits only; resend has a cooldown; old code is invalidated as intended | P1 |
| C05 | Refresh or re-login during auth, OTP, and consent steps | Server flags resume exactly at the first incomplete step | P1 |
| C06 | Review Terms and required acknowledgements | Documents are scrollable and keyboard accessible; all acknowledgements are explicit | P1 |
| C07 | Enter missing or mismatched legal name/signature | Submit stays disabled or shows a precise error | P1 |
| C08 | Complete consent | Portal opens once; versions, timestamp, and signature are stored | P0 |
| C09 | Sign in with an expired invite | Clear expiry screen; no access; admin can regenerate safely | P1 |

### D. Member health profile and documents

| ID | Test | Expected result | Priority |
| --- | --- | --- | --- |
| D01 | First portal visit with incomplete profile | Profile flow opens automatically and can be understood without instruction | P1 |
| D02 | Exit incomplete flow | Draft is retained; Home makes the next action obvious | P1 |
| D03 | Complete each answer type | Single-select, multi-select, segmented, free text, and conditional questions behave correctly | P1 |
| D04 | Use Back/Next repeatedly and refresh mid-flow | No answer loss, duplication, or stale foreign draft | P0 |
| D05 | Exercise minimum/maximum/none-of-the-above combinations | Contradictory states cannot be saved; validation points to the affected question | P1 |
| D06 | Add very long text, punctuation, emoji, and pasted content | Limits are clear; content remains readable and safely rendered | P2 |
| D07 | Upload every allowed report category | Progress, success, filename, category, and persistence are correct | P1 |
| D08 | Upload invalid, oversize, password-protected, duplicate, and scanned files | Each has a specific recoverable outcome; no stuck spinner | P1 |
| D09 | Remove an uploaded file | Confirmation is appropriate; list and server state agree after refresh | P1 |
| D10 | Open/download an uploaded file | Authorization works, filename is safe, link expires, and no other member can fetch it | P0 |
| D11 | Complete profile and inspect summary | Every answer is represented correctly; preferred name updates greeting | P1 |
| D12 | Edit each summary section | Returns to the right step and keeps unrelated answers unchanged | P1 |
| D13 | Sign in as a second member in a fresh context | No draft, filename, answer, or cached document from the first member appears | P0 |

### E. Member journey, results, and care plan

| ID | Test | Expected result | Priority |
| --- | --- | --- | --- |
| E01 | Inspect every journey stage | Hero, rail, CTA, stage copy, and enabled tabs agree with server state | P1 |
| E02 | Open teleconsult details and join link | Date/time uses Malaysia timezone; join is disabled without URL and opens safely with URL | P1 |
| E03 | Refresh after admin reschedules/cancels consult | Member sees new state without contradictory stale copy | P1 |
| E04 | Open Results before any released report | Intentional empty state; no demo or draft data | P0 |
| E05 | Open released results | Counts, statuses, ranges, units, dates, and categories match source report | P0 |
| E06 | Search and filter results | Normal/borderline/high/low filters combine predictably; “no markers” clears easily | P2 |
| E07 | Open each biomarker drawer | Value, range context, explanation, history, close/escape, focus, and scroll behave correctly | P1 |
| E08 | Inspect missing range, text result, unit change, and historical trend | No misleading chart/status; unit-changing history is quarantined or converted | P0 |
| E09 | Open Care Plan before release | Intentional unavailable state; draft plan is hidden | P0 |
| E10 | Open released care plan | Doctor, title, summary, markers, focus areas, and actions match released version | P0 |
| E11 | Open focus-area panels and marker links | Correct details open; close/escape and focus return work | P2 |
| E12 | Mark actions done/undone and refresh/re-login | State persists or is clearly presented as local-only by product intent | P1 |
| E13 | Download/share controls | Produce the intended artifact without exposing private URLs or another member’s data | P0 |

### F. Doctor console

| ID | Test | Expected result | Priority |
| --- | --- | --- | --- |
| F01 | Activate new doctor account | One-time link, password rules, and mandatory MFA setup all work | P1 |
| F02 | Enrol MFA with QR/manual secret and confirm | Wrong code rejected; valid code completes; secret is not exposed afterward | P0 |
| F03 | View case list and upcoming consults | Only assigned members appear; names, emails, stages, dates, and links are accurate | P0 |
| F04 | Attempt direct access/API request for U1 | 403/404 with no clinical metadata | P0 |
| F05 | Open member brief, documents, and results | Answers and released results match member/admin views; draft results stay hidden | P0 |
| F06 | Preview/download member document | Only assigned member documents are authorized; expiry and filenames are safe | P0 |
| F07 | Build recommended panel from presets | Counts, deduplication, search, categories, reset, and review are correct | P1 |
| F08 | Fine-tune panel and save | Add/remove is keyboard usable; refresh preserves saved selection | P1 |
| F09 | Create/edit care plan | Reorder areas, select imagery, add/remove actions, use templates, save, preview, and reopen | P1 |
| F10 | Release care plan | Confirmation is explicit; released content appears to the correct member only | P0 |
| F11 | Edit after release | Version/re-release behavior is unambiguous; member never sees half-saved content | P0 |
| F12 | Download plan PDF | Complete, legible, correctly branded, and contains only the selected member’s data | P0 |
| F13 | Sign out | Session and cached clinical screens are inaccessible via back/refresh | P0 |

### G. Admin console

| ID | Test | Expected result | Priority |
| --- | --- | --- | --- |
| G01 | Cases search and stage filters | Correct counts/results, clear empty state, keyboard operable controls | P1 |
| G02 | Add patient with valid and duplicate email | Valid invite generated once; duplicate has a precise safe error | P1 |
| G03 | Copy invite password/message | One-time value copies correctly and is unavailable after dismissal/refresh | P0 |
| G04 | Regenerate expired invite | Old password stops working; expiry and status update after refresh | P1 |
| G05 | View/edit member profile and stage | Correct member only; changes persist and timeline/audit records actor and time | P0 |
| G06 | Assign, reassign, and unassign doctor | Both doctor lists update; former doctor loses access immediately | P0 |
| G07 | Schedule, reschedule, and cancel teleconsult | Timezone and meeting URL validation are correct across admin, doctor, member, and email | P1 |
| G08 | Add doctor and use activation email | Duplicate and invalid email safe; doctor follows activation/MFA path | P1 |
| G09 | Deactivate/reactivate doctor | Sign-in/access and assignments behave as designed; clear status in admin | P0 |
| G10 | Create a manual report and biomarkers | Required fields, units, ranges, text/numeric values, edit/delete, and persistence work | P0 |
| G11 | Ingest valid digital PDF | Parse, mapping, inclusion, review, save, and draft state match the source | P0 |
| G12 | Ingest scanned/poor/unknown PDF | OCR/progress/cancel/retry are clear; uncertain/unknown markers require human review | P1 |
| G13 | Handle duplicate/conflicting event or report | Idempotent duplicate; conflicting input is quarantined, never silently overwrites | P0 |
| G14 | Release report | Explicit gate; correct member/doctor sees exact released values; no draft rows leak | P0 |
| G15 | Delete report/biomarker/account | Confirmation and authorization are strict; audit/retention behavior matches policy | P0 |
| G16 | Enable/expire/disable developer mode | Hidden activation, password failure, timeout, and visible warning state all behave safely | P1 |
| G17 | Delete patient/doctor with `DELETE` confirmation | Correct target and dependency behavior; no accidental cross-account deletion | P0 |

### H. Accessibility, responsive, browser, performance, and privacy

| ID | Test | Expected result | Priority |
| --- | --- | --- | --- |
| H01 | Complete critical flows by keyboard only | Logical focus order, visible focus, no traps, Escape closes dialogs, focus returns | P1 |
| H02 | Screen-reader landmarks/names | One useful H1, labelled controls/dialogs, announced errors/status, decorative media hidden | P1 |
| H03 | Contrast and zoom to 200%/400% | Text, controls, focus, and status indicators remain perceivable and reflow | P1 |
| H04 | 390×844, 768×1024, 1280×800, and 1440×900 | No horizontal overflow, clipped controls, obscured dialog actions, or body-scroll lock errors | P1 |
| H05 | Latest Safari, Chrome, Edge, iOS Safari, Android Chrome | Critical flows and downloads behave consistently | P1 |
| H06 | Slow 3G/high latency during each mutation | Single submission, visible progress, safe retry, no duplicate invite/report/plan | P1 |
| H07 | Refresh immediately after create/update | Server truth is shown; optimistic UI never masks a failed mutation | P0 |
| H08 | Inspect console/network and cache policy | No uncaught errors/PHI; hashed assets are compressed and immutable-cached | P2 |
| H09 | Bundle and image performance | Login becomes interactive promptly; clinical screens do not download unrelated OCR/PDF assets | P2 |
| H10 | Browser storage, URLs, analytics, logs, object keys | No PHI, tokens, temporary passwords, or document paths persist where prohibited | P0 |
| H11 | Multi-tab session and role change | Revocation, sign-out, reassignment, and account deletion invalidate stale tabs | P0 |

## Initial execution record — 2026-07-20

| Check | Result | Evidence/notes |
| --- | --- | --- |
| A01 root redirect | Pass | `https://app-uat.veraehealth.com/` redirected to `/member` |
| B03 unknown account | Pass | Generic “couldn't sign you in” message; no existence disclosure |
| B06 invitation hint | Pass | `aria-expanded` changed from false to true and hint became visible |
| B07 forgot-password UI | Pass | Email retained; Back control present; email send intentionally not triggered in this pass |
| B09 missing reset token | Pass | Safe “Link unavailable” state and Back control |
| F01 missing activation token | Pass | Safe activation-specific “Link unavailable” state |
| A04 legal pages | Pass | Correct H1/title/content for all three; no console errors or horizontal overflow |
| A08 API health | Pass | `/health/live` and `/health/ready` returned HTTP 200 with HSTS, no-sniff, same-origin frame policy, and no-referrer |
| A09 staging docs | Fail (P2) | `/docs` and `/openapi.json` returned 404; staging config does not currently expose the intended docs |
| B05 CAPTCHA/rate-limit parity | Fail (P1) | No Turnstile control is rendered and staging has no Turnstile setting; sign-in was enabled without a token, so the launch-gate CAPTCHA flow cannot be tested |
| B05 API rate limiting | Pass (partial) | Twenty rapid wrong-password attempts produced 3×401 followed by 17×429. The 429 response exposed reset metadata but no `Retry-After`; CAPTCHA remains unavailable as noted above |
| B14 staff MFA enforcement parity | Fail (P1) | `REQUIRE_STAFF_MFA=false` in staging; the UI still routes unenrolled staff to setup, but server-side enforcement cannot be proven under production-equivalent settings |
| H04 mobile sign-in | Pass | 390×844 layout had no horizontal/document overflow and every control remained visible |
| H04 tablet/desktop sign-in | Pass | 768×1024 and 1280×800 had no horizontal/document overflow or clipped auth card |
| H02 sign-in semantics | Pass (partial) | English page, one H1/main, labelled inputs, named buttons, and no duplicate IDs; keyboard/screen-reader run still pending |
| H10 CORS origin restriction | Pass | App UAT origin received the allow-origin header; an unrelated origin did not |
| H10 portal security headers | Fail (P1) | Portal response has HSTS but no CSP/frame-ancestors or X-Frame-Options, no Referrer-Policy, and no X-Content-Type-Options |
| Automated tests | Pass | 9 files, 35 API tests; production-boundary check passed |
| Production build | Pass with warnings | Build succeeded; current member bundle is about 862 kB before transfer compression and Vite reports an oversized chunk |
| H08 hashed asset caching | Fail (P2) | Current hashed member JavaScript is served with `cache-control: public, max-age=0, must-revalidate` |
| H08 transfer compression | Pass | Current hashed member JavaScript is served with Brotli when the client accepts it |
| C01 invited-member routing | Pass | Synthetic member with incomplete setup landed on “Secure your account,” step 1 of 3 |
| C02 password validation | Fail (P1) | Mismatched passwords show a useful inline error, but matching short passwords are submitted and return raw “Internal Server Error” instead of a password-rule message |
| D01 first incomplete profile visit | Pass | Health-profile dialog opened automatically at step 1 of 10 |
| D02 Save & close | Fail (P1) | Editing preferred name and gender, choosing “Save & close,” and immediately reopening lost both edits; the exit gives no warning that the current step was not saved |
| D03–D05 profile question controls | Pass | Completed segmented, multi-select, range/default, free-text, and none-of-the-above paths. Choosing “Nothing major” correctly deselected a symptom |
| D06 free-text rendering | Pass | Punctuation, emoji, and literal `<script>` text persisted and rendered as text in the summary; no script execution or console error |
| D11 profile completion and summary | Pass | All selected answers appeared correctly; completion survived refresh and the home journey advanced to consult scheduling |
| E04 unreleased-results state | Fail (P1) | API returned zero lab reports, but Results said “6 of 136 markers measured,” showed six blank “Doctor reviewed” rows, and reported 130 not tested. This is duplicate catalog counting, not server data |
| E06 results search empty state | Pass | A no-match query produced a clear “No markers found” state |
| E09 draft care-plan privacy | Pass | Member care-plan API returned `data: null` while the assigned doctor had a saved draft; member UI showed “Your plan is on the way” |
| F02 MFA setup validation | Pass (partial) | Wrong current password was rejected; five-digit code kept confirmation disabled; a wrong six-digit code produced “Invalid code.” Valid enrolment was not completed in this run |
| F03 doctor assignment visibility | Pass | Synthetic doctor saw only assigned synthetic members; the unassigned member was absent |
| F04 direct unassigned access | Pass (privacy), Fail (P2 semantics) | Doctor with zero assignments saw an empty list and direct case lookup returned `200 {data:null}` with no metadata. Prefer 403/404 as specified |
| F07 panel presets/search/deduplication | Pass | Baseline selected 36 unique markers; cardiovascular added only five non-overlapping markers; search, checkbox fine-tuning, reset, and review behaved coherently |
| F08 saved panel discoverability | Fail (P1) | Saving created a 36-marker ordered lab panel, but after refresh the case brief still offered only “Order blood panel” with no existing-order state, inviting duplicate orders |
| F09 care-plan draft | Fail (P1) | Template editing, preview entry, and draft save succeeded and persisted server-side, but after refresh the doctor case had no route back to the saved draft without re-entering the order flow |
| F13 doctor sign-out | Pass | Sign-out returned to login and removed the authenticated doctor screen |
| G01 admin search/filter | Pass | Email search and care-plan-drafting filter returned the correct synthetic case and counts |
| G02 patient creation/duplicate | Pass | Duplicate email produced a precise error; a new `.test` patient was created once and assigned to the selected doctor |
| G03 one-time invite password | Pass | Copy action confirmed success and the temporary password was absent after dismissal and refresh |
| G05 reversible stage update | Pass | Stage changed to Consult upcoming immediately and was restored to Profile incomplete; selected server value matched after the mutation |
| G08 doctor invitation | Pass (partial) | Duplicate email was rejected; new `.test` doctor reached Invitation pending and the UI reported a seven-day activation link. Inbox/link completion remains pending |
| Admin Settings control | Accepted by design | Settings is the intentional five-click Developer mode discovery gesture. The password gate remains the security boundary; the gesture is documented only in the internal runbook |
| Staging synthetic-data rule | Pass | The three profiles outside `@example.test` were confirmed as existing staging-only test fixtures; they are retained and require no cleanup |
| Released clinical content immutability | Fail (P0, static review) | Released report/biomarker and care-plan update endpoints did not restrict in-place edits. Remediation requires database-enforced immutability and versioned corrections before launch |
| H04 authenticated admin mobile | Fail (P1) | At 390×844 the account control and Settings/Sign-out menu extend to 516 px inside a clipped 390 px viewport; the right side is unreachable. Tables are separately wide, but the account control itself is not contained |
| H01 keyboard structure | Pass (partial) | Sign-in controls are native, enabled, visible, and `tabIndex=0` in logical DOM order. Synthetic key traversal in the in-app browser did not move focus, so a manual keyboard pass is still required |
| Role-boundary API checks | Pass | Member→admin and member→doctor returned 403. Cross-member profile and unassigned-doctor detail returned no data; no names, stages, or clinical metadata leaked |

## Authenticated fixtures used — 2026-07-20

Synthetic `@example.test` member, doctor, admin, invited member, invited doctor, and zero-assignment doctor fixtures were provisioned directly in staging. Credentials remain outside this document. The pass created one 36-marker lab order and one unreleased care-plan draft for the established synthetic member. No report or care plan was released, no user was deleted, and no personal-looking record was opened.

Current release recommendation: **No-go.** The staging-data provenance concern is resolved, but released clinical content must be made immutable and versioned. P1 failures in password validation, profile draft saving, Results counts, doctor workflow discoverability, production-parity security configuration, portal headers, and authenticated mobile layout must also pass retest before public access.

## Session script for moderated user testing

For each persona, ask the participant to think aloud and avoid teaching the interface unless they are completely blocked. Record completion, time, misclicks, uncertainty, unexpected language, and confidence after each task.

1. “You have just been invited to Verae. Get into your account and make it secure.”
2. “Tell Verae what brought you here and add an earlier lab report.”
3. “You need to check when your consultation is and how you will join.”
4. “Find the result that needs the most attention and explain what the page tells you.”
5. “Find the first action in your care plan and mark it complete.”
6. Doctor: “Prepare a panel for this member, review their results, and release a safe first care plan.”
7. Admin: “Invite a member, assign a doctor, schedule the consultation, import a report, and release it.”

After each task ask: “What did you expect to happen?”, “What, if anything, felt risky?”, and “How confident are you that the change was saved?”

## Defect record template

```text
ID / severity:
Persona / account fixture:
Environment / browser / viewport:
Precondition:
Steps:
Expected:
Actual:
Reproducibility:
Privacy or clinical impact:
Screenshot/video/request ID:
Owner / fix / retest result:
```
