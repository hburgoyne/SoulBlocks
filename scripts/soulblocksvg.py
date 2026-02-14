from pathlib import Path

# SVG parameters
size = 1024  # square image
bg = "#000000"
fg = "#ffffff"
font_family = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"

# Change this to test different token IDs
edition_num = 4200  # Try values <= 500 for GENESIS badge, > 500 for standard

# Genesis badge for first 500 tokens
is_genesis = edition_num <= 500
genesis_text = ""
if is_genesis:
    genesis_text = f"""
  <!-- Genesis badge for tokens #1-500 -->
  <text x="922" y="840"
        fill="#ffffff"
        font-family="{font_family}"
        font-size="48"
        font-weight="500"
        dominant-baseline="middle"
        text-anchor="end"
        text-rendering="geometricPrecision">GENESIS</text>"""

svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect x="0" y="0" width="1024" height="1024" fill="{bg}"/>

  <!-- Title above prompt -->
  <text x="102" y="200"
        fill="{fg}"
        font-family="{font_family}"
        font-size="123"
        font-weight="500"
        dominant-baseline="middle"
        text-rendering="geometricPrecision">Soul Blocks</text>

  <!-- Top 2/3: terminal prompt -->
  <text x="88" y="377"
        fill="{fg}"
        font-family="{font_family}"
        font-size="163"
        font-weight="500"
        dominant-baseline="middle"
        text-rendering="geometricPrecision">:~$</text>

  <!-- Bottom 1/3: edition counter -->
  <text x="102" y="840"
        fill="{fg}"
        font-family="{font_family}"
        font-size="68"
        font-weight="500"
        dominant-baseline="middle"
        text-rendering="geometricPrecision">#{edition_num:05d}/10000</text>{genesis_text}
</svg>
"""

out_path = Path("terminal_prompt.svg")
out_path.write_text(svg, encoding="utf-8")
print(f"Generated SVG for token #{edition_num:05d} ({'GENESIS' if is_genesis else 'standard'})")
print(f"Output: {out_path.absolute()}")
