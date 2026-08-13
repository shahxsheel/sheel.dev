#!/usr/bin/env python3
"""Static dev server with caching disabled.

Not part of the site — never deployed. Python's stock http.server sends only
Last-Modified, so browsers apply heuristic caching and quietly serve a stale
page after an edit. That cost real time during the build: changes looked like
they had not applied. This sends no-store so a plain reload always wins.
"""
import sys
from http.server import SimpleHTTPRequestHandler, HTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):  # quieter output
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4321
    HTTPServer(("", port), NoCacheHandler).serve_forever()
