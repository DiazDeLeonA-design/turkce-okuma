import json,re,time,html
from wsapi import api
def strip_templates(w):
    out=[];depth=0;i=0
    while i<len(w):
        if w.startswith('{{',i): depth+=1;i+=2;continue
        if w.startswith('}}',i) and depth: depth-=1;i+=2;continue
        if depth==0: out.append(w[i])
        i+=1
    return ''.join(out)
def clean(w):
    w=strip_templates(w)
    w=re.sub(r'<ref[^>]*>.*?</ref>','',w,flags=re.S)
    w=re.sub(r'<!--.*?-->','',w,flags=re.S)
    w=re.sub(r'\[\[(?:Kategori|Category|Dosya|File):[^\]]*\]\]','',w)
    w=re.sub(r'\[\[[^\]|]*\|([^\]]*)\]\]',r'\1',w)
    w=re.sub(r'\[\[([^\]]*)\]\]',r'\1',w)
    w=re.sub(r"'{2,}",'',w)
    w=re.sub(r'<br\s*/?>','\n',w)
    w=re.sub(r'<[^>]+>','',w)
    w=html.unescape(w).replace('\u00ad','').replace('\xa0',' ')
    paras=[]
    for line in w.split('\n'):
        line=line.strip().lstrip(':*#').strip()
        line=re.sub(r'\s+',' ',line)
        if not line or line.startswith('=') or line.startswith('|') or line.startswith('{|') or line.startswith('__'): continue
        if re.fullmatch(r'[-–—_* ]+',line): continue
        paras.append(line)
    out=[]
    for p in paras:
        p=re.sub(r'^[-–—]\s*','– ',p)
        if out and not re.search(r'[.!?…:”»"’)]$',out[-1]) and not p.startswith('–') and not re.match(r'^[“«"]',p) and not out[-1].startswith('//'):
            out[-1]+=' '+p
        else: out.append(p)
    return out
def get(title):
    r=api(action='parse',page=title,prop='wikitext|revid',redirects=1)['parse']
    return clean(r['wikitext']['*']), r['title']
def url(t): return 'https://tr.wikisource.org/wiki/'+t.replace(' ','_')
def main():
    books=[]
    # Nasreddin Hoca
    members=[];cont={}
    while True:
        r=api(action='query',list='categorymembers',cmtitle='Kategori:Nasreddin Hoca fıkraları',cmlimit=500,cmnamespace=0,**cont)
        members+= [m['title'] for m in r['query']['categorymembers']]
        if 'continue' not in r: break
        cont=r['continue']
    print(len(members),'nasreddin pages')
    fik=[]
    BAD=re.compile(r'cima|göt|\bsik|zeker|seks|\bam\b|amını|yatak|çıplak|kerhane|fahişe|orospu|kaltak|karı koca|zina|nikâh|nikah|gebe|hamile|memesi|\bbok|ırz|oğlan|kuyruk sok|\bamcık|kahpe|öldür|ölü|cenaze|mezar|\bdul\b',re.I)
    for t in members:
        try: ps,tt=get(t)
        except Exception as e: print('skip',t,e); continue
        n=sum(len(p.split()) for p in ps)
        if 30<=n<=120 and not BAD.search(' '.join(ps)) and 'Tilki' not in t: fik.append((t,ps,n))
    print(len(fik),'usable fıkra')
    fik.sort(key=lambda x:x[2])
    import random; random.seed(3)
    sel=fik[:]
    half=len(sel)//2
    def mk(id,title,lvl,items,desc):
        return dict(id=id,title=title,author='Anonymous (Nasreddin Hoca folk tradition)',level=lvl,desc=desc,
          source='tr.wikisource.org — Kategori:Nasreddin Hoca fıkraları',
          license='Anonymous folk tales hosted on Turkish Wikisource (free content only). Individual page URLs listed in sources.md',
          paras=[x for t,ps,n in items for x in ([{'h':t}]+[{'t':p} for p in ps])], pages=[url(t) for t,_,_ in items])
    random.shuffle(sel)
    A=sorted(sel[:16],key=lambda x:x[2])
    B=sorted(sel[16:32],key=lambda x:x[2])
    books.append(mk('nasreddin-1','Nasreddin Hoca Fıkraları 1','A1',A,'Very short jokes about the clever, funny Hoca. Great first reading.'))
    if B: books.append(mk('nasreddin-2','Nasreddin Hoca Fıkraları 2','A2',B,'More Nasreddin Hoca stories, a little longer.'))
    # masallar
    for id,t,lvl,desc in [('keloglan','Keloğlan ve Padişah','A2','A folk tale about Keloğlan, the clever bald boy, and the Sultan.'),
       ('karanan','Karanan ile Tilki','A2','A short folk tale about Karanan and the fox.')]:
        ps,tt=get(t)
        if id=='keloglan': ps=[p for p in ps if not p.startswith('Metel metel')]
        books.append(dict(id=id,title=tt,author='Anonymous (Turkish folk tale)',level=lvl,desc=desc,source='tr.wikisource.org — '+tt,
          license='Anonymous Turkish folk tale (halk masalı), hosted on Turkish Wikisource (free content)',paras=[{'t':p} for p in ps],pages=[url(tt)]))
    # Ömer Seyfettin
    os_=[('yuzaki','Yüzakı','B1','A short comedy about a promised ransom.'),
     ('nasil-kurtarmis','Nasıl Kurtarmış?','B1','A satirical short story.'),
     ('kesik-biyik','Kesik Bıyık','B1','Funny story about copying fashion and a shaved moustache.'),
     ('kasagi','Kaşağı','B2','A boy, a curry-comb and a lesson in justice.'),
     ('cakmak','Çakmak','B2','Story of a lighter and war-time memories.'),
     ('ask-ayak','Aşk ve Ayak Parmakları','B2','A comic story about love and a surprising discovery.'),
     ('forsa','Forsa','B2','A tale of a galley slave in Ottoman times.'),
     ('kurbaga-duasi','Kurbağa Duası','C1','A longer story with older vocabulary.')]
    for id,t,lvl,desc in os_:
        ps,tt=get(t)
        disp=re.sub(r' \(hikâye\)','',tt)
        books.append(dict(id=id,title=disp,author='Ömer Seyfettin (1884–1920)',level=lvl,desc=desc,source='tr.wikisource.org — '+tt,
          license='Public domain: author died 1920 (life+70 years long expired); hosted on Turkish Wikisource',paras=[{'t':p} for p in ps],pages=[url(tt)]))
    import os
    os.makedirs('../data',exist_ok=True)
    json.dump(books,open('../data/books.json','w'),ensure_ascii=False,indent=0)
    for b in books: print(b['id'],b['level'],len(b['paras']),sum(len(p.get('t','').split()) for p in b['paras']))

if __name__=='__main__': main()
