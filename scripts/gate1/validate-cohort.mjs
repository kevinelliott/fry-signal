import { readFile } from "node:fs/promises";
import { execFile as execFileCallback } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const CORE_CODES = new Set(["pass", "fail"]);
const REPLAY_CODES = new Set(["pass", "fail"]);
const VALID_STATUSES = new Set(["valid", "withdrawn", "technical-abort"]);
const COMPLETIONS = new Set(["settled", "stopped-by-participant", "blocked-by-usability"]);
const RAIN_DECISIONS = new Set(["anticipated-pack-b", "missed-then-recovered", "missed-remained-blocked", "not-reached"]);
const ROUTE_EXPLANATIONS = new Set(["accurate", "partial", "incorrect", "not-offered"]);
const REPLAY_BEHAVIORS = new Set(["unprompted-route-experiment", "other-replay", "prompted-replay", "stopped"]);
const VALID_ASSISTANCE = new Set(["none", "mechanical"]);
const ABORT_REASONS = new Set(["wrong-build", "crash", "corrupted-fixture", "facilitator-protocol-violation", "network-boundary-violation"]);
const ISSUE_CATEGORIES = new Set([
  "route-truth",
  "terminal-recovery",
  "accessibility",
  "trust-economy",
  "data-loss",
  "other",
]);

function requireValue(condition, message, errors) {
  if (!condition) errors.push(message);
}

function validateIndependentCode(value, allowed, path, errors) {
  requireValue(value && typeof value === "object", `${path} must be an object`, errors);
  if (!value || typeof value !== "object") return;
  requireValue(allowed.has(value.facilitator), `${path}.facilitator is invalid`, errors);
  requireValue(allowed.has(value.independentCoder), `${path}.independentCoder is invalid`, errors);
  requireValue(allowed.has(value.resolved), `${path}.resolved is invalid`, errors);
  if (value.facilitator === value.independentCoder) {
    requireValue(value.resolved === value.facilitator, `${path}.resolved must retain the unanimous human code`, errors);
  } else {
    requireValue(allowed.has(value.adjudicator), `${path}.adjudicator is required for disagreement`, errors);
    requireValue(value.resolved === value.adjudicator, `${path}.resolved must match the adjudicator code`, errors);
    requireValue(value.resolutionBasis === `written-rule-${value.resolved}`, `${path}.resolutionBasis must match the adjudicated written-rule result`, errors);
  }
}

function hasRecordedText(value) {
  return typeof value === "string" && value.trim().length > 0 && !/^(?:REPLACE(?:_|$)|PRIVATE_RAW_RESPONSE$)/u.test(value.trim());
}

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isImmutableEvidence(value) {
  return typeof value === "string" && /^git-tag:[0-9a-f]{40}$/u.test(value);
}

function isBuzzAnchor(value) {
  return typeof value === "string" && /^buzz:[0-9a-f]{64}$/u.test(value);
}

function isBuildEvidence(value) {
  return typeof value === "string" && /^(?:github-actions:https:\/\/github\.com\/[^\s]+\/actions\/runs\/[0-9]+|local-sha256:[0-9a-f]{64})$/u.test(value);
}

function addUtcDays(value, days) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function validatePredeclarationTagObject(tagObject, candidate) {
  const errors = [];
  const separator = tagObject.indexOf("\n\n");
  if (separator < 0) return ["predeclaration tag object is malformed"];
  const headers = tagObject.slice(0, separator).split(/\r?\n/u);
  const messageLines = tagObject.slice(separator + 2).split(/\r?\n/u);
  const objectHeaders = headers.filter((line) => line.startsWith("object "));
  const typeHeaders = headers.filter((line) => line.startsWith("type "));
  requireValue(objectHeaders.length === 1 && objectHeaders[0] === `object ${candidate.sha}`, "predeclaration tag must target the exact candidate commit", errors);
  requireValue(typeHeaders.length === 1 && typeHeaders[0] === "type commit", "predeclaration tag must target a commit", errors);
  const declarations = [
    ["planned-valid-sessions", String(candidate.plannedValidSessions)],
    ["cohort-started-on", candidate.cohortStartedOn],
    ["recruitment-closes-on", candidate.recruitmentClosesOn],
    ["facilitator-code", candidate.facilitatorCode],
    ["independent-coder-code", candidate.independentCoderCode],
    ["adjudicator-code", candidate.adjudicatorCode],
    ["deletion-owner-code", candidate.deletionOwnerCode],
  ];
  for (const [key, expected] of declarations) {
    const matches = messageLines.filter((line) => line.startsWith(`${key}:`));
    requireValue(matches.length === 1 && matches[0] === `${key}: ${expected}`, `predeclaration tag must contain exactly one ${key}: ${expected}`, errors);
  }
  return errors;
}

