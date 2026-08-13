Real-time driver monitoring on a Raspberry Pi. Split into two processes over ZeroMQ so camera capture never blocks on inference latency. Detects phone use and eye closure, locks onto a single tracked driver, and scores risk from gaze duration, phone presence, and PERCLOS.

I dropped the torch runtime in favor of raw ncnn to save roughly 150MB and eliminate a crash class specific to the Pi 4B.
