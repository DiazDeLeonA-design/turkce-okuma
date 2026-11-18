import json,sys,urllib.request,urllib.parse
UA="TurkishReaderBuild/1.0 (personal learning project)"
def api(**p):
    p['format']='json'
    u="https://tr.wikisource.org/w/api.php?"+urllib.parse.urlencode(p)
    return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=30))
if __name__=="__main__":
    r=api(action='parse',page=sys.argv[1],prop='wikitext|links')
    print(r['parse']['wikitext']['*'][:int(sys.argv[2]) if len(sys.argv)>2 else 4000])
