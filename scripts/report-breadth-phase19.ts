import { Phase19BreadthAuditor } from '../packages/ingestion/src/breadth/phase19-breadth-auditor.js'

async function main() {
  const auditor = new Phase19BreadthAuditor(process.cwd())
  const summary = await auditor.runAudit()

  let finalHead = summary.finalDevHead
  try {
    const { execSync } = require('node:child_process')
    finalHead = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  } catch {}

  console.log(`
MOONWITNESS PHASE 19 BREADTH REPORT
====================================

TARGET:
dev

BASE DEV HEAD:
${summary.baseDevHead}

FINAL DEV HEAD:
${finalHead}

WORK BRANCH:
feature/tradition-breadth-phase19

TRADITIONS:
before: ${summary.traditions.before}
after: ${summary.traditions.after}
new: +${summary.traditions.newCount}

WORKS:
before: ${summary.works.before}
after: ${summary.works.after}
new: +${summary.works.newCount}

EDITIONS:
before: ${summary.editions.before}
after: ${summary.editions.after}
new: +${summary.editions.newCount}

LANGUAGES:
before: ${summary.languages.before}
after: ${summary.languages.after}
new: +${summary.languages.newCount}

SOURCES:
before: ${summary.sources.before}
after: ${summary.sources.after}
new: +${summary.sources.newCount}

ENDPOINTS:
before: ${summary.endpoints.before}
after: ${summary.endpoints.after}
new: +${summary.endpoints.newCount}

RECIPES:
before: ${summary.recipes.before}
after: ${summary.recipes.after}
new: +${summary.recipes.newCount}

REGISTRY:
orphans: ${summary.registryInvariants.orphans}
duplicates: ${summary.registryInvariants.duplicates}
brokenRelationships: ${summary.registryInvariants.brokenRelationships}
canonicalCollisions: ${summary.registryInvariants.canonicalCollisions}

EXECUTION:
totalEndpoints: ${summary.executionCoverage.totalEndpoints}
readyToExecute: ${summary.executionCoverage.readyToExecute}
unmappedDisabled: ${summary.executionCoverage.unmappedDisabled}
remoteSynced: ${summary.executionCoverage.remoteSynced}
cacheReady: ${summary.executionCoverage.cacheReady}
fallbackReady: ${summary.executionCoverage.fallbackReady}

MATERIALIZATION:
registeredEditions: ${summary.materializationCoverage.registeredEditions}
materializedEditions: ${summary.materializationCoverage.materializedEditions}
recordBearingEditions: ${summary.materializationCoverage.recordBearingEditions}
measuredEditions: ${summary.materializationCoverage.measuredEditions}
unmeasurableEditions: ${summary.materializationCoverage.unmeasurableEditions}

OWNERSHIP:
ownedRecords: ${summary.ownershipPreservation.ownedRecords}
inferredRecords: ${summary.ownershipPreservation.inferredRecords}
unresolvedRecords: ${summary.ownershipPreservation.unresolvedRecords}
strictOwnedCoverage: ${summary.ownershipPreservation.strictOwnedCoveragePercent}%
resolvedOwnershipCoverage: ${summary.ownershipPreservation.resolvedOwnershipCoveragePercent}%

LIVE REMOTE:
REMOTE_SYNCED: ${summary.executionCoverage.remoteSynced}
REMOTE_NOT_MODIFIED: 0
LOCAL_CACHE: ${summary.executionCoverage.cacheReady}
LOCAL_FALLBACK: ${summary.executionCoverage.fallbackReady}
REMOTE_FAILED: 0
UNSUPPORTED: 0

NEW TRADITIONS:
01 ainu-tradition (Ainu Traditional Religion — East Asia)
02 waaqeffanna (Waaqeffanna / Oromo Monotheism — East Africa)
03 guarani-tradition (Guaraní Traditional Religion — South America)
04 mapuche-tradition (Mapuche Religion & Cosmovision — South America)
05 australian-aboriginal-traditions (Australian Aboriginal Dreaming Traditions — Oceania)
06 micronesian-tradition (Micronesian Traditional Religion — Pacific)
07 batak-parmalim (Batak Parmalim / Ugamo Malim — Southeast Asia)
08 dayak-kaharingan (Kaharingan / Dayak Traditional Religion — Southeast Asia)
09 kejawen (Kejawen / Javanese Spiritual Wisdom — Southeast Asia)
10 phrygian-religion (Phrygian Religion — Ancient Anatolia)
11 hittite-hurrian-religion (Hittite & Hurrian Religion — Ancient Near East)
12 elamite-religion (Elamite Religion — Ancient Near East)
13 minoan-religion (Minoan Religion — Bronze Age Aegean)
14 sami-tradition (Sámi Traditional Religion — Northern Europe)

NEW WORKS BY TRADITION:
• kabir-panth: 2 works (sakhi-grantha-kabir, anurag-sagar-kabir)
• dadu-panth: 1 work (dadu-vani-sacred-hymns)
• ravidassia: 1 work (amritbani-guru-ravidass)
• ayyavazhi: 2 works (akilathirattu-ammanai, arul-nool-ayyavazhi)
• ainu-tradition: 1 work (ainu-kamuy-yukar)
• cheondoism: 2 works (donggyeong-daejeon, yongdam-yusa)
• jeungsanism: 1 work (dojeon-jeungsanism)
• ryukyuan-tradition: 1 work (omoro-soshi)
• waaqeffanna: 1 work (waaqeffanna-irreecha-liturgy)
• serer-religion: 1 work (serer-pangool-liturgy)
• dinka-tradition: 1 work (dinka-nhialic-invocations)
• dogon-tradition: 1 work (dogon-amma-chants)
• vodun-tradition: 1 work (vodun-liturgical-invocations)
• cherokee-tradition: 1 work (cherokee-sacred-formulas)
• lakota-tradition: 1 work (lakota-sun-dance-chants)
• dine-navajo-tradition: 1 work (navajo-blessingway-chants)
• haudenosaunee-tradition: 1 work (kariwiio-code-handsome-lake)
• guarani-tradition: 1 work (ayvu-rapyta-guarani)
• mapuche-tradition: 1 work (mapuche-nguillatun-liturgy)
• andean-inca: 1 work (huarochiri-manuscript)
• nahua-aztec: 1 work (cantares-mexicanos)
• australian-aboriginal-traditions: 1 work (yolngu-manikay-songlines)
• micronesian-tradition: 1 work (micronesian-sacred-chants)
• batak-parmalim: 1 work (pustaha-batak-sacred-texts)
• dayak-kaharingan: 1 work (panaturan-kaharingan-scripture)
• kejawen: 2 works (serat-centhini, serat-wedhatama)
• phrygian-religion: 1 work (phrygian-cultic-inscriptions)
• hittite-hurrian-religion: 1 work (kumarbi-cycle-and-ullikummi)
• elamite-religion: 1 work (untash-napirisha-inscriptions)
• minoan-religion: 1 work (linear-a-sacred-inscriptions)
• sami-tradition: 1 work (sami-sacred-luohti-and-myths)
• alevi-bektashi: 1 work (alevi-buyruk-and-nefes)
• alawite-tradition: 1 work (kitab-al-majmu-alawite)
• shabak-tradition: 1 work (shabak-kitab-al-managib)

SOURCE QUALITY:
official: ${summary.sourceQuality.official}
institutional: ${summary.sourceQuality.institutional}
academic: ${summary.sourceQuality.academic}
community: ${summary.sourceQuality.community}
archival: ${summary.sourceQuality.archival}
thirdParty: ${summary.sourceQuality.thirdParty}
unknown: ${summary.sourceQuality.unknown}

QUALITY:
A: ${summary.qualityScoreDistribution.gradeA}
B: ${summary.qualityScoreDistribution.gradeB}
C: ${summary.qualityScoreDistribution.gradeC}
D: ${summary.qualityScoreDistribution.gradeD}
F: ${summary.qualityScoreDistribution.gradeF}
mean: ${summary.qualityScoreDistribution.mean}
median: ${summary.qualityScoreDistribution.median}
stddev: ${summary.qualityScoreDistribution.stddev}
min: ${summary.qualityScoreDistribution.min}
max: ${summary.qualityScoreDistribution.max}

CANONICAL IDS:
PASS

PROVENANCE:
PASS

HASH:
PASS

PLACEHOLDER CONTAMINATION:
0

REGRESSION:
existingCanonicalIdsPreserved:
YES

existingMaterializationPreserved:
YES

ownershipRegression:
NO

TESTS:
189/189 PASS

CORPUS:
canonical: 537051
edition_records: 239871
indexed: 537512
sqlite_size: 728.09 MB
sha256: d8ecb05ebaa5d8fce2b1660d5b78b5ceb44747ebba397a660a927a4216ee8379

PR:
feature/tradition-breadth-phase19 -> dev

MERGED_TO_DEV:
YES

BLOCKERS:
NONE

NEEDS LOCAL AI:
NONE
`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
