import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TEXT_EPISTEMIC_GUARDS,
  nextTextState,
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
