#!/usr/bin/env python3
"""Verify the curated list of OFFICIAL-channel videos via YouTube oEmbed and write data/videos.json.
Only videos that exist AND are embeddable (oEmbed 200) are kept; author_url must match the expected official channel."""
import json, urllib.request, urllib.parse, urllib.error, os, time, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH = {
 'trt':  ('TRT Çocuk', 'https://www.youtube.com/@trtcocuk', 'Official TRT Çocuk channel (Turkish public broadcaster, verified)'),
 'raf':  ('Rafadan Tayfa', 'https://www.youtube.com/@rafadantayfaofficial', 'Official Rafadan Tayfa channel ("resmi Youtube sayfası")'),
 'nil':  ('Niloya', 'https://www.youtube.com/@niloyatv', 'Official Niloya channel'),
 'pep':  ('Pepee', 'https://www.youtube.com/@pepeedunyasi', 'Official Pepee channel (by Düşyeri, the studio that makes Pepee)'),
}
# id, channel key, level, kind, duration(s), short description (English)
V = [
 ('SXyoCF8HxwE','nil','A1','Cartoon',4109,'Niloya episodes 1–13. Very short, simple episodes for beginners.'),
 ('BVM1bC_s_XM','pep','A1','Cartoon',2459,'Four Pepee episodes. Simple, slow-paced kids’ episodes for beginners.'),
 ('Ywpudy3yN4Y','trt','A1','Fable',392,'Masal Kitabı: “Aslan ile Fare” (The Lion and the Mouse). A short narrated story.'),
 ('0vkI0IGP2Bo','trt','A1','Fable',411,'Masal Kitabı: “Kibirli Karga” (The Proud Crow). A short narrated story.'),
 ('su2enN1kTMc','trt','A2','Kids show',1434,'Çocukçuf, episode 69 “Sayılar” (Numbers). Educational kids’ show.'),
 ('i6CaSebAFTU','trt','A2','Cartoon',891,'Pırıl: “Efe Ders Çalışıyor”. Kids’ cartoon about school and family life.'),
 ('ln-GIGLqGcU','trt','A2','Cartoon',519,'Tuhafiye, episode 1. Short kids’ episode with everyday dialogue.'),
 ('HO68xQvs2TY','trt','A2','Kids show',1500,'Çocukçuf, episode 12 “Mevsimler” (The Seasons).'),
 ('WP9soQviMXM','trt','B1','Cartoon',982,'Rafadan Tayfa: “Bayrak Kapmaca” (Capture the Flag). Kids’ everyday conversation.'),
 ('4NgeB8fC6jY','trt','B1','Cartoon',775,'Rafadan Tayfa: “Hıçkırık” (The Hiccups).'),
 ('5-mb0mLaF68','raf','B1','Cartoon',875,'Rafadan Tayfa, episode 82 “Tamtam’ın Dönüşü”.'),
 ('Mn8jDBdvoHs','trt','B1','Tale',576,'Kız Kulesi Masalları: “Kıymetli Kediler”, a folk tale told aloud.'),
 ('dvXcSC3vmPk','trt','B1','Cartoon',852,'Keloğlan: “İsraf” (Waste). The folk hero in a modern animated series.'),
 ('ox4tIavTxuw','trt','B1','Cartoon',818,'Keloğlan: “Üzgün Ağaç” (The Sad Tree).'),
 ('tdrQOQ1rMoA','trt','B1','Cartoon',884,'Keloğlan: “Nasreddin Hoca”. Keloğlan meets Nasreddin Hoca (you may know him from the Library!).'),
 ('sXrs4gWvyLA','trt','B2','Cartoon',1119,'Keloğlan: “Hayalet Madenci” (The Ghost Miner). Longer story, richer vocabulary.'),
]
def oembed(i):
    u = 'https://www.youtube.com/oembed?format=json&url=' + urllib.parse.quote('https://www.youtube.com/watch?v=' + i, safe='')
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=20) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return {'error': e.code}
out = []; bad = []
for i, ch, lv, kind, dur, desc in V:
    d = oembed(i); time.sleep(.3)
    if 'error' in d: bad.append((i, d['error'])); continue
    name, url, why = CH[ch]
    if d['author_url'].lower() != url.lower(): bad.append((i, 'author ' + d['author_url'])); continue
    has = os.path.exists(f'{ROOT}/data/captions/{i}.json')
    out.append(dict(id=i, ytId=i, title=d['title'], channel=name, channelUrl=url, official=why, level=lv, kind=kind, dur=dur, desc=desc, caps=has))
    print('OK ', i, name, '|', d['title'][:60], '| captions' if has else '')
json.dump(out, open(f'{ROOT}/data/videos.json', 'w'), ensure_ascii=False, indent=1)
print(len(out), 'videos kept;', 'rejected:', bad)
