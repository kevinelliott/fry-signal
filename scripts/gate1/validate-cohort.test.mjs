import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { validateCohort, validatePredeclarationTagObject, verifyCandidateCommit } from "./validate-cohort.mjs";

const execFile = promisify(execFileCallback);

const SHA = "0123456789abcdef0123456789abcdef01234567";

function session(index, overrides = {}) {
  const input = index < 4 ? "touch" : index < 8 ? "pointer" : "keyboard-only";
  return {
    studyId: `P${String(index + 1).padStart(2, "0")}`,
    status: "valid",
    candidateSha: SHA,
    fixtureVersion: 2,
    rulesVersion: 2,
    sessionDate: "2026-08-04",
    humanParticipant: true,
    implementationTeamMember: false,
    firstRun: true,
    priorExposure: false,
    consentToAnonymousNotes: true,
    quotePublicationConsent: "declined",
    viewportGroup: input === "touch" ? "compact" : "desktop",
    inputMethod: input,
    device: input === "touch" ? "Phone test device" : "Desktop test device",
    browser: "Chromium test version",
    viewport: input === "touch" ? "390x844" : "1440x960",
    reducedMotion: false,
    zoomPercent: 100,
    accommodation: "none requested",
    assistance: "none",
    assistLog: [],
    completion: "settled",
    rainDecision: "anticipated-pack-b",
    routeExplanation: "accurate",
    warningMeaningWithoutColor: true,
    boardRemainedVisible: true,
    maxMandatoryIdleSeconds: 0,
    firstConfusion: "none observed",
    coreJobResponse: "I shaped movement through the service board.",
    replayBehavior: index < 6 ? "unprompted-route-experiment" : "stopped",
    replayMotiveResponse: index < 6 ? "I wanted to try different switch timing." : null,
    coreJobCode: { facilitator: index < 8 ? "pass" : "fail", independentCoder: index < 8 ? "pass" : "fail", resolved: index < 8 ? "pass" : "fail" },
    replayCode: { facilitator: index < 6 ? "pass" : "fail", independentCoder: index < 6 ? "pass" : "fail", resolved: index < 6 ? "pass" : "fail" },
    criticalIssues: [],
    ...overrides,
  };
}

function cohort(size = 10) {
  return {
    candidate: {
      sha: SHA,
      worktreeState: "clean",
      fixtureId: "midnight-merge",
      fixtureVersion: 2,
      rulesVersion: 2,
      productionBuildCommand: "pnpm build",
      productionBuildPassed: true,
      browserVersion: "Chromium test version",
      networkBoundary: "loopback-only",
      facilitatorCode: "F01",
      independentCoderCode: "C01",
      adjudicatorCode: "A01",
      deletionOwnerCode: "F01",
      rawNotesLocationCode: "PRIVATE_STORE_01",
      rawNotesAccessCodes: ["F01", "C01"],
      cohortStartedOn: "2026-08-01",
      recruitmentClosesOn: "2026-08-08",
      codingReviewedOn: "2026-08-08",
      plannedValidSessions: size,
      rawNotesDeleteBy: "2026-09-07",
      predeclarationEvidence: `git-tag:${"a".repeat(40)}`,
      predeclarationAnchor: `buzz:${"c".repeat(64)}`,
      productionBuildEvidence: `local-sha256:${"b".repeat(64)}`,
      neutralReplayCopyConfirmed: true,
    },
    sessions: Array.from({ length: size }, (_, index) => session(index)),
  };
}

test("passes the minimum predeclared 8/6 cohort", () => {
  const result = validateCohort(cohort());
  assert.deepEqual(result.errors, []);
  assert.equal(result.disposition, "PASS");
  assert.match(result.report, /Core-job passes: 8\/10, 80\.0% \(required 8\)/u);
  assert.match(result.report, /Route-replay passes: 6\/10, 60\.0% \(required 6\)/u);
});

test("uses ceiling math for an eleven-person cohort", () => {
  const input = cohort(11);
  input.sessions[8].coreJobCode = { facilitator: "pass", independentCoder: "pass", resolved: "pass" };
  input.sessions[6].replayBehavior = "unprompted-route-experiment";
  input.sessions[6].replayMotiveResponse = "I wanted to test the other gate timing.";
  input.sessions[6].replayCode = { facilitator: "pass", independentCoder: "pass", resolved: "pass" };
  const result = validateCohort(input);
  assert.equal(result.disposition, "PASS");
  assert.match(result.report, /required 9/u);
  assert.match(result.report, /required 7/u);
});

test("rejects prompted replay from the numerator", () => {
  const input = cohort();
  input.sessions[0].replayBehavior = "prompted-replay";
  input.sessions[0].replayMotiveResponse = null;
  const result = validateCohort(input);
  assert.equal(result.disposition, "HOLD");
  assert.ok(result.errors.some((error) => error.includes("cannot pass replay")));
});

