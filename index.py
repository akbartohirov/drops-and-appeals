import hashlib

text = "akbar".encode()

hex = hashlib.sha256(text).hexdigest()

print(hex)