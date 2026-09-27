"""Check baked continuity, alpha and reproducible asset manifest, not just filenames."""
import hashlib
import json
from pathlib import Path
import subprocess
import numpy as np

root = Path(__file__).resolve().parents[1]
assets = root/'site/assets/academy/dossier/mascot'
manifest = json.loads((assets/'manifest.json').read_text())
frames = {}
for role, info in manifest['clips'].items():
    for variant in info['variants']:
        path = assets/variant['file']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == variant['sha256']
        probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', str(path)]))
        assert len(probe['streams']) == 1
        stream = probe['streams'][0]
        assert stream['codec_type'] == 'video' and stream['width'] == variant['width']
        assert stream['tags']['alpha_mode'] == '1'
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-c:v', 'libvpx-vp9', '-i',
        str(assets/(role+'.webm')), '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'])
    frames[role] = np.frombuffer(raw, np.uint8).reshape(-1,320,180,4)
idle = frames['idle']
for role in ('look', 'surprise'):
    reaction = frames[role]
    transition = manifest['clips'][role]['transition']
    entry = transition['idleEntryFrame']
    assert len(reaction) == 102 and len(idle) == 96
    # Six appended frames must match the idle content, not a frozen final poster.
    for offset in range(6):
        a, b = reaction[-6+offset], idle[entry-6+offset]
        mask = (a[:,:,3]>245) & (b[:,:,3]>245)
        error = np.abs(a[:,:,:3].astype(float)-b[:,:,:3])[mask].mean()
        assert error < 4, (role, offset, error)
    # Interior alpha stays opaque through the join: no CSS-style opacity dip.
    common = (reaction[93,:,:,3]>253) & (idle[transition['idleAnchorFrame'],:,:,3]>253)
    assert (reaction[94,:,:,3][common]>=248).mean() > .99
    a, b = reaction[-1], idle[entry]
    mask = (a[:,:,3]>245)&(b[:,:,3]>245)
    error = float(np.abs(a[:,:,:3].astype(float)-b[:,:,:3])[mask].mean())
    assert error < 6, (role, 'return discontinuity', error)
    print(f'PASS {role}: exact continuation, opaque bridge; return seam MAE={error:.3f}/255')
