"""Deterministic video finishing; originals untouched. Requires ffmpeg, numpy, Pillow."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
output = root / 'site/assets/academy/dossier/mascot'
output.mkdir(parents=True, exist_ok=True)
sources = {
    'idle': 'Mascot_character_idle_loop_1080p_20260927151203.mp4',
    'look': 'Mascot_reacts_to_UI_change_20260927152217.mp4',
    'surprise': 'Mascot_showing_subtle_surprise_1080p_20260927151542.mp4',
}
key_filter = 'chromakey=0x38ef05:0.14:0.07,despill=type=green,format=rgba'
tiers = [(180, ''), (360, '-2x'), (540, '-3x')]
FPS, W, H = 24, 1080, 1920

def decode(filename, width):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(filename),
        '-vf', f'{key_filter},scale={width}:{width*16//9}:flags=lanczos',
        '-an', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'])
    return np.frombuffer(raw, np.uint8).reshape(-1, width*16//9, width, 4)

def feet(frame):
    y, x = np.where(frame[int(frame.shape[0]*.87):, :, 3] > 220)
    return np.array([x.min(), x.max(), y.max()+int(frame.shape[0]*.87)], float)

def registered(frame, scale, dx, dy):
    # One uniform transform: no local deformation or synthetic motion.
    return np.asarray(Image.fromarray(frame).transform((frame.shape[1], frame.shape[0]),
        Image.Transform.AFFINE, (1/scale, 0, -dx/scale, 0, 1/scale, -dy/scale),
        resample=Image.Resampling.BICUBIC))

def match(tail, idle):
    origin = feet(tail)
    options = []
    for index in range(12, len(idle)-8):
        target = feet(idle[index])
        scale = float(np.clip((target[1]-target[0])/(origin[1]-origin[0]), .98, 1.02))
        dx = float((target[0]+target[1]-scale*(origin[0]+origin[1]))/2)
        dy = float(target[2]-scale*origin[2])
        aligned = registered(tail, scale, dx, dy)
        mask = (aligned[:,:,3] > 220) & (idle[index,:,:,3] > 220)
        error = float(np.abs(aligned[:,:,:3].astype(float)-idle[index,:,:,:3])[mask].mean())
        options.append((error, index, scale, dx, dy))
    return min(options)

def finish(frame):
    rgb = frame[:,:,:3].astype(np.float32)/255
    white = np.clip((rgb.min(axis=2, keepdims=True)-.68)/.32, 0, 1)
    rgb *= 1-.045*white
    right = np.linspace(0, 1, frame.shape[1], dtype=np.float32)[None,:,None]**3
    neutral = np.clip(1-(rgb.max(axis=2, keepdims=True)-rgb.min(axis=2, keepdims=True)), 0, 1)
    amount = .012*right*neutral
    rgb = rgb*(1-amount) + np.array([1., .76, .48], np.float32)*amount
    result = frame.copy()
    result[:,:,:3] = np.clip(np.rint(rgb*255), 0, 255).astype(np.uint8)
    return result

def bridge(a, b, weight):
    # Linear-light premultiplied alpha: opaque overlaps stay opaque.
    def linear(rgb):
        return np.where(rgb <= .04045, rgb/12.92, ((rgb+.055)/1.055)**2.4)
    aa, ba = a[:,:,3:4].astype(np.float32)/255, b[:,:,3:4].astype(np.float32)/255
    alpha = aa*(1-weight)+ba*weight
    rgb = (linear(a[:,:,:3]/255)*aa*(1-weight)+linear(b[:,:,:3]/255)*ba*weight)/np.maximum(alpha, 1e-8)
    rgb = np.where(rgb <= .0031308, rgb*12.92, 1.055*rgb**(1/2.4)-.055)
    return np.clip(np.rint(np.concatenate((rgb, alpha), axis=2)*255), 0, 255).astype(np.uint8)

thumbs = {role: decode(source/name, 180) for role, name in sources.items()}
matches = {role: match(frames[-3], thumbs['idle']) for role, frames in thumbs.items() if role != 'idle'}
manifest = {'filter': key_filter, 'audio': False, 'crf': 22, 'fps': FPS,
    'finishing': {'highlightCompression': .045, 'rightWarmth': .012,
                  'bridgeFrames': 2, 'continuationFrames': 6, 'alpha': 'linear-premultiplied'}, 'clips': {}}
with tempfile.TemporaryDirectory(prefix='aus-mascot-finish-') as tmp:
    wanted = {0}
    for _, index, *_ in matches.values():
        wanted.update(range(index, index+7))
    idle_frames = {}
    for role, name in sources.items():
        original = source/name
        info = {'source': name, 'sourceSha256': hashlib.sha256(original.read_bytes()).hexdigest(), 'variants': []}
        manifest['clips'][role] = info
        count = len(thumbs[role])
        if role != 'idle':
            error, index, scale, dx, dy = matches[role]
            dx, dy = dx*6, dy*6
            info['transition'] = {'idleAnchorFrame': index, 'idleEntryFrame': index+7,
                'idleEntryTime': (index+7)/FPS, 'bridgeStartFrame': count-2,
                'scale': scale, 'translate': [dx, dy], 'matchMae': error}
        master = Path(tmp)/(role+'.nut')
        reader = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', str(original), '-vf', key_filter,
            '-an', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], stdout=subprocess.PIPE)
        writer = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgba',
            '-video_size', f'{W}x{H}', '-framerate', str(FPS), '-i', '-', '-c:v', 'ffv1', str(master)], stdin=subprocess.PIPE)
        try:
            for i in range(count):
                data = reader.stdout.read(W*H*4)
                if len(data) != W*H*4:
                    raise RuntimeError(f'Incomplete source frame {role}:{i}')
                frame = np.frombuffer(data, np.uint8).reshape(H, W, 4)
                if role != 'idle':
                    frame = registered(frame, scale, dx, dy)
                frame = finish(frame)
                if role == 'idle' and i in wanted:
                    idle_frames[i] = frame.copy()
                if role != 'idle' and i >= count-2:
                    frame = bridge(frame, idle_frames[index], (i-(count-2)+1)/2)
                writer.stdin.write(frame.tobytes())
            if role != 'idle':
                for i in range(index+1, index+7):
                    writer.stdin.write(idle_frames[i].tobytes())
        finally:
            reader.stdout.close()
            writer.stdin.close()
        if reader.wait() or writer.wait():
            raise RuntimeError(f'Failed to prepare {role}')
        for width, suffix in tiers:
            height = width*16//9
            dest = output/(role+suffix+'.webm')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(master), '-an',
                '-vf', f'scale={width}:{height}:flags=lanczos', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p',
                '-b:v', '0', '-crf', '22', '-deadline', 'good', '-cpu-used', '3', '-auto-alt-ref', '0', str(dest)], check=True)
            info['variants'].append({'file': dest.name, 'width': width, 'height': height,
                'sha256': hashlib.sha256(dest.read_bytes()).hexdigest(), 'bytes': dest.stat().st_size})
        if role == 'idle':
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(master), '-vf', 'scale=540:960:flags=lanczos',
                '-frames:v', '1', str(output/'still.png')], check=True)
        print('Prepared', role, info.get('transition', {}), flush=True)
(output/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
