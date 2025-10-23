#!/usr/bin/env python3
"""
Generate simple PNG icons for the Chrome extension.
This creates minimal PNG files with a pin design.
"""

import struct
import zlib

def create_png(width, height, pixels):
    """Create a PNG file from pixel data."""
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
    
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA
    png += chunk(b'IHDR', ihdr)
    
    # IDAT chunk (image data)
    raw_data = b''
    for row in pixels:
        raw_data += b'\x00'  # Filter type
        raw_data += row
    
    png += chunk(b'IDAT', zlib.compress(raw_data, 9))
    
    # IEND chunk
    png += chunk(b'IEND', b'')
    
    return png

def create_pin_icon(size):
    """Create a pin icon of the specified size."""
    # Initialize with transparent background
    pixels = []
    
    # Calculate center and scale
    cx, cy = size // 2, size // 2
    radius = int(size * 0.47)
    
    for y in range(size):
        row = b''
        for x in range(size):
            # Distance from center
            dx = x - cx
            dy = y - cy
            dist = (dx*dx + dy*dy) ** 0.5
            
            # Initialize as transparent
            r, g, b, a = 0, 0, 0, 0
            
            # Draw circle background
            if dist <= radius:
                # Teal/green color like ChatGPT
                r, g, b, a = 16, 163, 127, 255
                
            # Draw pin shape (simplified)
            if dist <= radius:
                # Pin head (top)
                pin_head_y = int(size * 0.28)
                pin_head_r = int(size * 0.06)
                if abs(y - pin_head_y) <= pin_head_r and abs(x - cx) <= pin_head_r:
                    r, g, b, a = 240, 240, 240, 255
                
                # Pin body (vertical)
                pin_top = int(size * 0.23)
                pin_mid = int(size * 0.42)
                pin_bottom = int(size * 0.7)
                pin_width = int(size * 0.11)
                
                # Upper pin section (wider)
                if pin_top <= y <= pin_mid and abs(x - cx) <= pin_width:
                    r, g, b, a = 255, 255, 255, 255
                
                # Pin cross section
                pin_cross_y = int(size * 0.47)
                pin_cross_h = int(size * 0.08)
                pin_cross_w = int(size * 0.16)
                if abs(y - pin_cross_y) <= pin_cross_h and abs(x - cx) <= pin_cross_w:
                    r, g, b, a = 255, 255, 255, 255
                
                # Lower pin section (needle)
                pin_needle_start = int(size * 0.55)
                pin_needle_width = int(size * 0.05)
                if pin_needle_start <= y <= pin_bottom:
                    # Taper the needle
                    taper = 1 - ((y - pin_needle_start) / (pin_bottom - pin_needle_start)) * 0.7
                    if abs(x - cx) <= pin_needle_width * taper:
                        r, g, b, a = 255, 255, 255, 255
                
                # Pin point
                pin_point_y = int(size * 0.77)
                pin_point_r = int(size * 0.03)
                if y >= pin_point_y and abs(x - cx) <= pin_point_r and (y - pin_point_y) >= abs(x - cx):
                    r, g, b, a = 255, 255, 255, 255
            
            row += struct.pack('BBBB', r, g, b, a)
        
        pixels.append(row)
    
    return create_png(size, size, pixels)

# Generate icons - including high resolution versions
sizes = [16, 48, 128, 256, 512]
for size in sizes:
    print(f"Generating icon{size}.png...")
    png_data = create_pin_icon(size)
    with open(f'icon{size}.png', 'wb') as f:
        f.write(png_data)
    print(f"✓ Created icon{size}.png ({len(png_data)} bytes)")

print("\n✅ All icons generated successfully!")
