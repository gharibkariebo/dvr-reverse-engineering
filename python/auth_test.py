import asyncio
import random

import websockets

HOST = "192.168.10.100"
PORT = 10000

SID = random.randint(1000, 9999)

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

    pkt[0] = 0xAB
    pkt[1] = 0xBC
    pkt[2] = 0xCD
    pkt[3] = 0xDE

    pkt[4:8] = (20).to_bytes(4, "little")
    pkt[8:12] = (1).to_bytes(4, "little")

    pkt[16:20] = SID.to_bytes(4, "little")

    pkt[28:32] = (8).to_bytes(4, "little")

    pkt[32:36] = SID.to_bytes(4, "little")
    pkt[36:40] = (0).to_bytes(4, "little")

    return bytes(pkt)


async def main():

    print("SID =", SID)

    async with websockets.connect(
        f"ws://{HOST}:{PORT}"
    ) as ws:

        print("connected")

        await ws.send(ARQ_OPEN)

        resp = await ws.recv()

        print()
        print("ARQ OK")
        print(resp.hex())

        pkt = open_req()

        await ws.send(arq_header(len(pkt)))
        await ws.send(pkt)

        print()
        print("OPEN_REQ sent")

        while True:

            msg = await ws.recv()

            if not isinstance(msg, bytes):
                continue

            print()
            print("RX LEN =", len(msg))

            if len(msg) == 40:
                print(msg.hex())

            elif len(msg) == 128:
                print(msg[:32].hex())

            else:
                print(msg.hex())


asyncio.run(main())
