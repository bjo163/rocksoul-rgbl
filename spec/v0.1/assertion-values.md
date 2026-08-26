# Assertion object values — v0.1

## Purpose

An assertion object has exactly one of two universal envelopes: a canonical entity/resource reference or a JSON literal. The envelope distinguishes a graph edge from a literal claim without introducing religion-specific value types.

## Entity reference envelope

```json
{ "entity": "mw:concept:prophet" }
```

`entity` is a canonical ID. No literal fields may appear in this envelope.

## Literal envelope

```json
{ "value": "Musa", "language": "id" }
```

```json
{ "value": 42, "datatype": "xsd:integer" }
```

`value` may be a string, finite number, boolean, or null. `datatype` is an optional non-blank method/vocabulary-defined datatype token or URI. `language` is an optional BCP 47-style language tag and is valid only when `value` is a string.

The literal envelope is intentionally small. Dates, uncertain chronology, quantities with units, and profile-specific structures should be modeled by a profile or by referenced resources/entities instead of continuously expanding the universal literal union.

## Identity

The complete object envelope is part of deterministic assertion identity recipe v1. Adding evidence, provenance, or curation metadata does not change the assertion ID, while changing the object does.

## Non-goals

This envelope does not infer identity from literal equality, does not turn labels into canonical IDs, and does not define theological truth values.
