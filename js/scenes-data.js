// Picture Words scenes. Emoji art: OpenMoji (CC BY-SA 4.0, https://openmoji.org). Backgrounds: original SVG.
// o(): [emojiHex, x, y, size, turkish, plural, english]    d(): drawn object (hotspot box [x,y,w,h])
const o=(hex,x,y,s,tr,pl,en)=>({hex,x,y,s,tr,pl,en});
const d=(box,tr,pl,en)=>({box,tr,pl,en});
const plank=(x,y,w,c='#8b5a2b')=>`<rect x="${x}" y="${y}" width="${w}" height="9" rx="3" fill="${c}"/><rect x="${x}" y="${y+9}" width="${w}" height="3" fill="#000" opacity=".12"/>`;
const awning=()=>{let s='';for(let i=0;i<10;i++){s+=`<rect x="${i*40}" y="0" width="40" height="40" fill="${i%2?'#fff':'#e53935'}"/><circle cx="${i*40+20}" cy="40" r="20" fill="${i%2?'#fff':'#e53935'}"/>`}return s};
const tiles=(y1,y2,c)=>{let s='';for(let y=y1;y<y2;y+=26)s+=`<line x1="0" y1="${y}" x2="400" y2="${y}" stroke="${c}" stroke-width="1.5"/>`;for(let x=0;x<400;x+=26)s+=`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${c}" stroke-width="1.5"/>`;return s};

