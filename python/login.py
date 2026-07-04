import asyncio
import random
import struct

import websockets

SID = random.randint(1000, 9999)

print("SID =", SID)

ARQ_OPEN = bytes([
    0xD9, 0xFF, 0xCC, 0x02,
    0x8C, 0x38, 0xEE, 0xD2,
    0xD1, 0x99, 0xAC, 0x60,
    0x26, 0x94, 0x7F, 0xAE,
]) + SID.to_bytes(4, "little")


def build_iot_hdr(cmd, ticket, sid, payload):
    hdr = bytearray(32)

    hdr[0] = 0xAB
    hdr[1] = 0xBC
    hdr[2] = 0xCD
    hdr[3] = 0xDE

    hdr[4:8] = cmd.to_bytes(4, "little")
    hdr[8:12] = (1).to_bytes(4, "little")
    hdr[12:16] = ticket.to_bytes(4, "little")
    hdr[16:20] = sid.to_bytes(4, "little")

    hdr[28:32] = len(payload).to_bytes(4, "little")

    return bytes(hdr) + payload


def build_open_req(sid):
    payload = struct.pack("<II", sid, 0)

    return build_iot_hdr(
        20,      # IOT_LINK_CMD_OPEN_REQ
        0,
        sid,
        payload
    )


def build_arq_header(length):
    return (
        b"\xCE\xFA\xEF\xFE" +
        length.to_bytes(4, "little")
    )


async def main():
    async with websockets.connect(
        "ws://192.168.10.100:10000"
    ) as ws:

        print("connected")

        await ws.send(ARQ_OPEN)

        data = await ws.recv()

        print()
        print("ARQ RESPONSE")
        print(data.hex())

        open_req = build_open_req(SID)

        print()
        print("OPEN_REQ")
        print(open_req.hex())

        await ws.send(build_arq_header(len(open_req)))
        await ws.send(open_req)

        print()
        print("OPEN_REQ SENT")

        while True:
            try:
                resp = await asyncio.wait_for(
                    ws.recv(),
                    timeout=5
                )

                if isinstance(resp, bytes):
                    print()
                    print("RX", len(resp))
                    print(resp.hex())
                else:
                    print(resp)

            except asyncio.TimeoutError:
                print("TIMEOUT")


asyncio.run(main())
