# Sources & licences

All texts fetched at build time (`build/fetch_books.py`) from Turkish Wikisource via its API; bundled in `data/books.json`.

### Nasreddin Hoca Fıkraları 1 (A1)
- Author: Anonymous (Nasreddin Hoca folk tradition)
- Licence: Anonymous folk tradition – every page is tagged “Anonim metinler” (anonymous texts) on Turkish Wikisource, which accepts only public-domain / free content
- Source page(s): https://tr.wikisource.org/wiki/Biz_Yaşıtız, https://tr.wikisource.org/wiki/Dört_Ayaklı_Kadı, https://tr.wikisource.org/wiki/Kaz_Gibi … (+13 more)

### Nasreddin Hoca Fıkraları 2 (A2)
- Author: Anonymous (Nasreddin Hoca folk tradition)
- Licence: Anonymous folk tradition – every page is tagged “Anonim metinler” (anonymous texts) on Turkish Wikisource, which accepts only public-domain / free content
- Source page(s): https://tr.wikisource.org/wiki/İstediğin_Kadar_Vade_Vereyim, https://tr.wikisource.org/wiki/Hazır_Cevap, https://tr.wikisource.org/wiki/Dörtten_Dördü_Çıkarırken … (+13 more)

### Keloğlan ve Padişah (A2)
- Author: Anonymous (Turkish folk tale)
- Licence: Anonymous folk tale hosted on Turkish Wikisource (free content only). The page names no author or licence, so its public-domain status is assumed from the folk-tale tradition, not individually verified
- Source page(s): https://tr.wikisource.org/wiki/Keloğlan_ve_Padişah

### Karanan ile Tilki (A2)
- Author: Anonymous (Turkish folk tale)
- Licence: Anonymous folk tale hosted on Turkish Wikisource (free content only). The page names no author or licence, so its public-domain status is assumed from the folk-tale tradition, not individually verified
- Source page(s): https://tr.wikisource.org/wiki/Karanan_ile_Tilki

### Yüzakı (B1)
- Author: Ömer Seyfettin (1884–1920)
- Licence: Public domain – Ömer Seyfettin died in 1920 (over 100 years ago); text hosted on Turkish Wikisource
- Source page(s): https://tr.wikisource.org/wiki/Yüzakı

### Nasıl Kurtarmış? (B1)
- Author: Ömer Seyfettin (1884–1920)
- Licence: Public domain – Ömer Seyfettin died in 1920 (over 100 years ago); text hosted on Turkish Wikisource
- Source page(s): https://tr.wikisource.org/wiki/Nasıl_Kurtarmış?

### Kesik Bıyık (B1)
- Author: Ömer Seyfettin (1884–1920)
- Licence: Public domain – Ömer Seyfettin died in 1920 (over 100 years ago); text hosted on Turkish Wikisource
- Source page(s): https://tr.wikisource.org/wiki/Kesik_Bıyık

### Kaşağı (B2)
- Author: Ömer Seyfettin (1884–1920)
- Licence: Public domain – Ömer Seyfettin died in 1920 (over 100 years ago); text hosted on Turkish Wikisource
- Source page(s): https://tr.wikisource.org/wiki/Kaşağı

### Çakmak (B2)
- Author: Ömer Seyfettin (1884–1920)
- Licence: Public domain – Ömer Seyfettin died in 1920 (over 100 years ago); text hosted on Turkish Wikisource
- Source page(s): https://tr.wikisource.org/wiki/Çakmak

### Aşk ve Ayak Parmakları (B2)
- Author: Ömer Seyfettin (1884–1920)
- Licence: Public domain – Ömer Seyfettin died in 1920 (over 100 years ago); text hosted on Turkish Wikisource
- Source page(s): https://tr.wikisource.org/wiki/Aşk_ve_Ayak_Parmakları

