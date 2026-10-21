"""Schema identifiers shared by index rollover and delta storage.

This module deliberately contains no index calculation code. A daily runtime
may therefore learn how to store a future rollover without changing the
hash-bound calculation implementation used by the currently active series.
"""

REBALANCED_SPEC_SCHEMA = "market-sector-index-continuation-spec/2"


__all__ = ["REBALANCED_SPEC_SCHEMA"]
