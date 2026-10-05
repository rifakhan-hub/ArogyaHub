from argon2 import PasswordHasher

hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return hasher.hash(password)