export async function verifyCandidateCommit(candidate, cwd = process.cwd()) {
  const errors = [];
  if (!candidate || !/^[0-9a-f]{40}$/u.test(candidate.sha ?? "")) return errors;
  const git = (args, maxBuffer = 1024 * 1024) => execFile("git", args, { cwd, maxBuffer });
  try {
    const [{ stdout: head }, { stdout: status }] = await Promise.all([
      git(["rev-parse", "HEAD"]),
      git(["status", "--porcelain=v1"]),
    ]);
    if (head.trim() !== candidate.sha) errors.push("validator must run from the exact candidate commit");
    if (status.trim().length > 0) errors.push("candidate worktree is not clean");
    await git(["cat-file", "-e", `${candidate.sha}^{commit}`]);
    const [{ stdout: fixture }, { stdout: page }] = await Promise.all([
      git(["show", `${candidate.sha}:packages/domain/src/fixture.ts`]),
      git(["show", `${candidate.sha}:apps/web/app/page.tsx`], 4 * 1024 * 1024),
    ]);
    if (!fixture.includes('id: "midnight-merge"') || !fixture.includes(`version: ${candidate.fixtureVersion}`) || !fixture.includes(`rulesVersion: ${candidate.rulesVersion}`)) {
      errors.push("candidate fixture identity or version does not match the Git commit");
    }
    const postcardStart = page.indexOf('className="shift-postcard"');
    const postcardEnd = page.indexOf("</section>", postcardStart);
    const postcard = postcardStart >= 0 && postcardEnd > postcardStart ? page.slice(postcardStart, postcardEnd) : "";
    if (!postcard.includes("Midnight Merge complete") || /route|gate|crossover|switch|recovery|batch|score|reward/iu.test(postcard)) {
      errors.push("candidate replay postcard is missing or contains a priming motive");
    }
    const tagObjectId = candidate.predeclarationEvidence?.slice("git-tag:".length);
    if (tagObjectId) {
      const [{ stdout: tagType }, { stdout: tagObject }] = await Promise.all([
        git(["cat-file", "-t", tagObjectId]),
        git(["cat-file", "-p", tagObjectId]),
      ]);
      if (tagType.trim() !== "tag") errors.push("predeclaration evidence must be an annotated Git tag object");
      errors.push(...validatePredeclarationTagObject(tagObject, candidate));
    }
  } catch (error) {
    errors.push(`candidate commit could not be verified in Git: ${error.message}`);
  }
  return errors;
}

function countDisagreements(sessions, key) {
  return sessions.filter((session) => {
    const code = session[key];
    return code?.facilitator !== code?.independentCoder;
  }).length;
}

function hasUnresolvedIssue(session, categories) {
  return Array.isArray(session.criticalIssues) && session.criticalIssues.some((issue) => categories.includes(issue.category) && issue.resolved === false);
}

