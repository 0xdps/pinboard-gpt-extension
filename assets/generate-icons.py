from PIL import Image

# Load the base icon image
base_icon_path = "gpt-icon-pinboard-background.png"
base_icon = Image.open(base_icon_path)

# Define output sizes and paths
sizes = [16, 32, 48, 128, 256, 512]
output_paths = []

for size in sizes:
    resized_icon = base_icon.resize((size, size), Image.LANCZOS)
    output_path = f"icons/icon-{size}.png"
    resized_icon.save(output_path, format="PNG")
    output_paths.append(output_path)

output_paths
