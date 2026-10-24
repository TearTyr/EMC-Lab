#!/usr/bin/env python3
"""Phase-3 GIF verification: numeric + visual-sample extraction."""
import hashlib, json, sys
from PIL import Image, ImageSequence

OUT = ".scratch/gifcheck"
FILES = {
    "seg1": ("evidence/video-analysis/reference-full-01_t000.0-t018.9.gif", 0.0, 18.916),
    "seg2": ("evidence/video-analysis/reference-full-02_t018.9-t040.2.gif", 18.916, 40.216),
    "seg3": ("evidence/video-analysis/reference-full-03_t040.2-t059.0.gif", 40.216, 59.016),
    "seg4": ("evidence/video-analysis/reference-full-04_t059.0-t070.5.gif", 59.016, 70.470),
    "flash": ("evidence/video-analysis/reference-flashes_6x30fps.gif", None, None),
}
BASE = ""
report = {}
for key, (rel, t0, t1) in FILES.items():
    import os
    p = BASE + rel
    print(key, repr(p), os.path.exists(p), flush=True)
    im = Image.open(p)
    n = im.n_frames
    durs = []
    hashes = []
    frozen_runs = []
    prev = None
    run = 0
    for i, fr in enumerate(ImageSequence.Iterator(im)):
        durs.append(fr.info.get("duration"))
        rgb = fr.convert("RGB")
        h = hashlib.md5(rgb.resize((32, 18)).tobytes()).hexdigest()[:10]
        hashes.append(h)
        if prev is not None:
            if h == prev:
                run += 1
            else:
                if run >= 12:  # >=1 s frozen at 12fps
                    frozen_runs.append((i - run, i - 1, round(run * (durs[i - 1] or 83) / 1000, 2)))
                run = 0
        prev = h
    if run >= 12:
        frozen_runs.append((n - run, n - 1, round(run * (durs[-1] or 83) / 1000, 2)))
    total_ms = sum(d for d in durs if d)
    uniq = len(set(hashes))
    # sample frames: first, middle, last
    samples = {}
    for label, idx in (("first", 0), ("mid", n // 2), ("last", n - 1)):
        im.seek(idx)
        im.convert("RGB").save(f"{OUT}/{key}-{label}.png")
        samples[label] = idx
    report[key] = {
        "file": rel, "size_px": im.size, "n_frames": n, "loop": im.info.get("loop"),
        "dur_set_ms": sorted(set(durs)), "total_s": round(total_ms / 1000, 3),
        "expected_s": (round(t1 - t0, 3) if t0 is not None else None),
        "distinct_hashes": uniq, "frozen_runs_ge1s": frozen_runs,
        "first_frame_hash": hashes[0], "last_frame_hash": hashes[-1],
        "samples_saved": samples,
    }
print(json.dumps(report, indent=1))
