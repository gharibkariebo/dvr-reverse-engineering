import asyncio
import websockets

async def main():
    uri = "ws://192.168.10.100:10000"

    print("connecting...")

    async with websockets.connect(uri) as ws:
        print("connected")

        await asyncio.sleep(5)

asyncio.run(main())
