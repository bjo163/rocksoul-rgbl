import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TEXT_EPISTEMIC_GUARDS,
  nextTextState,
  parseTextResearchState,
  rankTextResearch,
  textRpsV1,
  textWipPressure,
} from './research-steward.js';

test('TEXT progression ranks inspected witness work ahead of discovery', () => {
  const ranked = rankTextResearch([
    { id: 2, state: 'discovered', noveltyValue: 20 },
    { id: 1, state: 'source_inspected', witnessInspected: true, evidenceGain: 10 },
  ]);
  assert.equal(ranked[0].id, 1);
});

test('rankTextResearch preserves caller-specific metadata', () => {
  const ranked = rankTextResearch([
    {
      id: 1,
      state: 'source_inspected' as const,
      issue: {
        number: 42,
        title: 'Example TEXT research issue',
      },
    },
  ]);

  assert.equal(ranked[0].issue.number, 42);
  assert.equal(ranked[0].issue.title, 'Example TEXT research issue');
  assert.equal(typeof ranked[0].rps, 'number');
});

test('TEXT only advances when witness provenance and ownership gates are explicit', () => {
  assert.equal(nextTextState({
    id: 1,
    state: 'source_inspected',
    witnessInspected: true,
    exactTextIdentityPreserved: true,
    ownershipBoundaryPreserved: true,
  }), 'ready_for_observation');
  assert.equal(nextTextState({
    id: 2,
    state: 'source_inspected',
    witnessInspected: true,
    exactTextIdentityPreserved: false,
    ownershipBoundaryPreserved: true,
  }), 'source_inspected');
});

test('TEXT epistemic guards keep PERSON identity and translation distinct', () => {
  assert.equal(TEXT_EPISTEMIC_GUARDS.exactWitnessProvenanceRequired, true);
  assert.equal(TEXT_EPISTEMIC_GUARDS.textualPersonLabelDoesNotResolvePerson, true);
  assert.equal(TEXT_EPISTEMIC_GUARDS.translationIsNotIdenticalToSourceWitness, true);
  assert.equal(TEXT_EPISTEMIC_GUARDS.personReasoningMustRemainForeignToTextPass, true);
});

test('hard TEXT WIP pressure penalizes routine discovery', () => {
  const items = Array.from({ length: 16 }, (_, index) => ({ id: index, state: 'discovered' as const }));
  const pressure = textWipPressure(items);
  assert.equal(pressure.suppressDiscovery, true);
  assert.ok(
    textRpsV1({ id: 'progress', state: 'source_inspected', evidenceGain: 10 }, pressure)
      > textRpsV1({ id: 'discover', state: 'discovered', noveltyValue: 20 }, pressure),
  );
});

test('terminal TEXT lifecycle states parse without becoming actionable WIP', () => {
  for (const state of ['canonicalized', 'merged', 'rejected'] as const) {
    assert.equal(parseTextResearchState(`ROCKSOUL-RESEARCH-STATE:${state}`), state);
    assert.equal(nextTextState({ id: state, state }), state);
    assert.equal(textRpsV1({ id: state, state }), 0);
  }
  const items = [
    { id: 1, state: 'source_inspected' as const, witnessInspected: true },
    { id: 2, state: 'canonicalized' as const },
    { id: 3, state: 'merged' as const },
    { id: 4, state: 'rejected' as const },
  ];
  assert.equal(textWipPressure(items).actionable, 1);
  assert.deepEqual(rankTextResearch(items).map((item) => item.id), [1]);
});

test('TEXT lifecycle parser rejects unrecognized states', () => {
  assert.throws(
    () => parseTextResearchState('ROCKSOUL-RESEARCH-STATE:identity_resolved'),
    /Unknown TEXT research lifecycle/,
  );
});

test('fenced issue lifecycle metadata parses without a trailing backtick', () => {
  const cases = [
    { issue: 373, state: 'triaged' },
    { issue: 375, state: 'source_inspected' },
    { issue: 376, state: 'triaged' },
  ] as const;

  for (const { issue, state } of cases) {
    const body = [
      '## Machine Metadata',
      '',
      '```text',
      'ROCKSOUL-RESEARCH-CONTRACT:v1',
      `ROCKSOUL-RESEARCH-STATE:${state}`,
      '```',
    ].join('\n');
    assert.equal(parseTextResearchState(body), state, `issue #${issue}`);
  }
});

test('last fenced lifecycle metadata marker takes precedence', () => {
  const body = [
    'ROCKSOUL-RESEARCH-STATE:triaged',
    '```text',
    'ROCKSOUL-RESEARCH-STATE:ready_for_observation',
    '```',
  ].join('\n');
  assert.equal(parseTextResearchState(body), 'ready_for_observation');
});
