"""Render the brand icons of Daily Challenge (draft design).

A progress ring with a warm gradient around a streak flame, on a transparent
background. Run with the dev venv (needs Pillow and NumPy):

    python scripts/make_brand_icons.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

BRAND = Path(__file__).parent.parent / "custom_components" / "daily_challenge" / "brand"
SUPERSAMPLE = 2048

# Gradient along the ring and up the flame: amber -> orange -> coral -> pink.
STOPS = [
    (0.0, (255, 193, 7)),
    (0.35, (255, 138, 0)),
    (0.7, (255, 84, 62)),
    (1.0, (255, 45, 122)),
]
PROGRESS = 0.78  # share of the ring that is filled
RING_RADIUS = 0.485  # outer radius, relative to the image size (trimmed icon)
RING_WIDTH = 0.127
# Flame size and vertical offset of its centre, relative to the image size.
FLAME_SCALE, FLAME_OFFSET = 0.55, 0.0165
INNER_FLAME_SCALE, INNER_FLAME_OFFSET = 0.242, 0.125
TRACK = {"light": (0, 0, 0, 34), "dark": (255, 255, 255, 46)}
# Inner flame: warm yellow at the top, almost white at the bottom.
INNER_FLAME_TOP, INNER_FLAME_BOTTOM = (255, 214, 92), (255, 248, 222)


def gradient(t: np.ndarray) -> np.ndarray:
    """Return RGB colours for positions t in [0, 1]."""
    positions = [stop for stop, _ in STOPS]
    colors = np.array([color for _, color in STOPS], dtype=float)
    return np.stack(
        [np.interp(t, positions, colors[:, channel]) for channel in range(3)],
        axis=-1,
    )


def ring_layers(size: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return masks for progress and track plus the colour of the progress."""
    center = (size - 1) / 2
    y, x = np.mgrid[0:size, 0:size]
    dx, dy = x - center, y - center
    radius = np.hypot(dx, dy)
    # 0 at twelve o'clock, increasing clockwise.
    turn = (np.arctan2(dx, -dy) / (2 * np.pi)) % 1.0

    outer = RING_RADIUS * size
    width = RING_WIDTH * size
    mid = outer - width / 2
    in_ring = np.abs(radius - mid) <= width / 2

    def cap(position: float) -> np.ndarray:
        angle = 2 * np.pi * position
        cx = center + mid * np.sin(angle)
        cy = center - mid * np.cos(angle)
        return np.hypot(x - cx, y - cy) <= width / 2

    progress = (in_ring & (turn <= PROGRESS)) | cap(0.0) | cap(PROGRESS)
    track = in_ring & ~progress
    color = gradient(np.clip(turn / PROGRESS, 0, 1))
    # The start cap sits left of twelve o'clock: keep it at the first colour.
    color[cap(0.0) & (turn > PROGRESS)] = STOPS[0][1]
    return progress, track, color


def bezier(
    points: list[tuple[float, float]], steps: int = 64
) -> list[tuple[float, float]]:
    """Sample a cubic Bezier curve."""
    p0, p1, p2, p3 = (np.array(point) for point in points)
    t = np.linspace(0, 1, steps)[:, None]
    curve = (
        (1 - t) ** 3 * p0
        + 3 * (1 - t) ** 2 * t * p1
        + 3 * (1 - t) * t**2 * p2
        + t**3 * p3
    )
    return [tuple(point) for point in curve]


# Flame outline in a unit box (x right, y down), bottom centre at (0, 0.5).
FLAME = [
    [(0.0, 0.5), (0.36, 0.5), (0.44, 0.18), (0.32, -0.04)],
    [(0.32, -0.04), (0.24, -0.2), (0.1, -0.28), (0.08, -0.57)],
    [(0.08, -0.57), (-0.06, -0.38), (-0.22, -0.3), (-0.3, -0.1)],
    [(-0.3, -0.1), (-0.42, 0.12), (-0.36, 0.5), (0.0, 0.5)],
]


def flame_mask(size: int, scale: float, offset: tuple[float, float]) -> np.ndarray:
    """Rasterise the flame outline."""
    points: list[tuple[float, float]] = []
    for segment in FLAME:
        points.extend(bezier(segment))
    center = size / 2
    polygon = [
        (
            center + (px * scale + offset[0]) * size,
            center + (py * scale + offset[1]) * size,
        )
        for px, py in points
    ]
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    return np.array(mask) > 0


def render(variant: str) -> Image.Image:
    """Render one icon at supersampled resolution."""
    size = SUPERSAMPLE
    rgba = np.zeros((size, size, 4), dtype=float)

    progress, track, ring_color = ring_layers(size)
    rgba[track] = TRACK[variant]
    rgba[progress, :3] = ring_color[progress]
    rgba[progress, 3] = 255

    outer_flame = flame_mask(size, FLAME_SCALE, (0.0, FLAME_OFFSET))
    inner_flame = flame_mask(size, INNER_FLAME_SCALE, (0.0, INNER_FLAME_OFFSET))
    # Vertical gradient up the flame: amber at the bottom, pink at the tip.
    top = 0.5 + FLAME_OFFSET - 0.57 * FLAME_SCALE
    bottom = 0.5 + FLAME_OFFSET + 0.5 * FLAME_SCALE
    rows = np.linspace(0, 1, size)[:, None].repeat(size, axis=1)
    flame_t = np.clip((bottom - rows) / (bottom - top), 0, 1)
    flame_color = gradient(flame_t)
    rgba[outer_flame, :3] = flame_color[outer_flame]
    rgba[outer_flame, 3] = 255
    inner_top = 0.5 + INNER_FLAME_OFFSET - 0.57 * INNER_FLAME_SCALE
    inner_bottom = 0.5 + INNER_FLAME_OFFSET + 0.5 * INNER_FLAME_SCALE
    inner_t = np.clip((inner_bottom - rows) / (inner_bottom - inner_top), 0, 1)[
        ..., None
    ]
    inner_color = (
        np.array(INNER_FLAME_BOTTOM) * (1 - inner_t)
        + np.array(INNER_FLAME_TOP) * inner_t
    )
    rgba[inner_flame, :3] = inner_color[inner_flame]
    rgba[inner_flame, 3] = 255

    return Image.fromarray(rgba.astype(np.uint8), "RGBA")


def main() -> None:
    """Write icon.png, icon@2x.png and the dark variants."""
    BRAND.mkdir(exist_ok=True)
    for variant, prefix in (("light", ""), ("dark", "dark_")):
        image = render(variant)
        for suffix, pixels in (("", 256), ("@2x", 512)):
            image.resize((pixels, pixels), Image.Resampling.LANCZOS).save(
                BRAND / f"{prefix}icon{suffix}.png", optimize=True
            )


if __name__ == "__main__":
    main()
