from Crypto.Cipher import AES
import struct

KEY = b"~!JUAN*&Vision-="

APP_PROTO_MAGIC = 0x4B503250
APP_PROTO_VERSION = 1
APP_PROTO_CMD_AUTH_REQ = 10

cipher = AES.new(KEY, AES.MODE_ECB)

user = b"admin".ljust(32, b"\x00")
passwd = b"".ljust(32, b"\x00")

enc_user = (
    cipher.encrypt(user[:16]) +
    cipher.encrypt(user[16:])
)

enc_pass = (
    cipher.encrypt(passwd[:16]) +
    cipher.encrypt(passwd[16:])
)

payload = enc_user + enc_pass

header = struct.pack(
    "<IIIIII",
    APP_PROTO_MAGIC,
    APP_PROTO_VERSION,
    1,
    APP_PROTO_CMD_AUTH_REQ,
    0,
    len(payload)
)

packet = header + payload

print("packet length:", len(packet))
print(packet.hex())