export const SCENES=[
{id:'mutfak',title:'Mutfak',en:'The kitchen',icon:'1F373',
 bg:`<rect width="400" height="420" fill="#fbeed6"/>${tiles(190,300,'#ecd6b3')}
  <rect y="330" width="400" height="90" fill="#c99a6b"/>${[0,1,2,3,4].map(i=>`<line x1="0" y1="${345+i*18}" x2="400" y2="${345+i*18}" stroke="#b5835a" stroke-width="2"/>`).join('')}
  <rect x="250" y="30" width="120" height="100" rx="6" fill="#bfe6ff" stroke="#8b5a2b" stroke-width="8"/><line x1="310" y1="30" x2="310" y2="130" stroke="#8b5a2b" stroke-width="6"/><line x1="250" y1="80" x2="370" y2="80" stroke="#8b5a2b" stroke-width="6"/><circle cx="283" cy="55" r="10" fill="#fff" opacity=".7"/>
  ${plank(15,148,215)}<path d="M30 157v14M210 157v14" stroke="#8b5a2b" stroke-width="4"/>
  <rect x="0" y="298" width="290" height="14" fill="#7a5230"/><rect x="0" y="312" width="290" height="40" fill="#a8734a"/><line x1="97" y1="312" x2="97" y2="352" stroke="#7a5230" stroke-width="3"/><line x1="194" y1="312" x2="194" y2="352" stroke="#7a5230" stroke-width="3"/>
  <rect x="305" y="150" width="82" height="205" rx="10" fill="#e8eff5" stroke="#9aa7b3" stroke-width="3"/><line x1="305" y1="228" x2="387" y2="228" stroke="#9aa7b3" stroke-width="3"/><rect x="316" y="170" width="6" height="40" rx="3" fill="#9aa7b3"/><rect x="316" y="244" width="6" height="50" rx="3" fill="#9aa7b3"/>
  <rect x="25" y="375" width="260" height="14" rx="4" fill="#8b5a2b"/><rect x="45" y="389" width="12" height="31" fill="#6e4521"/><rect x="253" y="389" width="12" height="31" fill="#6e4521"/>`,
 objs:[
  o('1FAD6',24,102,46,'çaydanlık','çaydanlıklar','teapot'),o('2615',76,102,46,'fincan','fincanlar','cup'),o('1F9C2',126,102,46,'tuz','tuzlar','salt'),o('1F36F',172,102,46,'bal','ballar','honey'),
  o('1F373',16,250,50,'tava','tavalar','frying pan'),o('1F52A',72,250,50,'bıçak','bıçaklar','knife'),o('1F944',124,250,50,'kaşık','kaşıklar','spoon'),o('1F35E',176,246,56,'ekmek','ekmekler','bread'),o('1F95A',236,250,48,'yumurta','yumurtalar','egg'),
  o('1F34E',38,326,50,'elma','elmalar','apple'),o('1F34C',98,326,50,'muz','muzlar','banana'),o('1F95B',158,326,50,'süt','sütler','milk'),o('1F9C0',218,326,50,'peynir','peynirler','cheese'),
  d([305,150,82,205],'buzdolabı','buzdolapları','refrigerator'),d([250,30,120,100],'pencere','pencereler','window'),d([25,372,260,50],'masa','masalar','table')]},
{id:'pazar',title:'Pazar',en:'The market',icon:'1F955',
 bg:`<rect width="400" height="420" fill="#fff7e6"/>${awning()}
  ${[128,218,308,398].map(y=>plank(8,y,384)).join('')}${[128,218,308].map(y=>`<rect x="8" y="${y+12}" width="384" height="${78-12}" fill="#e9c98f" opacity=".55"/>`).join('')}`,
 objs:[
  o('1F345',24,70,56,'domates','domatesler','tomato'),o('1F955',96,70,56,'havuç','havuçlar','carrot'),o('1F954',168,70,56,'patates','patatesler','potato'),o('1F9C5',240,70,56,'soğan','soğanlar','onion'),o('1F9C4',312,70,56,'sarımsak','sarımsaklar','garlic'),
  o('1F347',24,160,56,'üzüm','üzümler','grapes'),o('1F349',96,160,56,'karpuz','karpuzlar','watermelon'),o('1F34A',168,160,56,'portakal','portakallar','orange'),o('1F353',240,160,56,'çilek','çilekler','strawberry'),o('1F350',312,160,56,'armut','armutlar','pear'),
  o('1F351',24,250,56,'şeftali','şeftaliler','peach'),o('1F952',96,250,56,'salatalık','salatalıklar','cucumber'),o('1F33D',168,250,56,'mısır','mısırlar','corn'),o('1F346',240,250,56,'patlıcan','patlıcanlar','eggplant'),o('1F336',312,250,56,'biber','biberler','pepper'),
  o('1F9FA',24,338,56,'sepet','sepetler','basket'),o('2696',96,338,56,'terazi','teraziler','scales')]},
{id:'sokak',title:'Sokak',en:'The street',icon:'1F68C',
 bg:`<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd8ff"/><stop offset="1" stop-color="#e8f6ff"/></linearGradient></defs><rect width="400" height="420" fill="url(#sk)"/>
  <rect y="255" width="400" height="40" fill="#cfc9be"/><rect y="295" width="400" height="95" fill="#5d646b"/><rect y="390" width="400" height="30" fill="#7fc36d"/>
  ${[0,1,2,3,4,5,6].map(i=>`<rect x="${10+i*58}" y="338" width="34" height="6" rx="3" fill="#f5f1d8"/>`).join('')}`,
 objs:[
  o('2708',305,6,54,'uçak','uçaklar','airplane'),
  o('1F54C',6,40,76,'cami','camiler','mosque'),o('1F3E5',92,40,76,'hastane','hastaneler','hospital'),o('1F3EB',178,40,76,'okul','okullar','school'),o('1F3E2',264,40,76,'bina','binalar','building'),
  o('1F3E6',6,130,72,'banka','bankalar','bank'),o('1F3EA',92,130,72,'bakkal','bakkallar','grocery store'),o('1F3E0',178,130,72,'ev','evler','house'),o('1F309',264,130,72,'köprü','köprüler','bridge'),
  o('1F333',10,205,60,'ağaç','ağaçlar','tree'),o('1F6A6',84,205,60,'trafik ışığı','trafik ışıkları','traffic light'),o('26F2',158,205,60,'çeşme','çeşmeler','fountain'),
  o('1F68C',10,268,70,'otobüs','otobüsler','bus'),o('1F695',100,268,70,'taksi','taksiler','taxi'),o('1F697',190,268,70,'araba','arabalar','car'),o('1F6B2',284,268,66,'bisiklet','bisikletler','bicycle'),
  o('1F686',20,336,62,'tren','trenler','train')]},
{id:'vucut',title:'Vücut',en:'The body',icon:'1F9CD',vb:[300,470],vbox:'50 10 300 470',body:true,
 bg:`<rect width="400" height="480" fill="#eaf4ff"/>
  <ellipse cx="200" cy="468" rx="110" ry="9" fill="#000" opacity=".1"/>
  <g fill="#f2c9a0" stroke="#d9a574" stroke-width="3">
   <rect x="186" y="132" width="28" height="30" rx="8"/>
   <rect x="110" y="158" width="34" height="140" rx="17"/><rect x="256" y="158" width="34" height="140" rx="17"/>
   <circle cx="127" cy="312" r="19"/><circle cx="273" cy="312" r="19"/>
   <rect x="146" y="296" width="52" height="150" rx="22"/><rect x="202" y="296" width="52" height="150" rx="22"/>
   <ellipse cx="170" cy="452" rx="30" ry="11"/><ellipse cx="230" cy="452" rx="30" ry="11"/>
   <circle cx="145" cy="90" r="11"/><circle cx="255" cy="90" r="11"/>
   <circle cx="200" cy="85" r="54"/></g>
  <rect x="140" y="152" width="120" height="162" rx="30" fill="#4aa3df"/><rect x="146" y="296" width="108" height="42" rx="12" fill="#35608f"/>
  <path d="M146 78c4-52 104-52 108 0c-18-22-90-22-108 0z" fill="#4b2e1f"/><path d="M148 70c10-46 94-46 104 0c-30-26-74-26-104 0z" fill="#4b2e1f"/>
  <ellipse cx="177" cy="86" rx="7" ry="9" fill="#fff"/><ellipse cx="223" cy="86" rx="7" ry="9" fill="#fff"/><circle cx="177" cy="87" r="4" fill="#3b2a20"/><circle cx="223" cy="87" r="4" fill="#3b2a20"/>
  <path d="M200 92v14q-6 4 0 4" stroke="#c98d5f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M184 120q16 12 32 0" stroke="#c0504d" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M118 322v14M127 326v14M136 322v14M264 322v14M273 326v14M282 322v14" stroke="#d9a574" stroke-width="5" stroke-linecap="round"/>`,
 dots:true,
 objs:[
  d([180,30,40,30],'saç','saçlar','hair'),d([218,48,28,22],'baş','başlar','head'),d([166,74,22,26],'göz','gözler','eye'),d([128,76,24,28],'kulak','kulaklar','ear'),d([188,94,24,20],'burun','burunlar','nose'),d([186,110,28,20],'ağız','ağızlar','mouth'),
  d([186,134,28,24],'boyun','boyunlar','neck'),d([134,158,30,24],'omuz','omuzlar','shoulder'),d([108,190,32,40],'kol','kollar','arm'),d([108,232,32,28],'dirsek','dirsekler','elbow'),d([108,300,38,34],'el','eller','hand'),d([100,322,24,24],'parmak','parmaklar','finger'),
  d([176,184,48,30],'göğüs','göğüsler','chest'),d([176,240,48,34],'karın','karınlar','stomach'),d([210,330,40,50],'bacak','bacaklar','leg'),d([150,372,44,30],'diz','dizler','knee'),d([148,440,44,24],'ayak','ayaklar','foot')]},
{id:'sinif',title:'Sınıf',en:'The classroom',icon:'1F4DA',
 bg:`<rect width="400" height="420" fill="#e8efe3"/><rect y="335" width="400" height="85" fill="#c8a77a"/>
  <rect x="26" y="26" width="236" height="128" rx="6" fill="#2f5d47" stroke="#8b5a2b" stroke-width="8"/><text x="144" y="75" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="#f7f7f0" opacity=".9">A B C Ç D</text><text x="144" y="115" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#f7f7f0" opacity=".85">1 + 2 = 3</text><rect x="40" y="154" width="206" height="7" rx="3" fill="#8b5a2b"/>
  ${plank(20,222,360)}
  <rect x="24" y="312" width="250" height="14" rx="4" fill="#8b5a2b"/><rect x="44" y="326" width="12" height="94" fill="#6e4521"/><rect x="244" y="326" width="12" height="94" fill="#6e4521"/>`,
 objs:[
  o('1F550',292,28,54,'saat','saatler','clock'),o('1F5FA',300,92,62,'harita','haritalar','map'),
  o('1F30D',28,172,50,'dünya','dünyalar','world / globe'),o('1F52C',92,172,50,'mikroskop','mikroskoplar','microscope'),o('1F5A5',156,172,50,'bilgisayar','bilgisayarlar','computer'),o('1F4DA',220,172,50,'kitap','kitaplar','book'),o('1F4CE',285,172,44,'ataç','ataçlar','paper clip'),
  o('1F4D3',38,262,50,'defter','defterler','notebook'),o('270F',96,262,50,'kurşun kalem','kurşun kalemler','pencil'),o('1F4CF',154,262,50,'cetvel','cetveller','ruler'),o('2702',212,262,50,'makas','makaslar','scissors'),
  o('1F392',296,262,64,'sırt çantası','sırt çantaları','backpack'),o('1FA91',300,335,60,'sandalye','sandalyeler','chair'),
  d([26,26,236,128],'tahta','tahtalar','board'),d([24,306,250,40],'sıra','sıralar','desk')]},
{id:'doga',title:'Park',en:'Nature & the park',icon:'1F333',
 bg:`<defs><linearGradient id="sk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8ff"/><stop offset="1" stop-color="#e6f6ff"/></linearGradient></defs><rect width="400" height="420" fill="url(#sk2)"/>
  <ellipse cx="90" cy="270" rx="220" ry="60" fill="#8ccf74"/><ellipse cx="330" cy="285" rx="200" ry="55" fill="#7cc566"/><rect y="285" width="400" height="135" fill="#6bbf59"/>
  <ellipse cx="210" cy="360" rx="120" ry="38" fill="#4aa3df"/><ellipse cx="210" cy="356" rx="104" ry="30" fill="#6cbcf0" opacity=".8"/>`,
 objs:[
  o('2600',324,10,58,'güneş','güneşler','sun'),o('2601',26,18,60,'bulut','bulutlar','cloud'),o('1F308',130,24,70,'gökkuşağı','gökkuşakları','rainbow'),o('1F426',252,64,40,'kuş','kuşlar','bird'),
  o('26F0',270,120,90,'dağ','dağlar','mountain'),o('1FA81',170,126,50,'uçurtma','uçurtmalar','kite'),o('1F98B',68,128,46,'kelebek','kelebekler','butterfly'),
  o('1F333',8,170,90,'ağaç','ağaçlar','tree'),o('1F33B',120,226,50,'ayçiçeği','ayçiçekleri','sunflower'),o('1F338',186,238,46,'çiçek','çiçekler','flower'),o('1F41D',250,214,40,'arı','arılar','bee'),o('1F344',310,246,46,'mantar','mantarlar','mushroom'),
  o('1FAA8',26,290,46,'taş','taşlar','rock'),o('1F342',92,296,44,'yaprak','yapraklar','leaf'),o('1F986',184,318,52,'ördek','ördekler','duck'),d([90,330,240,64],'göl','göller','lake')]},
{id:'giysiler',title:'Giysiler',en:'Clothing',icon:'1F455',
 bg:`<rect width="400" height="420" fill="#f6ecf8"/>
  <path d="M0 52Q200 96 400 52" stroke="#8b6b4a" stroke-width="3" fill="none"/>
  ${plank(10,214,380,'#a07850')}${plank(10,308,380,'#a07850')}${plank(10,402,380,'#a07850')}`,
 objs:[
  o('1F455',16,64,68,'tişört','tişörtler','T-shirt'),o('1F457',92,64,68,'elbise','elbiseler','dress'),o('1F456',168,64,68,'pantolon','pantolonlar','trousers'),o('1F9E5',244,64,68,'ceket','ceketler','coat / jacket'),o('1FA73',320,64,68,'şort','şortlar','shorts'),
  o('1F452',16,156,56,'şapka','şapkalar','hat'),o('1F9E3',92,156,56,'atkı','atkılar','scarf'),o('1F9E4',168,156,56,'eldiven','eldivenler','glove'),o('1F453',244,156,56,'gözlük','gözlükler','glasses'),o('1F454',320,156,56,'kravat','kravatlar','tie'),
  o('1F9E6',16,250,56,'çorap','çoraplar','sock'),o('1F462',92,250,56,'bot','botlar','boot'),o('1F45E',168,250,56,'ayakkabı','ayakkabılar','shoe'),o('1F45C',244,250,56,'çanta','çantalar','handbag'),o('1F459',320,250,56,'mayo','mayolar','swimsuit'),
  o('1F48D',16,344,52,'yüzük','yüzükler','ring'),o('1F451',92,344,52,'taç','taçlar','crown'),o('231A',168,344,52,'kol saati','kol saatleri','wristwatch')]},
{id:'hayvanlar',title:'Hayvanlar',en:'Animals',icon:'1F436',
 bg:`<rect width="400" height="420" fill="#bfe6ff"/>
  ${[0,1,2,3].map(i=>`<rect y="${18+i*100}" width="400" height="92" fill="${i%2?'#7cc566':'#8ccf74'}"/>`).join('')}
  ${[0,1,2,3].map(i=>`<rect y="${100+i*100}" width="400" height="10" fill="#6aa857" opacity=".7"/>`).join('')}`,
 objs:[
  o('1F436',16,28,64,'köpek','köpekler','dog'),o('1F431',92,28,64,'kedi','kediler','cat'),o('1F434',168,28,64,'at','atlar','horse'),o('1F42E',244,28,64,'inek','inekler','cow'),o('1F411',320,28,64,'koyun','koyunlar','sheep'),
  o('1F410',16,128,64,'keçi','keçiler','goat'),o('1F413',92,128,64,'horoz','horozlar','rooster'),o('1F414',168,128,64,'tavuk','tavuklar','chicken'),o('1F407',244,128,64,'tavşan','tavşanlar','rabbit'),o('1FACF',320,128,64,'eşek','eşekler','donkey'),
  o('1F41F',16,228,64,'balık','balıklar','fish'),o('1F422',92,228,64,'kaplumbağa','kaplumbağalar','turtle'),o('1F40D',168,228,64,'yılan','yılanlar','snake'),o('1F412',244,228,64,'maymun','maymunlar','monkey'),o('1F98A',320,228,64,'tilki','tilkiler','fox'),
  o('1F981',16,328,64,'aslan','aslanlar','lion'),o('1F418',92,328,64,'fil','filler','elephant'),o('1F43B',168,328,64,'ayı','ayılar','bear'),o('1F43A',244,328,64,'kurt','kurtlar','wolf')]},
{id:'evde',title:'Evde',en:'At home',icon:'1F3E0',
 bg:`<rect width="400" height="420" fill="#e9f1fb"/><rect y="215" width="400" height="205" fill="#d8ecf0"/>${tiles(215,420,'#bcd9df')}
  <rect y="205" width="400" height="12" fill="#b08a5f"/>
  ${plank(10,118,380,'#a07850')}${plank(10,196,380,'#a07850')}`,
 objs:[
  o('1F5BC',14,34,60,'tablo','tablolar','picture / painting'),o('1FA9E',92,34,60,'ayna','aynalar','mirror'),o('1F6AA',170,26,80,'kapı','kapılar','door'),o('1F4FA',266,38,56,'televizyon','televizyonlar','television'),o('1F4F1',334,38,50,'telefon','telefonlar','phone'),
  o('1F6CB',12,108,84,'koltuk','koltuklar','sofa'),o('1F6CF',104,108,84,'yatak','yataklar','bed'),o('1FA91',196,126,60,'sandalye','sandalyeler','chair'),o('1FAB4',262,126,60,'bitki','bitkiler','plant'),o('1F4A1',334,130,50,'ampul','ampuller','light bulb'),
  o('1F6BF',14,232,60,'duş','duşlar','shower'),o('1F6C1',86,232,60,'küvet','küvetler','bathtub'),o('1F6BD',158,232,60,'tuvalet','tuvaletler','toilet'),o('1F9FC',230,236,52,'sabun','sabunlar','soap'),o('1FAA5',296,236,52,'diş fırçası','diş fırçaları','toothbrush'),
  o('1F9F9',14,330,60,'süpürge','süpürgeler','broom'),o('1F511',90,336,52,'anahtar','anahtarlar','key'),o('1F9F8',160,332,56,'oyuncak ayı','oyuncak ayılar','teddy bear')]}
];
export const emojiFile=hex=>`assets/emoji/${hex}.svg`;

