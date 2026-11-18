import json,re,time,html,urllib.parse
from wsapi import api
from fetch_books import strip_templates
def lines_of(w):
    w=re.sub(r'\{\{\s*girinti\s*\|[^}]*\}\}','\n',w,flags=re.I)
    w=re.sub(r'\{\{\s*söz\s*\|(.*?)\}\}',r'\1',w,flags=re.I|re.S)
    w=re.split(r'\n==',w)[0]                                # drop other-language / notes sections
    w=strip_templates(w)
    w=re.sub(r'<ref[^>]*>.*?</ref>','',w,flags=re.S); w=re.sub(r'<ref[^>]*/>','',w)
    w=re.sub(r'\[\[(?:Kategori|Dosya|Media|File)[^\]]*\]\]','',w)
    w=re.sub(r'\[\[[^\]|]*\|([^\]]*)\]\]',r'\1',w); w=re.sub(r'\[\[([^\]]*)\]\]',r'\1',w)
    w=re.sub(r'<br\s*/?>','\n',w); w=re.sub(r'</?poem>|</?div[^>]*>','',w); w=re.sub(r'<[^>]+>','',w)
    w=html.unescape(w).replace('\xa0',' ')
    out=[];
    for l in w.split('\n'):
        l=l.strip().lstrip(':*#').strip(); l=re.sub(r"'{2,}",'',l); l=re.sub(r'\s+',' ',l)
        if l=='' : out.append(''); continue
        if l.startswith('|') or l.startswith('}}') or l.startswith('{|') : continue
        out.append(l)
    # collapse blank runs
    # drop immediately repeated stanzas
    stz=[x for x in '\n'.join(out).split('\n\n')]; ded=[]
    for x in stz:
        if not ded or x.strip()!=ded[-1].strip(): ded.append(x)
    out=('\n\n'.join(ded)).split('\n')
    txt='\n'.join(out); txt=re.sub(r'\n{3,}','\n\n',txt).strip()
    return txt
SONGS=[ # id, wikisource title, display, kind, difficulty, region/note, search query
 ('uskudar','Üsküdar’a Gider İken','Üsküdar’a Gider İken','Türkü (İstanbul)','A2',"Istanbul folk song – the most famous Turkish folk song abroad ('Katibim')",'Üsküdar’a gider iken türkü'),
 ('guvercin','Bir Beyaz Güvercin Olsam','Bir Beyaz Güvercin Olsam','Türkü (Rumeli)','B1','Folk song from Rumeli (Balkans)','Bir beyaz güvercin olsam türkü'),
 ('canakkale','Çanakkale İçinde Aynalı Çarşı','Çanakkale İçinde Aynalı Çarşı','Türkü (Kastamonu)','B1','Folk song, a love song','Çanakkale içinde aynalı çarşı türkü'),
 ('yesil-cinar','Bahçede Yeşil Çınar','Bahçede Yeşil Çınar','Türkü (Rumeli)','B1','Folk song from Rumeli (Balkans)','Bahçede yeşil çınar türkü'),
 ('yonca','Evlerinin Önü Yonca','Evlerinin Önü Yonca','Türkü (Sivas)','B1','Folk song from Sivas','Evlerinin önü yonca türkü'),
 ('sari-gelin','Sarı Gelin','Sarı Gelin','Türkü (Erzurum)','B1','Folk song from Erzurum','Sarı Gelin türkü'),
 ('dere-boyu','Dere Boyu Yeşillik','Dere Boyu Yeşillik','Türkü (İstanbul)','A2','Playful Istanbul folk song','Dere boyu yeşillik türkü'),
 ('yagmur-yagar','Yağmur Yağar Yerlere','Yağmur Yağar Yerlere','Türkü (Eskişehir)','A2','Short folk song about rain','Yağmur yağar yerlere türkü'),
 ('yagmur-yagiyor','Yağmur yağıyor','Yağmur Yağıyor','Children’s song','A1','Traditional children’s rhyme, very easy','Yağmur yağıyor seller akıyor çocuk şarkısı'),
 ('ebe-ebe','Ebe ebe nerede','Ebe Ebe Nerede','Children’s rhyme','A1','Hide-and-seek counting rhyme','Ebe ebe nerede tekerleme çocuk'),
]
LULL=['Ninni ninni ninnice','Ninni çaldım beşiğine','Kavak gibi boylanasın ninni','Ninni de ninni demekten']
def vids(w): return list(dict.fromkeys(re.findall(r'v=([\w-]{11})',w)))
def get(t):
    r=api(action='parse',page=t,prop='wikitext|categories',redirects=1)['parse']
    w=r['wikitext']['*']; cats=[c['*'] for c in r['categories']]
    assert 'Anonim_metinler' in cats and ('Anonim eser' in w or 'Anonim' in w), t
    return w,r['title'],cats
def main():
    out=[]
    for id,t,disp,kind,lvl,desc,q in SONGS:
        w,tt,cats=get(t); txt=lines_of(w); time.sleep(0.3)
        out.append(dict(id=id,title=disp,kind=kind,level=lvl,desc=desc,lyrics=txt,source='https://tr.wikisource.org/wiki/'+tt.replace(' ','_'),
          license='Anonymous traditional song (tagged “Anonim metinler”, {{Anonim eser}}) on Turkish Wikisource – public domain',
          yt_search='https://www.youtube.com/results?search_query='+urllib.parse.quote(q),wsvids=vids(w)))
    ls=[];pages=[]
    for t in LULL:
        w,tt,cats=get(t); ls.append(lines_of(w)); pages.append('https://tr.wikisource.org/wiki/'+tt.replace(' ','_')); time.sleep(0.3)
    out.append(dict(id='ninniler',title='Ninniler (lullabies)',kind='Ninni (lullabies)',level='A1',desc='Four traditional Turkish lullabies.',lyrics='\n\n'.join(ls),source=', '.join(pages),
      license='Anonymous traditional lullabies (tagged “Anonim metinler”, {{Anonim eser}}) on Turkish Wikisource – public domain',
      yt_search='https://www.youtube.com/results?search_query='+urllib.parse.quote('Türk ninnileri ninni ninni ninnice'),wsvids=[]))
    YT={'uskudar':'SFwCw1mZd1g','canakkale':'v0F6pHVc97U','yagmur-yagiyor':'qK9vLERvRJ0','sari-gelin':'5Kx2I0wU96Y'}  # verified via YouTube oEmbed
    NOTE={'uskudar':'Recording: Safiye Ayla (Columbia, 1940s)','canakkale':'Recording: user upload "Çanakkale Türküsü"','yagmur-yagiyor':'Recording: Çizge TV children’s version','sari-gelin':'Recording: Cem Adrian, live (a modern arrangement/performance)'}
    for x in out:
        x['lyrics']=x['lyrics'].replace('Çanakkkale','Çanakkale')
        x['ytId']=YT.get(x['id'],''); x['ytNote']=NOTE.get(x['id'],''); x.pop('wsvids',None)
    json.dump(out,open('../data/songs.json','w'),ensure_ascii=False,indent=1)
    for x in out: print(x['id'],x['ytId'],len(x['lyrics'].split('\n')))
if __name__=='__main__': main()
