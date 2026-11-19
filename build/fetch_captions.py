#!/usr/bin/env python3
"""Fetch Turkish captions for the videos in data/videos.json with yt-dlp and bundle them as data/captions/<id>.json
(list of {t,d,x} = start s, duration s, text). Prefers uploader-made subtitles over auto-captions.
Needs yt-dlp and a network where YouTube does not bot-block (e.g. a home connection):
    pip install yt-dlp && python3 build/fetch_captions.py
No cookies are used."""
import json, os, re, subprocess, sys, tempfile, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def ts(s):
    h, m, r = s.split(':'); return int(h)*3600 + int(m)*60 + float(r)
def parse_vtt(txt):
    cues = []
    for blk in re.split(r'\n\s*\n', txt.replace('\r', '')):
        L = [l for l in blk.split('\n') if l.strip()]
        for k, l in enumerate(L):
            m = re.match(r'(\d+:\d\d:\d\d\.\d+|\d\d:\d\d\.\d+) --> (\d+:\d\d:\d\d\.\d+|\d\d:\d\d\.\d+)', l)
            if m:
                a, b = [x if x.count(':') == 2 else '00:' + x for x in m.groups()]
                t = ' '.join(re.sub(r'<[^>]+>', '', x).strip() for x in L[k+1:]).strip()
                t = re.sub(r'\s+', ' ', t)
                if t: cues.append({'t': round(ts(a), 2), 'd': round(ts(b) - ts(a), 2), 'x': t})
    # remove rolling duplicates typical of auto-captions
    out = []
    for c in cues:
        if out and c['x'] == out[-1]['x']: out[-1]['d'] = round(c['t'] + c['d'] - out[-1]['t'], 2); continue
        if out and c['x'].startswith(out[-1]['x']): t0 = out[-1]['t']; out[-1] = dict(c, t=t0, d=round(c['t'] + c['d'] - t0, 2)); continue
        out.append(c)
    return out
vids = json.load(open(f'{ROOT}/data/videos.json'))
for v in vids:
    dest = f"{ROOT}/data/captions/{v['id']}.json"
    if os.path.exists(dest): continue
    with tempfile.TemporaryDirectory() as td:
        for flag in ('--write-subs', '--write-auto-subs'):
            subprocess.run([sys.executable, '-m', 'yt_dlp', flag, '--sub-langs', 'tr', '--sub-format', 'vtt', '--skip-download',
                            '-o', f'{td}/%(id)s', 'https://www.youtube.com/watch?v=' + v['id']], capture_output=True)
            f = glob.glob(f'{td}/*.vtt')
            if f:
                cues = parse_vtt(open(f[0], encoding='utf8').read())
                if len(cues) > 5:
                    json.dump({'auto': flag == '--write-auto-subs', 'cues': cues}, open(dest, 'w'), ensure_ascii=False)
                    print('captions', v['id'], len(cues), 'auto' if flag == '--write-auto-subs' else 'manual'); break
        else: print('no captions', v['id'])
