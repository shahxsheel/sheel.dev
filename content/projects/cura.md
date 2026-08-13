A robotic feeding assistant for hospital patients. Drives a Piper arm over CAN to deliver a water bottle, coordinated by a FastAPI state machine with a hard emergency stop.

The arm's SDK assumes Linux, so I built the macOS CAN path from scratch with gs_usb and SLCAN, then found and fixed a reconnect failure and a segfault in it. Also built the vision to arm bridge.