test("does not invent a motive response for a player who stopped", () => {
  const input = cohort();
  assert.equal(input.sessions[9].replayBehavior, "stopped");
  assert.equal(input.sessions[9].replayMotiveResponse, null);
  const result = validateCohort(input);
  assert.deepEqual(result.errors, []);
});

test("rejects an invented resolution that neither human coder assigned", () => {
  const input = cohort();
  input.sessions[0].coreJobCode = { facilitator: "fail", independentCoder: "fail", resolved: "pass" };
  const result = validateCohort(input);
  assert.equal(result.disposition, "HOLD");
  assert.ok(result.errors.some((error) => error.includes("unanimous human code")));
});

test("requires predeclared adjudication details when the two human coders disagree", () => {
  const input = cohort();
  input.sessions[0].coreJobCode = {
    facilitator: "pass",
    independentCoder: "fail",
    adjudicator: "pass",
    resolved: "pass",
    resolutionBasis: "written-rule-pass",
  };
  const result = validateCohort(input);
  assert.deepEqual(result.errors, []);
  assert.match(result.report, /P01 core job → pass/u);
});

test("fails closed on mixed candidates, duplicate IDs, and insufficient device coverage", () => {
  const input = cohort();
  input.sessions[0].candidateSha = "f".repeat(40);
  input.sessions[1].studyId = input.sessions[0].studyId;
  for (const entry of input.sessions) {
    entry.viewportGroup = "desktop";
    entry.inputMethod = "pointer";
  }
  const result = validateCohort(input);
  assert.equal(result.disposition, "HOLD");
  assert.ok(result.errors.some((error) => error.includes("does not match")));
  assert.ok(result.errors.some((error) => error.includes("duplicated")));
  assert.ok(result.errors.some((error) => error.includes("compact touch")));
});

test("keeps valid usability failures in the denominator and unresolved critical issues on hold", () => {
  const input = cohort();
  input.sessions[0].completion = "blocked-by-usability";
  input.sessions[0].coreJobCode = { facilitator: "fail", independentCoder: "fail", resolved: "fail" };
  input.sessions[0].replayBehavior = "stopped";
  input.sessions[0].replayMotiveResponse = null;
  input.sessions[0].replayCode = { facilitator: "fail", independentCoder: "fail", resolved: "fail" };
  input.sessions[0].criticalIssues = [{ category: "accessibility", resolved: false, note: "The interface prevented completion." }];
  const result = validateCohort(input);
  assert.deepEqual(result.errors, []);
  assert.equal(result.disposition, "HOLD");
  assert.match(result.report, /Valid n \/ withdrawals \/ technical aborts: 10 \/ 0 \/ 0/u);
  assert.match(result.report, /Unresolved critical issues: 1/u);
});

test("rejects an abort exclusion without unanimous human agreement", () => {
  const input = cohort();
  input.sessions.push({
    studyId: "P11",
    status: "technical-abort",
    candidateSha: SHA,
    fixtureVersion: 2,
    rulesVersion: 2,
    sessionDate: "2026-08-05",
    criticalIssues: [],
    abortReason: "wrong-build",
    abortDetails: "The facilitator opened a stale build before control was handed over.",
    abortCode: {
      facilitator: "abort",
      independentCoder: "not-abort",
      adjudicator: "abort",
      resolved: "abort",
      resolutionBasis: "written-rule-abort",
    },
  });
  const result = validateCohort(input);
  assert.equal(result.disposition, "HOLD");
  assert.ok(result.errors.some((error) => error.includes("agreement to exclude")));
});

test("parses the annotated predeclaration tag structurally and rejects ambiguity", () => {
  const candidate = cohort().candidate;
  const declarations = [
    `planned-valid-sessions: ${candidate.plannedValidSessions}`,
    `cohort-started-on: ${candidate.cohortStartedOn}`,
    `recruitment-closes-on: ${candidate.recruitmentClosesOn}`,
    `facilitator-code: ${candidate.facilitatorCode}`,
    `independent-coder-code: ${candidate.independentCoderCode}`,
    `adjudicator-code: ${candidate.adjudicatorCode}`,
    `deletion-owner-code: ${candidate.deletionOwnerCode}`,
  ];
  const tag = `object ${candidate.sha}\ntype commit\ntag gate1-test\ntagger Test <test@example.com> 0 +0000\n\n${declarations.join("\n")}\n`;
  assert.deepEqual(validatePredeclarationTagObject(tag, candidate), []);

  const wrongTarget = tag.replace(`object ${candidate.sha}`, `object ${"f".repeat(40)}`) + `\nobject ${candidate.sha}`;
  assert.ok(validatePredeclarationTagObject(wrongTarget, candidate).some((error) => error.includes("exact candidate")));

  const duplicate = tag.replace(declarations[0], `${declarations[0]}\nplanned-valid-sessions: 100`);
  assert.ok(validatePredeclarationTagObject(duplicate, candidate).some((error) => error.includes("exactly one planned-valid-sessions")));

  const prefixCollision = tag.replace(declarations[0], "planned-valid-sessions: 100");
  assert.ok(validatePredeclarationTagObject(prefixCollision, candidate).some((error) => error.includes("exactly one planned-valid-sessions")));
});

