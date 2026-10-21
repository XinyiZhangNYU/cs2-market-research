"""Deterministic validation of the accepted Valve catalog identity registry.

The module consumes only already-extracted local ``items_game`` and localization
bytes.  It replays the accepted Valve identity rules and deliberately returns
``HUMAN_REVIEW_REQUIRED`` when a base definition, paint identity, or relevant
localized token changes.  It has no provider, database, process, or publication
capability.
"""

from __future__ import annotations

import collections
import re
from typing import Any, Iterable, Mapping, Sequence


_KEY_RE = re.compile(r'"([^"\\]*(?:\\.[^"\\]*)*)"\s*')
_PAIR_VALUE_RE = re.compile(
    r'"([^"\\]*(?:\\.[^"\\]*)*)"\s+"([^"\\]*(?:\\.[^"\\]*)*)"'
)
_LINE_PAIR_RE = re.compile(
    r'^\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s+"([^"\\]*(?:\\.[^"\\]*)*)"'
)
_PAIR_RE = re.compile(r'"\[([A-Za-z0-9_\-.]+)\](weapon_[a-z0-9_]+)"')
_BASE_CODE_RE = re.compile(
    r"^defindex:(?P<defindex>[1-9][0-9]*)\|paint:(?P<series>none|(?:token|aggregate):[^|\x00-\x1f\x7f]+)$"
)


def _unescape(value: str) -> str:
    return (
        value.replace(r'\"', '"')
        .replace(r"\n", "\n")
        .replace(r"\t", "\t")
        .replace(r"\\", "\\")
    )


def _match_brace(text: str, start: int) -> int:
    if start >= len(text) or text[start] != "{":
        raise ValueError("expected opening brace")
    depth = 0
    quote = False
    escaped = False
    line_comment = False
    index = start
    while index < len(text):
        character = text[index]
        following = text[index + 1] if index + 1 < len(text) else ""
        if line_comment:
            if character in "\r\n":
                line_comment = False
            index += 1
            continue
        if quote:
            if escaped:
                escaped = False
            elif character == "\\":
                escaped = True
            elif character == '"':
                quote = False
            index += 1
            continue
        if character == "/" and following == "/":
            line_comment = True
            index += 2
            continue
        if character == '"':
            quote = True
        elif character == "{":
            depth += 1
        elif character == "}":
            depth -= 1
            if depth == 0:
                return index
        index += 1
    raise ValueError("unbalanced braces in items_game")


def _sections(text: str, name: str) -> Iterable[str]:
    for match in re.finditer(r'"%s"' % re.escape(name), text):
        brace = text.find("{", match.end())
        if brace < 0 or text[match.end() : brace].strip():
            continue
        yield text[brace + 1 : _match_brace(text, brace)]


def _entries(block: str) -> Iterable[tuple[str, str]]:
    index = 0
    while index < len(block):
        match = _KEY_RE.search(block, index)
        if match is None:
            return
        key = _unescape(match.group(1))
        cursor = match.end()
        while cursor < len(block) and block[cursor] in " \t\r\n":
            cursor += 1
        if cursor < len(block) and block[cursor] == "{":
            end = _match_brace(block, cursor)
            yield key, block[cursor + 1 : end]
            index = end + 1
        else:
            index = match.end()


def _field(body: str, key: str) -> str | None:
    match = re.search(
        r'"%s"\s+"([^"\\]*(?:\\.[^"\\]*)*)"' % re.escape(key), body
    )
    return _unescape(match.group(1)) if match else None


def _localization(payload: bytes) -> tuple[dict[str, str], set[str]]:
    try:
        text = payload.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ValueError("localization is not UTF-8") from None
    values: dict[str, list[str]] = collections.defaultdict(list)
    for line in text.splitlines():
        match = _LINE_PAIR_RE.match(line)
        if match:
            values[_unescape(match.group(1)).casefold()].append(
                _unescape(match.group(2))
            )
    unique = {
        key: entries[0]
        for key, entries in values.items()
        if len(set(entries)) == 1
    }
    conflicts = {key for key, entries in values.items() if len(set(entries)) > 1}
    return unique, conflicts