export function validateCohort(cohort) {
  const errors = [];
  const candidate = cohort?.candidate;
  const sessions = Array.isArray(cohort?.sessions) ? cohort.sessions : [];

  requireValue(candidate && typeof candidate === "object", "candidate is required", errors);
  if (candidate) {
    requireValue(/^[0-9a-f]{40}$/u.test(candidate.sha ?? ""), "candidate.sha must be a full lowercase commit SHA", errors);
    requireValue(candidate.worktreeState === "clean", "candidate.worktreeState must be clean", errors);
    requireValue(candidate.fixtureId === "midnight-merge", "candidate.fixtureId must be midnight-merge", errors);
    requireValue(candidate.fixtureVersion === 2, "candidate.fixtureVersion must be 2", errors);
    requireValue(candidate.rulesVersion === 2, "candidate.rulesVersion must be 2", errors);
    requireValue(candidate.productionBuildPassed === true, "candidate production build must have passed", errors);
    requireValue(candidate.networkBoundary === "loopback-only", "candidate.networkBoundary must be loopback-only", errors);
    requireValue(candidate.neutralReplayCopyConfirmed === true, "neutral replay copy must be confirmed", errors);
    requireValue(Number.isInteger(candidate.plannedValidSessions) && candidate.plannedValidSessions >= 10, "candidate.plannedValidSessions must be at least 10", errors);
    for (const field of ["productionBuildCommand", "browserVersion", "facilitatorCode", "independentCoderCode", "adjudicatorCode", "deletionOwnerCode", "rawNotesLocationCode", "cohortStartedOn", "recruitmentClosesOn", "codingReviewedOn", "rawNotesDeleteBy"]) {
      requireValue(hasRecordedText(candidate[field]), `candidate.${field} is required`, errors);
    }
    requireValue(new Set([candidate.facilitatorCode, candidate.independentCoderCode, candidate.adjudicatorCode]).size === 3, "facilitator, independent coder, and adjudicator must be different people", errors);
    requireValue([candidate.facilitatorCode, candidate.independentCoderCode].includes(candidate.deletionOwnerCode), "deletion owner must be the facilitator or independent coder", errors);
    requireValue(Array.isArray(candidate.rawNotesAccessCodes) && candidate.rawNotesAccessCodes.length === 2 && candidate.rawNotesAccessCodes.includes(candidate.facilitatorCode) && candidate.rawNotesAccessCodes.includes(candidate.independentCoderCode), "raw-note access must be limited to facilitator and independent coder", errors);
    requireValue(isImmutableEvidence(candidate.predeclarationEvidence), "candidate.predeclarationEvidence must be an annotated Git tag object ID", errors);
    requireValue(isBuzzAnchor(candidate.predeclarationAnchor), "candidate.predeclarationAnchor must be a signed Buzz event ID", errors);
    requireValue(isBuildEvidence(candidate.productionBuildEvidence), "candidate.productionBuildEvidence must be a GitHub Actions run or local SHA-256", errors);
    for (const field of ["cohortStartedOn", "recruitmentClosesOn", "codingReviewedOn", "rawNotesDeleteBy"]) {
      requireValue(isIsoDate(candidate[field]), `candidate.${field} must be an ISO date`, errors);
    }
    if (isIsoDate(candidate.cohortStartedOn) && isIsoDate(candidate.recruitmentClosesOn) && isIsoDate(candidate.codingReviewedOn) && isIsoDate(candidate.rawNotesDeleteBy)) {
      requireValue(candidate.cohortStartedOn <= candidate.recruitmentClosesOn, "cohort start must be on or before recruitment close", errors);
      requireValue(candidate.recruitmentClosesOn <= candidate.codingReviewedOn, "coding review must be on or after recruitment closes", errors);
      requireValue(candidate.codingReviewedOn <= candidate.rawNotesDeleteBy, "raw-note deletion must be on or after coding review", errors);
      requireValue(candidate.rawNotesDeleteBy <= addUtcDays(candidate.codingReviewedOn, 30), "raw notes must be deleted within 30 days of coding review", errors);
    }
  }

  requireValue(Array.isArray(cohort?.sessions), "sessions must be an array", errors);
  const ids = new Set();
  for (const [index, session] of sessions.entries()) {
    const path = `sessions[${index}]`;
    requireValue(/^P[0-9]{2,}$/u.test(session.studyId ?? ""), `${path}.studyId must use an anonymous P-number`, errors);
    requireValue(!ids.has(session.studyId), `${path}.studyId is duplicated`, errors);
    ids.add(session.studyId);
    requireValue(VALID_STATUSES.has(session.status), `${path}.status is invalid`, errors);
    requireValue(session.candidateSha === candidate?.sha, `${path}.candidateSha does not match the candidate`, errors);
    requireValue(session.fixtureVersion === candidate?.fixtureVersion, `${path}.fixtureVersion does not match the candidate`, errors);
    requireValue(session.rulesVersion === candidate?.rulesVersion, `${path}.rulesVersion does not match the candidate`, errors);
    requireValue(isIsoDate(session.sessionDate), `${path}.sessionDate must be an ISO date`, errors);
    if (candidate && isIsoDate(session.sessionDate) && isIsoDate(candidate.cohortStartedOn) && isIsoDate(candidate.recruitmentClosesOn)) {
      requireValue(session.sessionDate >= candidate.cohortStartedOn && session.sessionDate <= candidate.recruitmentClosesOn, `${path}.sessionDate is outside the frozen recruitment window`, errors);
    }

    if (session.status !== "withdrawn") {
      requireValue(Array.isArray(session.criticalIssues), `${path}.criticalIssues must be an array`, errors);
      if (Array.isArray(session.criticalIssues)) {
        for (const [issueIndex, issue] of session.criticalIssues.entries()) {
          const issuePath = `${path}.criticalIssues[${issueIndex}]`;
          requireValue(issue && typeof issue === "object", `${issuePath} must be an object`, errors);
          if (!issue || typeof issue !== "object") continue;
          requireValue(ISSUE_CATEGORIES.has(issue.category), `${issuePath}.category is invalid`, errors);
          requireValue(typeof issue.resolved === "boolean", `${issuePath}.resolved must be boolean`, errors);
          requireValue(hasRecordedText(issue.note), `${issuePath}.note is required`, errors);
        }
      }
    }

    if (session.status === "valid") {
      requireValue(session.humanParticipant === true, `${path} must attest a human participant`, errors);
      requireValue(session.implementationTeamMember === false, `${path} cannot be an implementation-team session`, errors);
      requireValue(session.firstRun === true && session.priorExposure === false, `${path} must be a true first run without prior exposure`, errors);
      requireValue(session.consentToAnonymousNotes === true, `${path} requires consent to anonymous notes`, errors);
      requireValue(["compact", "desktop"].includes(session.viewportGroup), `${path}.viewportGroup is invalid`, errors);
      requireValue(["touch", "pointer", "keyboard-only"].includes(session.inputMethod), `${path}.inputMethod is invalid`, errors);
      for (const field of ["device", "browser", "viewport", "accommodation", "firstConfusion"]) {
        requireValue(hasRecordedText(session[field]), `${path}.${field} is required`, errors);
      }
      requireValue(typeof session.reducedMotion === "boolean", `${path}.reducedMotion must be boolean`, errors);
      requireValue(Number.isFinite(session.zoomPercent) && session.zoomPercent > 0, `${path}.zoomPercent is invalid`, errors);
      requireValue(COMPLETIONS.has(session.completion), `${path}.completion is invalid`, errors);
      requireValue(RAIN_DECISIONS.has(session.rainDecision), `${path}.rainDecision is invalid`, errors);
      requireValue(ROUTE_EXPLANATIONS.has(session.routeExplanation), `${path}.routeExplanation is invalid`, errors);
      requireValue(REPLAY_BEHAVIORS.has(session.replayBehavior), `${path}.replayBehavior is invalid`, errors);
      requireValue(typeof session.warningMeaningWithoutColor === "boolean", `${path}.warningMeaningWithoutColor must be boolean`, errors);
      requireValue(typeof session.boardRemainedVisible === "boolean", `${path}.boardRemainedVisible must be boolean`, errors);
      requireValue(Number.isFinite(session.maxMandatoryIdleSeconds) && session.maxMandatoryIdleSeconds >= 0, `${path}.maxMandatoryIdleSeconds is invalid`, errors);
      requireValue(Array.isArray(session.assistLog), `${path}.assistLog must be an array`, errors);
      requireValue(VALID_ASSISTANCE.has(session.assistance), `${path}.assistance is invalid; a strategic protocol violation must be a technical abort`, errors);
      if (Array.isArray(session.assistLog)) {
        for (const [assistIndex, assist] of session.assistLog.entries()) {
          const assistPath = `${path}.assistLog[${assistIndex}]`;
          requireValue(assist && typeof assist === "object", `${assistPath} must be an object`, errors);
          if (!assist || typeof assist !== "object") continue;
          requireValue(Number.isFinite(assist.tick) && assist.tick >= 0, `${assistPath}.tick is invalid`, errors);
          requireValue(assist.kind === "mechanical", `${assistPath}.kind must be mechanical`, errors);
          requireValue(hasRecordedText(assist.prompt), `${assistPath}.prompt is required`, errors);
        }
        requireValue(session.assistance === "mechanical" ? session.assistLog.length > 0 : session.assistLog.length === 0, `${path}.assistance and assistLog disagree`, errors);
      }
      requireValue(hasRecordedText(session.coreJobResponse), `${path}.coreJobResponse is required in the private worksheet`, errors);
      if (["unprompted-route-experiment", "other-replay"].includes(session.replayBehavior)) {
        requireValue(hasRecordedText(session.replayMotiveResponse), `${path}.replayMotiveResponse is required after an actual replay`, errors);
      } else {
        requireValue(session.replayMotiveResponse == null, `${path}.replayMotiveResponse must be null when no scored replay-motive prompt was asked`, errors);
      }
      requireValue(["granted", "declined"].includes(session.quotePublicationConsent), `${path}.quotePublicationConsent is invalid`, errors);
      validateIndependentCode(session.coreJobCode, CORE_CODES, `${path}.coreJobCode`, errors);
      validateIndependentCode(session.replayCode, REPLAY_CODES, `${path}.replayCode`, errors);
      if (session.replayCode?.resolved === "pass") {
        requireValue(session.replayBehavior === "unprompted-route-experiment", `${path} cannot pass replay without an unprompted route experiment`, errors);
      }
      if (session.completion === "blocked-by-usability") {
        requireValue(session.coreJobCode?.resolved === "fail" && session.replayCode?.resolved === "fail", `${path} blocked-by-usability must count both scored measures as failures`, errors);
        requireValue(hasUnresolvedIssue(session, ["accessibility", "other"]), `${path} blocked-by-usability requires an unresolved accessibility or other critical issue`, errors);
      }
      if (session.warningMeaningWithoutColor === false) {
        requireValue(hasUnresolvedIssue(session, ["accessibility", "route-truth"]), `${path} missing non-color warning meaning requires an unresolved accessibility or route-truth issue`, errors);
      }
      if (session.boardRemainedVisible === false) {
        requireValue(hasUnresolvedIssue(session, ["accessibility", "other"]), `${path} hidden board requires an unresolved accessibility or other critical issue`, errors);
      }
    }

    if (session.status === "technical-abort") {
      requireValue(ABORT_REASONS.has(session.abortReason), `${path}.abortReason is invalid`, errors);
      requireValue(hasRecordedText(session.abortDetails), `${path}.abortDetails is required`, errors);
      validateIndependentCode(session.abortCode, new Set(["abort", "not-abort"]), `${path}.abortCode`, errors);
      requireValue(session.abortCode?.facilitator === "abort" && session.abortCode?.independentCoder === "abort" && session.abortCode?.resolved === "abort", `${path} requires facilitator and independent-coder agreement to exclude as an abort`, errors);
    }

    if (session.status === "withdrawn") {
      const allowedWithdrawalFields = new Set(["studyId", "status", "candidateSha", "fixtureVersion", "rulesVersion", "sessionDate"]);
      requireValue(Object.keys(session).every((key) => allowedWithdrawalFields.has(key)), `${path} withdrew; retain only the minimal withdrawal record`, errors);
    }
  }

  const valid = sessions.filter((session) => session.status === "valid");
  if (candidate) {
    requireValue(valid.length === candidate.plannedValidSessions, `valid session count ${valid.length} does not match the predeclared target ${candidate.plannedValidSessions}`, errors);
  }
  requireValue(valid.filter((session) => session.viewportGroup === "compact" && session.inputMethod === "touch").length >= 4, "cohort requires at least four compact touch sessions", errors);
  requireValue(valid.filter((session) => session.viewportGroup === "desktop" && session.inputMethod === "pointer").length >= 4, "cohort requires at least four desktop pointer sessions", errors);
  requireValue(valid.filter((session) => session.inputMethod === "keyboard-only").length >= 2, "cohort requires at least two keyboard-only sessions", errors);

  const corePasses = valid.filter((session) => session.coreJobCode?.resolved === "pass").length;
  const replayPasses = valid.filter((session) => session.replayCode?.resolved === "pass").length;
  const coreRequired = Math.ceil(valid.length * 0.8);
  const replayRequired = Math.ceil(valid.length * 0.6);
  const unresolvedCritical = sessions.flatMap((session) => Array.isArray(session.criticalIssues) ? session.criticalIssues : []).filter((issue) => ISSUE_CATEGORIES.has(issue.category) && issue.resolved !== true);
  const idleViolations = valid.filter((session) => session.maxMandatoryIdleSeconds > 5).length;
  const disposition = errors.length === 0 && corePasses >= coreRequired && replayPasses >= replayRequired && unresolvedCritical.length === 0 && idleViolations === 0 ? "PASS" : "HOLD";

  const disagreementLines = valid.flatMap((session) => [
    ...(session.coreJobCode?.facilitator !== session.coreJobCode?.independentCoder ? [`- ${session.studyId} core job → ${session.coreJobCode.resolved}: ${session.coreJobCode.resolutionBasis}`] : []),
    ...(session.replayCode?.facilitator !== session.replayCode?.independentCoder ? [`- ${session.studyId} replay → ${session.replayCode.resolved}: ${session.replayCode.resolutionBasis}`] : []),
  ]);
  const abortLines = sessions.filter((session) => session.status === "technical-abort").map((session) => `- ${session.studyId}: ${session.abortReason}; facilitator ${session.abortCode?.facilitator}; coder ${session.abortCode?.independentCoder}`);
  const percentage = (count) => valid.length === 0 ? "0.0%" : `${((count / valid.length) * 100).toFixed(1)}%`;
  const report = [
    "# Gate 1 Cohort Report",
    "",
    `Candidate SHA: ${candidate?.sha ?? "invalid"}`,
    `Fixture/rules version: ${candidate?.fixtureVersion ?? "?"}/${candidate?.rulesVersion ?? "?"}`,
    `Worktree state: ${candidate?.worktreeState ?? "unknown"}`,
    `Production-build evidence: ${candidate?.productionBuildPassed ? "passed" : "not passed"} — ${candidate?.productionBuildCommand ?? "missing"}`,
    `Network boundary: ${candidate?.networkBoundary ?? "missing"}`,
    `Production-build evidence reference: ${candidate?.productionBuildEvidence ?? "missing"}`,
    `Predeclaration evidence: ${candidate?.predeclarationEvidence ?? "missing"}`,
    `Predeclaration timestamp anchor: ${candidate?.predeclarationAnchor ?? "missing"}`,
    `Cohort dates: ${candidate?.cohortStartedOn ?? "missing"} through ${candidate?.recruitmentClosesOn ?? "missing"}`,
    `Coding reviewed on: ${candidate?.codingReviewedOn ?? "missing"}`,
    `Valid n / withdrawals / technical aborts: ${valid.length} / ${sessions.filter((session) => session.status === "withdrawn").length} / ${sessions.filter((session) => session.status === "technical-abort").length}`,
    `Compact touch / desktop pointer / keyboard-only: ${valid.filter((session) => session.viewportGroup === "compact" && session.inputMethod === "touch").length} / ${valid.filter((session) => session.viewportGroup === "desktop" && session.inputMethod === "pointer").length} / ${valid.filter((session) => session.inputMethod === "keyboard-only").length}`,
    `Core-job passes: ${corePasses}/${valid.length}, ${percentage(corePasses)} (required ${coreRequired})`,
    `Route-replay passes: ${replayPasses}/${valid.length}, ${percentage(replayPasses)} (required ${replayRequired})`,
    `Coder disagreements: core job ${countDisagreements(valid, "coreJobCode")}; replay ${countDisagreements(valid, "replayCode")}`,
    `Unresolved critical issues: ${unresolvedCritical.length}`,
    `Mandatory-idle violations over five seconds: ${idleViolations}`,
    `Raw-note deletion due: ${candidate?.rawNotesDeleteBy ?? "missing"}`,
    `Raw-note storage / deletion owner: ${candidate?.rawNotesLocationCode ?? "missing"} / ${candidate?.deletionOwnerCode ?? "missing"}`,
    `Disposition: ${disposition}`,
    "",
    "## Disagreement resolutions",
    "",
    ...(disagreementLines.length > 0 ? disagreementLines : ["None."]),
    "",
    "## Technical aborts",
    "",
    ...(abortLines.length > 0 ? abortLines : ["None."]),
    "",
    "This report contains aggregate codes only. Raw responses, recruiter linkage, and unconsented verbatim quotes remain outside the repository. Human signers must verify the external production-build evidence reference before publication.",
  ].join("\n");

  return { disposition, errors, report };
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: pnpm gate1:validate -- <private-cohort.json>");
    process.exitCode = 1;
    return;
  }
  const cohort = JSON.parse(await readFile(inputPath, "utf8"));
  const result = validateCohort(cohort);
  result.errors.push(...(await verifyCandidateCommit(cohort?.candidate)));
  if (result.errors.length > 0) result.disposition = "HOLD";
  if (result.errors.length > 0) {
    console.error(result.errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(result.report);
  if (result.disposition !== "PASS") process.exitCode = 2;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
