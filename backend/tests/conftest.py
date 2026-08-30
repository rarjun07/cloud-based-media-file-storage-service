from collections.abc import Callable
from uuid import UUID

import pytest


@pytest.fixture
def sample_uuid() -> Callable[[str], UUID]:
    return UUID