// leader-line label positions for the body scene: [labelX, labelY, anchor]
const BL={'saç':[296,34,'start'],'baş':[296,58,'start'],'göz':[104,66,'end'],'kulak':[104,102,'end'],'burun':[296,100,'start'],'ağız':[296,126,'start'],'boyun':[296,152,'start'],'omuz':[104,170,'end'],'kol':[96,200,'end'],'dirsek':[96,236,'end'],'el':[96,296,'end'],'parmak':[96,338,'end'],'göğüs':[296,204,'start'],'karın':[296,268,'start'],'bacak':[296,340,'start'],'diz':[104,376,'end'],'ayak':[104,452,'end']};
for(const sc of SCENES) if(sc.body) for(const ob of sc.objs){ob.lab=BL[ob.tr]}
// exact dot positions (cx,cy) on the drawing
const BD={'saç':[200,40],'baş':[230,50],'göz':[177,86],'kulak':[145,90],'burun':[200,102],'ağız':[200,120],'boyun':[200,148],'omuz':[150,172],'kol':[127,190],'dirsek':[127,234],'el':[127,312],'parmak':[118,330],'göğüs':[200,200],'karın':[200,268],'bacak':[228,340],'diz':[174,376],'ayak':[170,452]};
for(const sc of SCENES) if(sc.body) for(const ob of sc.objs){const c=BD[ob.tr];ob.box=[c[0]-16,c[1]-16,32,32]}