### Forsa (B2)
- Author: Ömer Seyfettin (1884–1920)
- Licence: Public domain – Ömer Seyfettin died in 1920 (over 100 years ago); text hosted on Turkish Wikisource
- Source page(s): https://tr.wikisource.org/wiki/Forsa

### Kurbağa Duası (C1)
- Author: Ömer Seyfettin (1884–1920)
- Licence: Public domain – Ömer Seyfettin died in 1920 (over 100 years ago); text hosted on Turkish Wikisource
- Source page(s): https://tr.wikisource.org/wiki/Kurbağa_Duası

## Pictures
Emoji artwork: OpenMoji 15.1 (https://openmoji.org), © HfG Schwäbisch Gmünd, licence CC BY-SA 4.0 (`assets/emoji/LICENSE-OpenMoji.txt`). Scene backgrounds and the body figure are original SVG drawn for this app. Because OpenMoji is share-alike, keep the attribution in the app's “Sources & licences” page.

## Runtime services (called from the browser, no keys)
- English Wiktionary REST API (CC BY-SA) – definitions, “form of” lemma detection.
- Google Translate web endpoints (`clients5.google.com/translate_a/t`, fallback `translate.googleapis.com/translate_a/single`) – word & sentence translation (unofficial, may rate-limit).
- MyMemory (`api.mymemory.translated.net`) – final fallback (free anonymous quota ~5,000 chars/day/IP).

## Songs (data/songs.json)
All lyrics are traditional/anonymous (tagged "Anonim metinler" on Turkish Wikisource; build/fetch_songs.py asserts the category). Only the words are bundled. Videos are third-party YouTube embeds (IDs verified embeddable via YouTube oEmbed); the recording belongs to its performer. Songs without a verified embed link to a YouTube search.

- **Üsküdar’a Gider İken** (Türkü (İstanbul), A2) — https://tr.wikisource.org/wiki/Üsküdar’a_Gider_İken — video: SFwCw1mZd1g
- **Bir Beyaz Güvercin Olsam** (Türkü (Rumeli), B1) — https://tr.wikisource.org/wiki/Bir_Beyaz_Güvercin_Olsam — video: search link only
- **Çanakkale İçinde Aynalı Çarşı** (Türkü (Kastamonu), B1) — https://tr.wikisource.org/wiki/Çanakkale_İçinde_Aynalı_Çarşı — video: v0F6pHVc97U
- **Bahçede Yeşil Çınar** (Türkü (Rumeli), B1) — https://tr.wikisource.org/wiki/Bahçede_Yeşil_Çınar — video: search link only
- **Evlerinin Önü Yonca** (Türkü (Sivas), B1) — https://tr.wikisource.org/wiki/Evlerinin_Önü_Yonca — video: search link only
- **Sarı Gelin** (Türkü (Erzurum), B1) — https://tr.wikisource.org/wiki/Erzurum_Çarşı_Pazar — video: 5Kx2I0wU96Y
- **Dere Boyu Yeşillik** (Türkü (İstanbul), A2) — https://tr.wikisource.org/wiki/Dere_Boyu_Yeşillik — video: search link only
- **Yağmur Yağar Yerlere** (Türkü (Eskişehir), A2) — https://tr.wikisource.org/wiki/Yağmur_Yağar_Yerlere — video: search link only
- **Yağmur Yağıyor** (Children’s song, A1) — https://tr.wikisource.org/wiki/Yağmur_yağıyor — video: qK9vLERvRJ0
- **Ebe Ebe Nerede** (Children’s rhyme, A1) — https://tr.wikisource.org/wiki/Ebe_ebe_nerede — video: search link only
- **Ninniler (lullabies)** (Ninni (lullabies), A1) — https://tr.wikisource.org/wiki/Ninni_ninni_ninnice, https://tr.wikisource.org/wiki/Ninni_çaldım_beşiğine, https://tr.wikisource.org/wiki/Kavak_gibi_boylanasın_ninni, https://tr.wikisource.org/wiki/Ninni_de_ninni_demekten — video: search link only

Not bundled: "Daha dün annemizin", "Arı Vız Vız Vız", "Bir Kişi Bir Kişi" (no verifiable anonymous/public-domain source found), "Gesi Bağları" (lyrics unsuitable).

## Videos (data/videos.json)
Only full episodes/tales from the OFFICIAL channels that publish them: TRT Çocuk (@trtcocuk), Rafadan Tayfa (@rafadantayfaofficial), Niloya (@niloyatv), Pepee (@pepeedunyasi). Videos are streamed through the YouTube IFrame API (nothing is downloaded or re-hosted). build/fetch_videos.py checks every ID with YouTube oEmbed (exists, embeddable, author_url equals the expected official channel). No public-domain films are included.
Transcripts: build/fetch_captions.py (yt-dlp, no cookies) can bundle Turkish captions into data/captions/<id>.json. None are bundled yet because YouTube blocks the build machine's IP; users can paste .srt/.vtt text per video in the app.

- **Niloya - 1. - 13. Bölümler** — Niloya (A1, Cartoon) — https://www.youtube.com/watch?v=SXyoCF8HxwE
- **Pepee 4 Bölüm Bir Arada - Pepe Eğitici Çizgi Film & Çocuk Şarkıları | Düşyeri** — Pepee (A1, Cartoon) — https://www.youtube.com/watch?v=BVM1bC_s_XM
- **Masal Kitabı - Aslan ile Fare** — TRT Çocuk (A1, Fable) — https://www.youtube.com/watch?v=Ywpudy3yN4Y
- **Masal Kitabı - Kibirli Karga** — TRT Çocuk (A1, Fable) — https://www.youtube.com/watch?v=0vkI0IGP2Bo
- **Çocukçuf | 69.Bölüm | Sayılar** — TRT Çocuk (A2, Kids show) — https://www.youtube.com/watch?v=su2enN1kTMc
- **Pırıl | Efe Ders Çalışıyor** — TRT Çocuk (A2, Cartoon) — https://www.youtube.com/watch?v=i6CaSebAFTU
- **Tuhafiye | 1.Bölüm** — TRT Çocuk (A2, Cartoon) — https://www.youtube.com/watch?v=ln-GIGLqGcU
- **Çocukçuf | 12.Bölüm | Mevsimler** — TRT Çocuk (A2, Kids show) — https://www.youtube.com/watch?v=HO68xQvs2TY
- **Rafadan Tayfa | Bayrak Kapmaca** — TRT Çocuk (B1, Cartoon) — https://www.youtube.com/watch?v=WP9soQviMXM
- **Rafadan Tayfa | Hıçkırık** — TRT Çocuk (B1, Cartoon) — https://www.youtube.com/watch?v=4NgeB8fC6jY
- **Rafadan Tayfa 82. Bölüm Tamtam'ın Dönüşü** — Rafadan Tayfa (B1, Cartoon) — https://www.youtube.com/watch?v=5-mb0mLaF68
- **Kız Kulesi Masalları | Kıymetli Kediler | Hikmet Körmükçü** — TRT Çocuk (B1, Tale) — https://www.youtube.com/watch?v=Mn8jDBdvoHs
- **Keloğlan - İsraf** — TRT Çocuk (B1, Cartoon) — https://www.youtube.com/watch?v=dvXcSC3vmPk
- **Keloğlan - Üzgün Ağaç** — TRT Çocuk (B1, Cartoon) — https://www.youtube.com/watch?v=ox4tIavTxuw
- **Keloğlan - Nasreddin Hoca** — TRT Çocuk (B1, Cartoon) — https://www.youtube.com/watch?v=tdrQOQ1rMoA
- **Keloğlan - Hayalet Madenci** — TRT Çocuk (B2, Cartoon) — https://www.youtube.com/watch?v=sXrs4gWvyLA
