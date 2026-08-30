from uuid import uuid4

import pytest

from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password


def test_password_hash_and_verify() -> None:
    password_hash = hash_password("Password123")

    assert password_hash != "Password123"
    assert verify_password("Password123", password_hash)
    assert not verify_password("WrongPassword123", password_hash)


def test_access_token_round_trip() -> None:
    user_id = uuid4()
    token = create_access_token(user_id)

    assert decode_token(token, expected_type="access") == user_id


def test_refresh_token_rejects_wrong_expected_type() -> None:
    token = create_refresh_token(uuid4())

    with pytest.raises(ValueError):
        decode_token(token, expected_type="access")