def _localized(token: str | None, table: Mapping[str, str]) -> str | None:
    if not token:
        return None
    return table.get(token.removeprefix("#").casefold())


def _prefab_field(
    name: str,
    key: str,
    prefabs: Mapping[str, str],
    stack: tuple[str, ...] = (),
) -> set[str]:
    if name in stack or name not in prefabs:
        return set()
    body = prefabs[name]
    direct = _field(body, key)
    if direct is not None:
        return {direct}
    result: set[str] = set()
    for parent in (_field(body, "prefab") or "").split():
        result.update(_prefab_field(parent, key, prefabs, stack + (name,)))
    return result


def _kind(internal_name: str) -> str | None:
    lowered = internal_name.casefold()
    if "glove" in lowered or lowered in {"slick_gloves", "leather_handwraps"}:
        return "GLOVE"
    if lowered == "weapon_bayonet" or lowered.startswith("weapon_knife"):
        return "KNIFE"
    if lowered.startswith("weapon_"):
        return "WEAPON"
    return None


def _items(
    text: str, english: Mapping[str, str], chinese: Mapping[str, str]
) -> list[dict[str, Any]]:
    prefabs_blocks = list(_sections(text, "prefabs"))
    items_blocks = list(_sections(text, "items"))
    if not prefabs_blocks or not items_blocks:
        raise ValueError("items_game must contain prefabs and items sections")
    prefabs = dict(_entries(prefabs_blocks[0]))
    result: list[dict[str, Any]] = []
    for raw_index, body in _entries(items_blocks[0]):
        if not raw_index.isdigit():
            continue
        internal_name = _field(body, "name")
        if not internal_name:
            continue
        direct = _field(body, "item_name")
        tokens = {direct} if direct else set()
        if not tokens:
            for prefab in (_field(body, "prefab") or "").split():
                tokens.update(_prefab_field(prefab, "item_name", prefabs))
        tokens.discard(None)
        result.append(
            {
                "defindex": int(raw_index),
                "internal_name": internal_name,
                "kind": _kind(internal_name),
                "localized_names": tuple(
                    (
                        _localized(token, english),
                        _localized(token, chinese),
                    )
                    for token in sorted(tokens)
                ),
            }
        )
    return result


def _top_level_fields(body: str) -> dict[str, list[str]]:
    result: dict[str, list[str]] = collections.defaultdict(list)
    index = 0
    depth = 0
    quote = False
    escaped = False
    comment = False
    while index < len(body):
        character = body[index]
        following = body[index + 1] if index + 1 < len(body) else ""
        if comment:
            if character in "\r\n":
                comment = False
            index += 1
            continue
        if quote:
            if escaped:
                escaped = False
            elif character == "\\":
                escaped = True
            elif character == '"':
                quote = False
            index += 1
            continue
        if character == "/" and following == "/":
            comment = True
            index += 2
            continue
        if character == '"' and depth == 0:
            match = _PAIR_VALUE_RE.match(body, index)
            if match:
                result[_unescape(match.group(1))].append(_unescape(match.group(2)))
                index = match.end()
                continue
            quote = True
        elif character == "{":
            depth += 1
        elif character == "}":
            depth -= 1
        index += 1
    return dict(result)


