# KP2P DVR Reverse Engineering

Onderzoek naar het KP2P / JuanVision protocol.

## Device

IP:
192.168.10.100

Poort:
10000

## Bevindingen

### Transport

WebSocket

ws://192.168.10.100:10000

### Handshake

Client:

D9 FF CC 02 ...

Server:

96 D5 39 0D ...

### Login

AUTH_REQ

AES key:

~!JUAN*&Vision-=

### Video

LIVE_REQ

Codecs:

- H264
- Audio

## Todo

- Python client
- AUTH_REQ bouwen
- LIVE_REQ bouwen
- H264 dump naar bestand