test("verifies clean exact HEAD and annotated tag objects in a temporary Git repository", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "fry-signal-gate1-"));
  context.after(async () => rm(directory, { recursive: true, force: true }));
  const git = (args) => execFile("git", args, { cwd: directory });
  await git(["init", "--quiet"]);
  await git(["config", "user.name", "Gate Test"]);
  await git(["config", "user.email", "gate-test@example.invalid"]);
  await writeFile(join(directory, "base.txt"), "base\n");
  await git(["add", "base.txt"]);
  await git(["commit", "--quiet", "-m", "base"]);
  const { stdout: baseStdout } = await git(["rev-parse", "HEAD"]);
  const baseSha = baseStdout.trim();

  await mkdir(join(directory, "packages/domain/src"), { recursive: true });
  await mkdir(join(directory, "apps/web/app"), { recursive: true });
  await writeFile(join(directory, "packages/domain/src/fixture.ts"), 'export const fixture = { id: "midnight-merge", version: 2, rulesVersion: 2 };\n');
  await writeFile(join(directory, "apps/web/app/page.tsx"), '<section><div className="shift-postcard">Midnight Merge complete</div></section>\n');
  await git(["add", "packages/domain/src/fixture.ts", "apps/web/app/page.tsx"]);
  await git(["commit", "--quiet", "-m", "candidate"]);
  const { stdout: candidateStdout } = await git(["rev-parse", "HEAD"]);
  const candidate = { ...cohort().candidate, sha: candidateStdout.trim() };
  const tagMessage = [
    `planned-valid-sessions: ${candidate.plannedValidSessions}`,
    `cohort-started-on: ${candidate.cohortStartedOn}`,
    `recruitment-closes-on: ${candidate.recruitmentClosesOn}`,
    `facilitator-code: ${candidate.facilitatorCode}`,
    `independent-coder-code: ${candidate.independentCoderCode}`,
    `adjudicator-code: ${candidate.adjudicatorCode}`,
    `deletion-owner-code: ${candidate.deletionOwnerCode}`,
  ].join("\n");
  await git(["tag", "-a", "gate1-valid", "-m", tagMessage, candidate.sha]);
  const { stdout: tagStdout } = await git(["rev-parse", "refs/tags/gate1-valid"]);
  candidate.predeclarationEvidence = `git-tag:${tagStdout.trim()}`;
  assert.deepEqual(await verifyCandidateCommit(candidate, directory), []);

  await writeFile(join(directory, "dirty.txt"), "dirty\n");
  assert.ok((await verifyCandidateCommit(candidate, directory)).some((error) => error.includes("not clean")));
  await rm(join(directory, "dirty.txt"));

  await git(["tag", "-a", "gate1-wrong-target", "-m", tagMessage, baseSha]);
  const { stdout: wrongTagStdout } = await git(["rev-parse", "refs/tags/gate1-wrong-target"]);
  const wrongTarget = { ...candidate, predeclarationEvidence: `git-tag:${wrongTagStdout.trim()}` };
  assert.ok((await verifyCandidateCommit(wrongTarget, directory)).some((error) => error.includes("exact candidate")));

  const missingTag = { ...candidate, predeclarationEvidence: `git-tag:${"f".repeat(40)}` };
  assert.ok((await verifyCandidateCommit(missingTag, directory)).some((error) => error.includes("could not be verified")));
});

test("rejects unknown or misspelled critical issue categories", () => {
  const input = cohort();
  input.sessions[0].criticalIssues = [{ category: "route_truth", resolved: false, note: "Route outcome was unclear." }];
  const result = validateCohort(input);
  assert.equal(result.disposition, "HOLD");
  assert.ok(result.errors.some((error) => error.includes("category is invalid")));
});

test("forces a usability-blocked participant to remain as two scored failures", () => {
  const input = cohort();
  input.sessions[8].completion = "blocked-by-usability";
  const result = validateCohort(input);
  assert.equal(result.disposition, "HOLD");
  assert.ok(result.errors.some((error) => error.includes("requires an unresolved accessibility or other critical issue")));
});

test("requires non-color and board failures to become explicit unresolved blockers", () => {
  const input = cohort();
  input.sessions[8].warningMeaningWithoutColor = false;
  input.sessions[9].boardRemainedVisible = false;
  const missing = validateCohort(input);
  assert.ok(missing.errors.some((error) => error.includes("non-color warning")));
  assert.ok(missing.errors.some((error) => error.includes("hidden board")));

  input.sessions[8].criticalIssues = [{ category: "route-truth", resolved: false, note: "The warning relied on color." }];
  input.sessions[9].criticalIssues = [{ category: "accessibility", resolved: false, note: "The board disappeared behind the sheet." }];
  const recorded = validateCohort(input);
  assert.deepEqual(recorded.errors, []);
  assert.equal(recorded.disposition, "HOLD");
});