def _paint_kits(
    text: str, english: Mapping[str, str], chinese: Mapping[str, str]
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    seen: set[int] = set()
    for block in _sections(text, "paint_kits"):
        for raw_index, body in _entries(block):
            if not raw_index.isdigit() or int(raw_index) in seen:
                continue
            index = int(raw_index)
            seen.add(index)
            tag = _field(body, "description_tag")
            result.append(
                {
                    "paint_index": index,
                    "internal_name": _field(body, "name"),
                    "description_tag": tag,
                    "en": _localized(tag, english),
                    "zh": _localized(tag, chinese),
                    "same_name_family_aggregate": _field(
                        body, "same_name_family_aggregate"
                    ),
                    "top_level_scalar_fields": _top_level_fields(body),
                }
            )
    return result


def _tag(kit: Mapping[str, Any]) -> str | None:
    value = kit.get("description_tag")
    return value.removeprefix("#").casefold() if isinstance(value, str) and value else None


def _glove(kit: Mapping[str, Any]) -> bool:
    fields = kit["top_level_scalar_fields"]
    return any(
        path.casefold().startswith(
            "materials/models/weapons/customization/paints_gloves/"
        )
        for path in fields.get("vmt_path", [])
    ) or any(
        path.casefold().startswith("gloves/paints/")
        for path in fields.get("composite_material_path", [])
    )


def _resolve_paint(
    kind: str,
    base_internal: str,
    candidates: Sequence[dict[str, Any]],
    all_pairs: set[tuple[str, str]],
) -> tuple[str | None, tuple[int, ...]]:
    if kind == "WEAPON":
        eligible = [
            kit
            for kit in candidates
            if kit.get("internal_name")
            and (base_internal, str(kit["internal_name"])) in all_pairs
        ]
    elif kind == "GLOVE":
        eligible = [kit for kit in candidates if _glove(kit)]
    elif kind == "KNIFE":
        eligible = [kit for kit in candidates if not _glove(kit)]
    else:
        eligible = []
    groups: dict[str, list[dict[str, Any]]] = collections.defaultdict(list)
    for kit in eligible:
        if (tag := _tag(kit)) is not None:
            groups[tag].append(kit)
    aggregates = {
        str(kit["same_name_family_aggregate"])
        for kit in eligible
        if kit.get("same_name_family_aggregate")
    }
    selected: list[dict[str, Any]] = []
    series: str | None = None
    if len(groups) == 1:
        tag, selected = next(iter(groups.items()))
        series = f"token:{tag}"
    elif eligible and len(aggregates) == 1 and all(
        kit.get("same_name_family_aggregate") in aggregates for kit in eligible
    ):
        series = f"aggregate:{next(iter(aggregates))}"
        selected = list(eligible)
    elif kind == "KNIFE" and groups:
        shared = [(tag, rows) for tag, rows in groups.items() if len(rows) > 1]
        if len(shared) == 1 and all(
            len(rows) == 1 for tag, rows in groups.items() if tag != shared[0][0]
        ):
            tag, selected = shared[0]
            series = f"token:{tag}"
    return series, tuple(sorted(int(kit["paint_index"]) for kit in selected))


def validate_valve_catalog_identity(
    *,
    current_batch: Mapping[str, Any],
    item_family_rows: Sequence[Mapping[str, Any]],
    accepted_identity_report: Mapping[str, Any],
    items_game: bytes,
    english_localization: bytes,
    chinese_localization: bytes,
) -> dict[str, Any]:
    """Re-evaluate every accepted family against one local Valve source set."""

    if accepted_identity_report.get("status") != "PASS":
        raise ValueError("accepted identity report is not PASS")
    families = accepted_identity_report.get("family_results")
    records = current_batch.get("records")
    if not isinstance(families, list) or not isinstance(records, list):
        raise ValueError("identity report or current batch shape is invalid")
    family_by_key = {row.get("family_key"): row for row in families if isinstance(row, Mapping)}
    if len(family_by_key) != len(families) or None in family_by_key:
        raise ValueError("identity report family keys are invalid")
    record_by_id = {
        row.get("item_id"): row for row in records if isinstance(row, Mapping)
    }
    mapping_by_id = {
        row.get("item_id"): row for row in item_family_rows if isinstance(row, Mapping)
    }
    if (
        len(record_by_id) != len(records)
        or len(mapping_by_id) != len(item_family_rows)
        or set(record_by_id) != set(mapping_by_id)
    ):
        raise ValueError("item-family mapping does not exactly cover current batch")
    failures: list[dict[str, Any]] = []
    for item_id in sorted(record_by_id):
        record = record_by_id[item_id]
        mapping = mapping_by_id[item_id]
        family = family_by_key.get(mapping.get("variant_family_key"))
        names = record.get("localized_name")
        if (
            family is None
            or not isinstance(names, Mapping)
            or mapping.get("market_hash_name") != names.get("en")
            or mapping.get("base_item_code") != family.get("base_item_code")
        ):
            failures.append({"code": "BASELINE_BINDING_DRIFT", "item_id": item_id})
            if len(failures) >= 50:
                break
    try:
        text = items_game.decode("utf-8")
    except UnicodeDecodeError:
        raise ValueError("items_game is not UTF-8") from None
    english, english_conflicts = _localization(english_localization)
    chinese, chinese_conflicts = _localization(chinese_localization)
    items = _items(text, english, chinese)
    paint_kits = _paint_kits(text, english, chinese)
    item_by_identity = {
        (item["defindex"], item["internal_name"]): item for item in items
    }
    pairs: set[tuple[str, str]] = set()
    for section in ("client_loot_lists", "item_sets"):
        for block in _sections(text, section):
            pairs.update((match.group(2), match.group(1)) for match in _PAIR_RE.finditer(block))
    for family_key in sorted(family_by_key):
        family = family_by_key[family_key]
        code = family.get("base_item_code")
        match = _BASE_CODE_RE.fullmatch(code) if isinstance(code, str) else None
        candidates = family.get("base_candidates")
        if match is None or not isinstance(candidates, list) or len(candidates) != 1:
            failures.append({"code": "ACCEPTED_REGISTRY_INVALID", "family_key": family_key})
            continue
        candidate = candidates[0]
        expected_prefix = f"{match.group('defindex')}:"
        if not isinstance(candidate, str) or not candidate.startswith(expected_prefix):
            failures.append({"code": "ACCEPTED_BASE_BINDING_INVALID", "family_key": family_key})
            continue
        internal = candidate[len(expected_prefix) :]
        item = item_by_identity.get((int(match.group("defindex")), internal))
        if item is None or item.get("kind") != family.get("kind"):
            failures.append({"code": "BASE_DEFINITION_CHANGED", "family_key": family_key})
            continue
        base_names = set(item["localized_names"])
        if not any(
            (english_name == family.get("base_en") or f"★ {english_name}" == family.get("base_en"))
            and (
                family.get("base_zh_match") is False
                or family.get("base_zh") is None
                or chinese_name == family.get("base_zh")
            )
            for english_name, chinese_name in base_names
        ):
            failures.append({"code": "BASE_LOCALIZATION_CHANGED", "family_key": family_key})
            continue
        expected_series = match.group("series")
        if expected_series == "none":
            if family.get("finish_en") is not None or family.get("selected_indices"):
                failures.append({"code": "NO_PAINT_REGISTRY_DRIFT", "family_key": family_key})
            continue
        matching = [
            kit
            for kit in paint_kits
            if kit.get("en") == family.get("finish_en")
            and (
                family.get("finish_zh") is None
                or kit.get("zh") == family.get("finish_zh")
            )
        ]
        series, selected = _resolve_paint(str(family.get("kind")), internal, matching, pairs)
        expected_indices = family.get("selected_indices")
        if (
            series != expected_series
            or not isinstance(expected_indices, list)
            or selected != tuple(expected_indices)
        ):
            failures.append({"code": "PAINT_IDENTITY_CHANGED", "family_key": family_key})
    conflicts = sorted(english_conflicts | chinese_conflicts)
    if conflicts:
        failures.append(
            {"code": "LOCALIZATION_TOKEN_CONFLICT", "sample": conflicts[:20]}
        )
    reason_codes = sorted({str(value["code"]) for value in failures})
    return {
        "decision": "HUMAN_REVIEW_REQUIRED" if failures else "IDENTITY_UNCHANGED",
        "family_count": len(family_by_key),
        "item_count": len(record_by_id),
        "reason_codes": reason_codes,
        "failure_count": len(failures),
        "failure_sample": failures[:20],
        "source_counts": {
            "item_definitions": len(items),
            "paint_kits": len(paint_kits),
        },
        "validator_contract": "valve-catalog-identity-validation",
        "validator_version": "v1",
    }


__all__ = ["validate_valve_catalog_identity"]
