import numpy as np
from PIL import Image
import os
import shutil

project_dir = r"c:\projects\dhara"
images_dir = os.path.join(project_dir, "assets", "images")
user_upload = r"C:\Users\vijay\.gemini\antigravity-ide\brain\26f0f35b-b915-4a77-9c5a-78b47904350e\.user_uploaded\media_1789995881361.jpg"

im = Image.open(user_upload).convert("RGB")
arr = np.array(im, dtype=np.float32)

# Precise background alpha calculation
diff = 255.0 - arr
max_diff = np.max(diff, axis=2)
alpha = np.clip((max_diff - 8.0) / (32.0 - 8.0), 0.0, 1.0)

# Unmultiply white
fg_rgb = np.zeros_like(arr)
nonzero = alpha > 0.01
for c in range(3):
    fg_rgb[:, :, c] = np.where(
        nonzero,
        np.clip((arr[:, :, c] - (1.0 - alpha) * 255.0) / np.maximum(alpha, 0.01), 0, 255),
        0
    )

# Light theme RGBA array
rgba_light = np.zeros((1024, 1024, 4), dtype=np.uint8)
rgba_light[:, :, :3] = np.uint8(np.round(fg_rgb))
rgba_light[:, :, 3] = np.uint8(np.round(alpha * 255.0))

# Dark theme RGBA array:
# Preserve gold colors, transform dark neutral colors to platinum/white (#f8f9fa)
r = fg_rgb[:, :, 0]
g = fg_rgb[:, :, 1]
b = fg_rgb[:, :, 2]

gold_weight = np.clip((r - b - 15.0) / 25.0, 0.0, 1.0) * np.clip((r - 50.0) / 40.0, 0.0, 1.0)
dark_weight = 1.0 - gold_weight
target_white = np.array([246.0, 248.0, 252.0])

dark_rgb = np.zeros_like(fg_rgb)
for c in range(3):
    dark_rgb[:, :, c] = fg_rgb[:, :, c] * gold_weight + target_white[c] * dark_weight

rgba_dark = np.zeros((1024, 1024, 4), dtype=np.uint8)
rgba_dark[:, :, :3] = np.uint8(np.round(np.clip(dark_rgb, 0, 255)))
rgba_dark[:, :, 3] = np.uint8(np.round(alpha * 255.0))

# IMPORTANT: Crop WITHOUT "SPACES FOR A BRIGHTER TOMORROW"
# Emblem starts at y=173
# REALTORS ends at y=814
# We crop strictly y from 170 to 816
# Find horizontal bounds for this region:
region_mask = (alpha[170:818, :] > 0.1)
cols = np.where(region_mask)[1]
xmin = max(0, cols.min() - 4)
xmax = min(1024, cols.max() + 5)
ymin = 170
ymax = 816

print(f"Cropping logo strictly without tagline: x: {xmin} to {xmax}, y: {ymin} to {ymax}")

img_light_full = Image.fromarray(rgba_light, mode="RGBA").crop((xmin, ymin, xmax, ymax))
img_dark_full = Image.fromarray(rgba_dark, mode="RGBA").crop((xmin, ymin, xmax, ymax))

# Save Master Stacked Logos (Emblem + DHARA + REALTORS)
img_dark_full.save(os.path.join(images_dir, "logo-dark-theme.png"), optimize=True)
img_light_full.save(os.path.join(images_dir, "logo-light-theme.png"), optimize=True)
img_dark_full.save(os.path.join(images_dir, "logo.png"), optimize=True)

# Generate Horizontal Lockups for Navbar (Emblem + DHARA REALTORS)
def make_horizontal_lockup(full_img, out_path):
    # In full_img (cropped from ymin=170):
    # Emblem is from y=173 to y=587 in original -> y=0 to (587 - 170) = 417
    emblem_crop = full_img.crop((0, 0, full_img.width, 417))
    emblem = emblem_crop.crop(emblem_crop.getbbox())
    
    # Text block is DHARA + REALTORS (original y=610 to 814 -> y=(610-170)=440 to full_img.height)
    text_crop = full_img.crop((0, 435, full_img.width, full_img.height))
    text_block = text_crop.crop(text_crop.getbbox())
    
    target_h = 160
    scale_e = target_h / emblem.height
    new_e_w = int(emblem.width * scale_e)
    emblem_scaled = emblem.resize((new_e_w, target_h), Image.Resampling.LANCZOS)
    
    # Since there is NO tagline now, DHARA + REALTORS can scale cleanly to 78% of target_h
    text_h = int(target_h * 0.78)
    scale_t = text_h / text_block.height
    new_t_w = int(text_block.width * scale_t)
    text_scaled = text_block.resize((new_t_w, text_h), Image.Resampling.LANCZOS)
    
    gap = int(target_h * 0.16)
    total_w = new_e_w + gap + new_t_w
    
    lockup = Image.new("RGBA", (total_w, target_h), (0, 0, 0, 0))
    lockup.paste(emblem_scaled, (0, 0), emblem_scaled)
    text_y = (target_h - text_h) // 2
    lockup.paste(text_scaled, (new_e_w + gap, text_y), text_scaled)
    
    lockup.save(out_path, optimize=True)
    return emblem

emblem_dark = make_horizontal_lockup(img_dark_full, os.path.join(images_dir, "logo-header-dark.png"))
emblem_light = make_horizontal_lockup(img_light_full, os.path.join(images_dir, "logo-header-light.png"))

emblem_dark.save(os.path.join(images_dir, "logo-emblem-dark.png"), optimize=True)
emblem_light.save(os.path.join(images_dir, "logo-emblem-light.png"), optimize=True)

# Generate Favicon from golden emblem
max_dim = max(emblem_dark.width, emblem_dark.height)
fav_canvas = Image.new("RGBA", (max_dim + 24, max_dim + 24), (0, 0, 0, 0))
paste_x = (fav_canvas.width - emblem_dark.width) // 2
paste_y = (fav_canvas.height - emblem_dark.height) // 2
fav_canvas.paste(emblem_dark, (paste_x, paste_y), emblem_dark)

favicon_64 = fav_canvas.resize((64, 64), Image.Resampling.LANCZOS)
favicon_64.save(os.path.join(images_dir, "favicon.png"), optimize=True)

print("All logo assets regenerated successfully WITHOUT the tagline!")
