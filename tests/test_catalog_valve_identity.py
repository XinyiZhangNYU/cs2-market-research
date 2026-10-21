from __future__ import annotations

from cs2_research.catalog.valve_identity import validate_valve_catalog_identity


def _localization(base_zh: str = "AK-47", finish_zh: str = "红线") -> bytes:
    return (
        '"lang"\n{\n"Tokens"\n{\n'
        f'"Weapon_AK47" "{base_zh}"\n'
        f'"PaintKit_redline_Tag" "{finish_zh}"\n'
        '}\n}\n'
    ).encode("utf-8")


def _items_game() -> bytes:
    return b'''"items_game"
{
  "prefabs"
  {
    "rifle" { "item_name" "#Weapon_AK47" }
  }
  "items"
  {
    "7" { "name" "weapon_ak47" "prefab" "rifle" }
  }
  "paint_kits"
  {
    "100" { "name" "cu_redline" "description_tag" "#PaintKit_redline_Tag" }
  }
  "client_loot_lists"
  {
    "test" { "[cu_redline]weapon_ak47" "1" }
  }
}
'''


def _inputs() -> tuple[dict, list[dict], dict]:
    batch = {
        "records": [
            {
                "item_id": 1,
                "localized_name": {
                    "authority": "VALVE_STEAM",
                    "en": "AK-47 | Redline (Factory New)",
                    "zh_cn": "AK-47 | 红线 (崭新出厂)",
                },
                "media": None,
            }
        ]
    }
    mapping = [
        {
            "item_id": 1,
            "market_hash_name": "AK-47 | Redline (Factory New)",
            "variant_family_key": "WEAPON:AK-47 | Redline",
            "base_item_code": "defindex:7|paint:token:paintkit_redline_tag",
        }
    ]
    report = {
        "status": "PASS",
        "family_results": [
            {
                "family_key": "WEAPON:AK-47 | Redline",
                "kind": "WEAPON",
                "base_en": "AK-47",
                "base_zh": "AK-47",
                "finish_en": "Redline",
                "finish_zh": "红线",
                "base_candidates": ["7:weapon_ak47"],
                "base_item_code": "defindex:7|paint:token:paintkit_redline_tag",
                "selected_indices": [100],
            }
        ],
    }
    return batch, mapping, report


def test_accepted_identity_replay_classifies_ordinary_update_as_unchanged() -> None:
    batch, mapping, report = _inputs()
    result = validate_valve_catalog_identity(
        current_batch=batch,
        item_family_rows=mapping,
        accepted_identity_report=report,
        items_game=_items_game(),
        english_localization=_localization("AK-47", "Redline"),
        chinese_localization=_localization(),
    )
    assert result["decision"] == "IDENTITY_UNCHANGED"
    assert result["failure_count"] == 0
    assert result["item_count"] == 1
    assert result["family_count"] == 1


def test_relevant_localization_change_requires_human_review() -> None:
    batch, mapping, report = _inputs()
    result = validate_valve_catalog_identity(
        current_batch=batch,
        item_family_rows=mapping,
        accepted_identity_report=report,
        items_game=_items_game(),
        english_localization=_localization("AK-47", "Redline"),
        chinese_localization=_localization("AK-47 新名称", "红线"),
    )
    assert result["decision"] == "HUMAN_REVIEW_REQUIRED"
    assert result["reason_codes"] == ["BASE_LOCALIZATION_CHANGED"]


def test_paint_pair_removal_requires_human_review() -> None:
    batch, mapping, report = _inputs()
    changed = _items_game().replace(b"[cu_redline]weapon_ak47", b"unrelated")
    result = validate_valve_catalog_identity(
        current_batch=batch,
        item_family_rows=mapping,
        accepted_identity_report=report,
        items_game=changed,
        english_localization=_localization("AK-47", "Redline"),
        chinese_localization=_localization(),
    )
    assert result["decision"] == "HUMAN_REVIEW_REQUIRED"
    assert result["reason_codes"] == ["PAINT_IDENTITY_CHANGED"]


