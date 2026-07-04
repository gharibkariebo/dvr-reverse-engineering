import asyncio
import websockets

ARQ_OPEN = bytes([
    0xd9, 0xff, 0xcc, 0x02,
    0x8c, 0x38, 0xee, 0xd2,
    0xd1, 0x99, 0xac, 0x60,
    0x26, 0x94, 0x7f, 0xae,
    0x01, 0x00, 0x00, 0x00
])

async def main():
    async with websockets.connect(
        "ws://192.168.10.100:10000"
    ) as ws:

        print("connected")

        await ws.send(ARQ_OPEN)
        print("ARQ sent")

        reply = await ws.recv()

        print("type:", type(reply))
        print("length:", len(reply))

        if isinstance(reply, bytes):
            print(reply.hex())
        else:
            print(reply)

asyncio.run(main())
