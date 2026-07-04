from Crypto.Cipher import AES

KEY = b"~!JUAN*&Vision-="

cipher = AES.new(KEY, AES.MODE_ECB)

user = b"admin".ljust(32, b"\x00")

enc_user = (
    cipher.encrypt(user[:16]) +
    cipher.encrypt(user[16:32])
)

print("Encrypted user:")
print(enc_user.hex())
