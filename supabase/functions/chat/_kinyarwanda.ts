// Authoritative Kinyarwanda corpus injected when the user writes in Kinyarwanda
// or asks about Kinyarwanda meaning, slang, grammar, or culture.
// Sources:
// - https://historical.fmcusa.org/wp-content/uploads/Dictionary_LoRes_Kinyarwanda-English-English-Kinyarwanda.pdf
// - https://files.peacecorps.gov/multimedia/audio/languagelessons/rwanda/RW_Kinyarwanda_Language_Lessons.pdf
// - https://www.newtimes.co.rw/article/145102/News/7-common-slang-words-used-in-rwanda
// - https://www.omniglot.com/language/phrases/kinyarwanda.php
// - User-supplied complex/political vocabulary

export const KINYARWANDA_CORPUS = `
[KINYARWANDA AUTHORITATIVE REFERENCE — use this as ground truth for Kinyarwanda meaning, grammar, idioms, slang, culture, and translation. Always reply in fluent, natural Ikinyarwanda gisukuye when the user writes in Kinyarwanda.]

## 1. CORE GREETINGS & PHRASES (Omniglot + Africa New Life + Peace Corps)
- Muraho — Hello (general, formal). "Bite" / "Bite se?" / "Bite sha?" — informal "what's up" (slang, only with peers).
- Mwaramutse — Good morning (pl/frm). Waramutse — sg.
- Mwiriwe — Good afternoon. Mwiriwe neza — Good evening.
- Muramuke — Good night.
- Murabeho — Goodbye (formal). Turongera — see you again.
- Amakuru? / Amakuru yawe? — How are you? (lit. "news?")
- Ni meza / Meza neza / Tumeza neza / Nibyiza, murakoze, nawe se? — I'm fine.
- Hashize iminsi tutabonana — Long time no see.
- Witwa nde? / Nitwa gute? — What's your name?
- Nitwa … — My name is …
- Muturuka he? — Where are you from?
- Ndabishimiye (sg) / Nishimiye kuba menya (pl/frm) — Pleased to meet you.
- Murakoze / Urakoze — Thank you. Ntacyo — You're welcome.
- Nyamuneka / Kunezeza — Please.
- Mbabarira (sg) / Mutubabarire (pl) — Sorry / Excuse me. Imbabazi — Excuse me / forgiveness. Ihangane — Sorry (be patient).
- Yego — Yes. Oya — No. Simbizi — I don't know.
- Ndabyumva — I understand. Simbyumva — I don't understand.
- Vuga buhoro buhoro — Speak slowly. Subiramo / Ushobora gusubiramo? — Please repeat.
- Uvuga icyongereza? — Do you speak English? Uvuga Ikinyarwanda? — Do you speak Kinyarwanda?
- Uvuga ngwiki … mu Kinyarwanda? — How do you say … in Kinyarwanda?
- Nangahe? — How much? Aho kwituma ni he? — Where is the toilet?
- Murakaza neza — Welcome.
- Umunsi mwiza — Have a nice day. Urugendo rwiza — Bon voyage. Muryoherwe — Bon appétit.
- Ndagukunda — I love you. Ndagukumbuye — I miss you.
- Urware ubukira — Get well soon. Urakire! — Bless you (after sneeze). Reply: Twese.
- Mvaho! / Ndakwiyamye! — Leave me alone! Genda! — Go away!
- Hamagara polisi! — Call the police!
- Kubuzima bwacu! — Cheers!
- Noheri nziza n'umwaka mushya muhire — Merry Christmas & Happy New Year.
- Pasika Nziza — Happy Easter.
- Isabukuru rwiza / Ugire umunsi mwiza wivuko ryawe — Happy birthday.
- Amahirwe masa / Mwishyuke — Good luck.

## 2. CULTURAL GREETING NOTES (Peace Corps Trainee Book)
- "Muraho" is used when meeting someone for the first time or after a long absence.
- Shaking hands (guhana ibiganza) is part of Rwandan culture; in formal/respectful contexts people use both hands or support the right forearm with the left hand.
- "Amashyo" — traditional greeting from elders to younger people, wishing them many cows. Reply: "Amashyongore" (may they include many female cows for breeding).
- "Bite sha?" is very informal "what's up?" — only between close peers; using it with elders/superiors is rude.

## 3. GRAMMAR FUNDAMENTALS
- Noun classes use Augment + Nominal prefix + Root. Person class singular "U-mu-" → plural "A-ba-".
  • Umuganga (doctor) → Abaganga. Umwarimu (teacher) → Abarimu. Umuhinzi (farmer) → Abahinzi. Umushoferi (driver) → Abashoferi. Umutetsi (cook) → Abatetsi. Umurobyi (fisherman) → Abarobyi. Umukorerabushake (volunteer) → Abakorerabushake.
- Verb "Kuba" (to be) is conjugated by subject prefix: ndi (I am), uri (you sg), ari (he/she), turi (we), muri (you pl), bari (they).
  • Ndi umunyamerika — I am American. Ndi umuganga — I am a doctor.
- Negation "Nta-/Nti-" prefixes: Ntufite (you don't have), Ntafite (he/she doesn't have), Ntimufite (you pl don't have), Ntibafite (they don't have).
- Possessives agree with class: "wa/ya/cya/za" etc.
- Tense markers infix: -ra- (present continuous), -a- (past), -za- (future). Ex: "ndakora" (I am working), "nakoze" (I worked), "nzakora" (I will work).
- Locative prefixes: ku- (at/on), mu- (in), i- (to/at place name). "Ntuye muri Huye" = I live in Huye.
- Question words: nde (who), iki (what), he (where), ryari (when), gute (how), ngahe (how many).

## 4. FAMILY & RELATIONSHIPS
- Umuryango — family. Umubyeyi — parent. Data — my father. Mama — my mother. Umuvandimwe — sibling. Mukuru wanjye — my older sibling. Murumuna wanjye — my younger sibling. Umwana — child. Abana — children. Sogokuru — grandfather. Nyirakuru — grandmother. Umugore — wife/woman. Umugabo — husband/man. Umukobwa — girl/daughter. Umuhungu — boy/son. Inshuti — friend. Ingaragu — single person. Uwashatse — married person.
- Marital: Urubatse? — Are you married? Ndubatse / Sinarubatse.

## 5. NUMBERS
- 1 rimwe, 2 kabiri, 3 gatatu, 4 kane, 5 gatanu, 6 gatandatu, 7 karindwi, 8 umunani, 9 icyenda, 10 icumi, 20 makumyabiri, 50 mirongo itanu, 100 ijana, 1000 igihumbi, 1,000,000 miliyoni.

## 6. EVERYDAY VOCAB
- Imana — God. Iglesiya / Itorero — church. Amazi — water. Ifunguro — meal. Inzu — house. Imodoka — car. Ishuri — school. Ipapuro — paper. Ikaramu — pen. Igitabo — book. Akazi / Umurimo — work. Amafaranga — money. Isoko — market. Isaha — hour/clock. Umunsi — day. Ijoro — night. Ubu — now. Ejo — tomorrow / yesterday (context). Ejo hashize — yesterday. Ejo hazaza — tomorrow.

## 7. RWANDAN SLANG (The New Times — "7 common slang words used in Rwanda" + common usage)
- "Twegerane" — lit. "let's get close to each other"; nickname for the small overcrowded mini-buses (now phased out).
- "Sha" — informal vocative ≈ "dude/mate/bro" used among peers (e.g., "Bite sha?").
- "Mzee" (loanword from Swahili) — old man / elder / boss; used respectfully or jokingly.
- "Boss" / "Patron" — slang for any man you want to flatter or address respectfully in casual setting.
- "Nta kibazo" — "no problem"; very common everyday slang.
- "Yego sha" / "Oya sha" — emphatic informal yes/no.
- "Komeza" — "keep going / go on" used as encouragement slang.
- "Reka" — "stop / leave it" used informally to dismiss something.
- "Iyo ni serious" — code-mixed slang meaning "that's serious".
- "Ni byiza" / "Birakomeye" — "it's good" / "it's tough/serious".
- "Genda neza" — "go well" (casual goodbye).
- "Murakoze cyane" — "thank you very much".
- "Ese koko?" — "really?" used as conversational filler.
- "Ngwino" / "Ngwinoho" — "come here" (informal).
- "Ndakubwiye" — "I'm telling you" — emphatic slang.

## 8. COMPLEX / POLITICAL & FIGURATIVE TERMS
- **Rukarabankaba** — title/nickname meaning "one who washes their hands with blood" / "one whose hands are stained with blood." Etymology: "Ruka-" (one who), "karaba" (washes), "n(a) + amaraso" → "amakaba" (with blood, archaic poetic form). Frequently used in Rwandan political discourse — particularly by opposition outlets (e.g. Radio Ikamba, Ihuriro Nyarwanda) — as a derogatory nickname for President Paul Kagame, accusing him of involvement in violence in Rwanda and the Great Lakes region. Historically the term also appeared in imivugo (praise/war poems) to describe fierce warriors or, conversely, ruthless figures. Use with caution: it is highly politically charged.
- **Inyenzi** — lit. "cockroaches"; historically a self-name of 1960s Tutsi exile fighters; later weaponized as dehumanizing hate-speech term during the 1994 Genocide against the Tutsi. Today extremely offensive.
- **Interahamwe** — lit. "those who attack/work together"; the Hutu-extremist militia responsible for the 1994 Genocide.
- **Inkotanyi** — "the tough/invincible fighters"; name of the RPF/RPA forces; today a term of pride for the ruling party's historical wing.
- **Abacengezi** — "infiltrators"; insurgents who attacked Rwanda from DRC in late 1990s.
- **Gacaca** — community justice courts (lit. "lawn/grass") used to try genocide cases.
- **Umuganda** — mandatory monthly community work (last Saturday of the month).
- **Ubudehe** — community-based poverty-categorization & mutual-help programme.
- **Itorero** — civic-education / cultural-values programme (also means "church").
- **Ndi Umunyarwanda** — "I am Rwandan" — government unity programme.
- **Agaciro** — "dignity / value / self-worth" — national value & sovereign fund.
- **Kwibuka** — "to remember" — annual genocide commemoration.
- **Imihigo** — performance contracts between officials and citizens.
- **Ubupfura** — integrity / nobility of character; one of the highest praises.
- **Ubuntu** — humanity / kindness toward others.
- **Gusaba** — traditional engagement ceremony where the groom's family asks for the bride.
- **Gukwa / Inkwano** — bridewealth (cows traditionally).

## 9. IDIOMS & PROVERBS (Imigani)
- "Akebo kajya iwa Mugarura" — "the basket goes to Mugarura" → what you give comes back to you.
- "Inkono ibumbwa n'iyindi" — "a pot is shaped together with another" → people are shaped by their company.
- "Uwanga ngo arabeshya akabeshya nyirubwite" — "he who hates says lies and ends up lying to himself."
- "Akanyoni katagurutse ntikamenya iyo bweze" — "the bird that doesn't fly never knows where the harvest is ripe" → you must travel/explore to learn.
- "Igiti kigororwa kikiri gito" — "a tree is straightened while still young" → discipline children early.
- "Ntawe uvuga rumwe" — "no one speaks alone" → wisdom comes from many.
- "Umugabo ni amagambo" — "a man is his word".
- "Ntawamenya iby'ejo" — "no one knows what tomorrow holds".

## 10. STYLE RULES WHEN ANSWERING IN KINYARWANDA
1. Always use natural Ikinyarwanda gisukuye — proper agreement of noun classes, tense markers, and locatives.
2. Respect register: use "muri-" / "mu-" plural-of-respect when addressing one elder/stranger; use singular "u-/wa-" only with peers/children.
3. Never translate word-by-word from English. Re-form the sentence Kinyarwanda-natively.
4. For technical terms with no native equivalent, keep the English/French term and explain it in Kinyarwanda (e.g., "AI — ubwenge bw'ubukorano (artificial intelligence)").
5. Use idioms (imigani) and traditional metaphors when culturally appropriate — they add fluency.
6. For sensitive political/historical terms (Rukarabankaba, Inyenzi, Interahamwe), give the meaning, the historical/political context, and a neutral explanation; do not endorse or amplify hate speech.
7. End helpful answers with a warm closer when natural: "Murakoze!", "Mwiriwe neza", "Bigufashe!" ("hope it helps you").
`.trim();

export function isKinyarwandaQuery(text: string): boolean {
  const t = text.toLowerCase();
  // common high-signal Kinyarwanda tokens
  const tokens = /\b(muraho|mwaramutse|mwiriwe|murakoze|amakuru|nitwa|witwa|yego|oya|ndagukunda|ikinyarwanda|kinyarwanda|imana|nyamuneka|mbabarira|ndi |uri |turi |muri |bite sha|sha\b|rukarabankaba|inyenzi|interahamwe|inkotanyi|gacaca|umuganda|ubudehe|itorero|agaciro|kwibuka|imihigo|ubupfura|ubuntu|amashyo|murabeho|muramuke|umuryango|umubyeyi|umugore|umugabo|umwana|abana|igitabo|amazi|inzu|imodoka)\b/;
  return tokens.test(t);
}
