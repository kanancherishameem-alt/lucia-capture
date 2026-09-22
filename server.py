#!/usr/bin/env python3
"""
LUCIA FINANCE - Local Dev Server & Mobile Network Host
Allows accessing the app instantly on your computer and phone over local Wi-Fi.
"""

import http.server
import socketserver
import socket
import os
import sys

PORT = 8080

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return 'localhost'

def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    Handler = http.server.SimpleHTTPRequestHandler
    Handler.extensions_map.update({
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.json': 'application/json',
        '.html': 'text/html',
    })

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        local_ip = get_local_ip()
        print("=" * 60)
        print(" ✨ LUCIA FINANCE APP RUNNING ✨")
        print("=" * 60)
        print(f" ▸ On your Mac/PC:    http://localhost:{PORT}")
        print(f" ▸ On your Mobile:    http://{local_ip}:{PORT}")
        print("=" * 60)
        print(" Press Ctrl+C to stop the server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()

if __name__ == '__main__':
    run()
