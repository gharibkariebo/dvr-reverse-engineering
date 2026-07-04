import asyncio
import random
import struct

import websockets
from Crypto.Cipher import AES

HOST = "192.168.10.100"
PORT = 10000

SID = random.randint(1000, 9999)

KEY = b"~!JUAN*&Vision-="

ARQ_OPEN = bytes([
    0xD9, 0xFF, 0xCC, 0x02,
    0x8C, 0x38, 0xEE, 0xD2,
    0xD1, 0x99, 0xAC, 0x60,
    0x26, 0x94, 0x7F, 0xAE
]) + SID.to_bytes(4, "little")


def arq_header(length):
    return b"\xCE\xFA\xEF\xFE" + length.to_bytes(4, "little")


def open_req():
    pkt = bytearray(40)

    pkt[0:4] = b"\xAB\xBC\xCD\xDE"
    pkt[4:8] = (20).to_bytes(4, "little")
    pkt[8:12] = (1).to_bytes(4, "little")

    pkt[16:20] = SID.to_bytes(4, "little")

    pkt[28:32] = (8).to_bytes(4, "little")

    pkt[32:36] = SID.to_bytes(4, "little")
    pkt[36:40] = (0).to_bytes(4, "little")

    return bytes(pkt)


def build_auth_packet():

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

    api = struct.pack(
        "<IIIIII",
        0x4B503250,   # KP2P
        1,
        1,
        10,           # AUTH_REQ
        0,
        len(payload)
    )

    return api + payload


def build_iot_data(payload):

    hdr = bytearray(32)

    hdr[0:4] = b"\xAB\xBC\xCD\xDE"
    hdr[4:8] = (19).to_bytes(4, "little")  # DATA
    hdr[8:12] = (1).to_bytes(4, "little")

    hdr[16:20] = SID.to_bytes(4, "little")

    hdr[28:32] = len(payload).to_bytes(4, "little")

    return bytes(hdr) + payload


async def send_iot(ws, payload):
    await ws.send(arq_header(len(payload)))
    await ws.send(payload)


async def main():

    print("SID =", SID)

    async with websockets.connect(
        f"ws://{HOST}:{PORT}"
    ) as ws:

        print("connected")

        await ws.send(ARQ_OPEN)

        r = await ws.recv()

        print("ARQ OK")
        print(r.hex())

        await send_iot(ws, open_req())

        print("OPEN_REQ sent")

        auth_sent = False

        while True:

            msg = await ws.recv()

            if not isinstance(msg, bytes):
                continue

            print()
            print("RX LEN =", len(msg))
            print(msg.hex())

            #
            # OPEN_RES
            #
            if (
                len(msg) >= 40 and
                msg[4:8] == b"\x15\x00\x00\x00" and
                not auth_sent
            ):
                print()
                print("OPEN_RES detected")
                print("Sending AUTH_REQ")

                auth_sent = True

                auth_payload = build_auth_packet()

                await send_iot(
                    ws,
                    build_iot_data(auth_payload)
                )

                print("AUTH sent")
                setup_payload = b"\x00\x00\x00\x00"

                api = struct.pack(
                    "<IIIIII",
                    0x4B503250,   # KP2P
                    1,
                    2,
                    80,           # SETUP_REQ
                    0,
                    len(setup_payload)
                )

                setup_packet = api + setup_payload

                await send_iot(
                    ws,
                    build_iot_data(setup_packet)
                )

                print("SETUP_REQ sent")

asyncio.run(main())
