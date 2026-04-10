/**
 * Pre-built telecaller scripts for all 14 Hubli niches.
 * Source: 03_SALES_SYSTEM/Telecaller_Scripts/Hubli/
 * Language: Kanglish (Kannada + English)
 */

export interface NicheScript {
  niche: string;
  volume: string;
  mainScript: string;
  dataHook: string;
  meetingAsk: string;
  objections: {
    not_interested: string;
    has_agency: string;
    no_budget: string;
    callback_later: string;
    doing_own_marketing: string;
  };
  pdfGuide: string;
}

const SCRIPTS: Record<string, NicheScript> = {
  Gyms: {
    niche: "Gyms / Fitness Centres",
    volume: "63,950",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma gym bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"
(If they say Hindi — switch to Hindi)

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Thumba important data ide nimma gym bagge."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 63,950 jana prathi thumba gym search maadtaare Google mele. Ee number nimage surprise aaguttade — aadre top 3 gym websites alli nimdu illi anta artha alla."

STEP 5 — CURIOSITY GAP
"Aa 63,950 searches yellige haadtide, yaaru padetidaare — adannu nimage thorisbeku anta call maadidivi. Nimma competitors elli idaare, nimdu elli ide anta data namma hatra ide."

STEP 6 — SOFT PITCH
"Naavu local gyms ge help maadtivi — customers JustDial bidu neeravaagi nimma gym find maadkobeku anta Google mele, direct call barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma gym ge specific data thorisi, exactly enu maadabahuda anta discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 63,950 jana prathi gym search maadtaare — top 3 websites only padetive, nimdu illi alla.",
    meetingAsk: "15 nimisha call — Jabeer nimma gym ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — ee 63,950 searches alli eshtu nimge bartide currently? Yaava month?",
    },
    pdfGuide: "SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3",
  },

  "Skin Clinics": {
    niche: "Skin Clinics / Dermatologists",
    volume: "41,850",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma clinic bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Nimma skin clinic bagge important data ide — share maadabekunagide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 41,850 jana prathi skin clinic search maadtaare Google mele. Top clinic high traffic padetide — ulida ella patients miss maadtidaare."

STEP 5 — CURIOSITY GAP
"Aa 41,850 searches yellige haadtide, yaaru padetidaare — adannu nimage thorisbeku anta call maadidivi."

STEP 6 — SOFT PITCH
"Naavu local skin clinics ge help maadtivi — patients JustDial bidu neeravaagi nimma clinic find maadkobeku anta Google mele, direct appointment barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma clinic ge specific data thorisi, exactly enu maadabahuda anta discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 41,850 jana skin clinic search maadtaare — top clinic high traffic padetide ee traffic ninda.",
    meetingAsk: "15 nimisha call — Jabeer nimma clinic ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — ee 41,850 searches alli eshtu nimge bartide currently?",
    },
    pdfGuide: "SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3",
  },

  Dental: {
    niche: "Dental Clinics / Dentists",
    volume: "21,100",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma clinic bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Nimma dental clinic bagge important data ide — share maadabekunagide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 21,100 jana prathi dentist search maadtaare Google mele. Ee number nimage surprise aaguttade — ondu clinic dominate maadtide, ulida ella invisible aagide."

STEP 5 — CURIOSITY GAP
"Aa 21,100 searches yellige haadtide, yaaru padetidaare — adannu nimage thorisbeku anta call maadidivi. Ond clinic top ge ide, ullida ella patients miss maadtidaare. Nimdu elli ide anta show maadabekunagide."

STEP 6 — SOFT PITCH
"Naavu local dental clinics ge help maadtivi — patients JustDial bidu neeravaagi nimma clinic find maadkobeku anta Google mele, direct appointment barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma clinic ge specific data thorisi, exactly enu maadabahuda anta discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 21,100 jana dentist search maadtaare — ondu clinic dominate maadtide, ulida ella invisible aagide.",
    meetingAsk: "15 nimisha call — Jabeer nimma clinic ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — ee 21,100 searches alli eshtu nimge bartide currently?",
    },
    pdfGuide: "SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3",
  },

  "Real Estate": {
    niche: "Real Estate Agents / Builders",
    volume: "17,850",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma business bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Hubli real estate market bagge important data ide — share maadabekunagide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 17,850 jana prathi real estate search maadtaare Google mele. National portals ella traffic take maadtive — local agents ge baralilla."

STEP 5 — CURIOSITY GAP
"Aa 17,850 searches yellige haadtide — MagicBricks, 99acres portals take maadtive. Nimma local business ee traffic ninda benefit aagobahudaagide."

STEP 6 — SOFT PITCH
"Naavu local real estate agents ge help maadtivi — buyers directly nimma listings find maadkobeku anta Google mele, portal fees bidu direct leads barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma business ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 17,850 jana real estate search maadtaare — national portals ella traffic take maadtive.",
    meetingAsk: "15 nimisha call — Jabeer nimma business ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — portal fees eshtu aaguttide monthly? Direct leads cheaper aaguttade.",
    },
    pdfGuide: "SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3",
  },

  "Car Rentals": {
    niche: "Car Rentals / Taxi Services",
    volume: "16,450",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma business bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Hubli car rental market bagge important data ide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 16,450 jana car rental search maadtaare Google mele. Ee niche alli yaaruu ads haaktilla — doda opportunity ide."

STEP 5 — CURIOSITY GAP
"Yaaruu Google ads haaktilla anta artha — first person ads haakidavanu ela ee market own maadkobahuda. Nimge aa opportunity ide."

STEP 6 — SOFT PITCH
"Naavu car rental businesses ge help maadtivi — customers directly nimma service find maadkobeku anta Google mele, Ola/Uber bidu direct bookings barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma business ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 16,450 jana car rental search maadtaare — ee niche alli yaaruu ads haaktilla.",
    meetingAsk: "15 nimisha call — Jabeer nimma business ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — ee 16,450 searches alli eshtu nimge bartide currently?",
    },
    pdfGuide: "SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3",
  },

  "Interior Designers": {
    niche: "Interior Designers / Home Decor",
    volume: "16,650",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma business bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Hubli interior design market bagge important data ide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 16,650 jana interior designer search maadtaare Google mele. Directories ee traffic thumba take maadtive — local designers ge clients bartillave."

STEP 5 — CURIOSITY GAP
"Aa traffic yellige haadtide — Just Dial, UrbanClap type platforms take maadtive. Ee clients directly nimma business find maadkobeku anta maadabahuda."

STEP 6 — SOFT PITCH
"Naavu interior designers ge help maadtivi — customers directly nimma portfolio find maadkobeku anta Google mele, platform commission bidu direct enquiries barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma business ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 16,650 jana interior designer search maadtaare — directories ee traffic thumba take maadtive.",
    meetingAsk: "15 nimisha call — Jabeer nimma business ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — ee 16,650 searches alli eshtu nimge bartide currently?",
    },
    pdfGuide: "SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3",
  },

  "Computer Training": {
    niche: "Computer Training / IT Institutes",
    volume: "24,350",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma institute bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Nimma institute bagge important market data ide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 24,350 jana computer course search maadtaare Google mele. Top institute high traffic padetide — ulida ella students miss maadtidaare."

STEP 5 — CURIOSITY GAP
"Aa 24,350 searches yellige haadtide — top institute padetide, baaki ela miss aaguttide. Nimma institute visibility eshtu ide currently?"

STEP 6 — SOFT PITCH
"Naavu computer training institutes ge help maadtivi — students directly nimma courses find maadkobeku anta Google mele, direct admissions barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma institute ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 24,350 jana computer course search maadtaare — top institute high traffic padetide.",
    meetingAsk: "15 nimisha call — Jabeer nimma institute ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — ee 24,350 searches alli eshtu students nimge bartidaare currently?",
    },
    pdfGuide: "SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3",
  },

  "JEE/NEET Coaching": {
    niche: "JEE / NEET Coaching Institutes",
    volume: "12,300",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma institute bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Hubli JEE NEET market bagge important data ide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 12,300 students JEE NEET coaching search maadtaare. Mostly online platforms ge haadtaare — local institutes sigalla antha."

STEP 5 — CURIOSITY GAP
"PW, Allen type online platforms P1 mele idaare. Aadre local students local institute prefer maadtaare — nimge aa students reach maadabekagide."

STEP 6 — SOFT PITCH
"Naavu local coaching institutes ge help maadtivi — students directly nimma institute find maadkobeku anta Google mele, online platform fees bidu direct admissions barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma institute ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 12,300 students JEE NEET coaching search maadtaare — mostly online platforms ge haadtaare local institutes sigalla antha.",
    meetingAsk: "15 nimisha call — Jabeer nimma institute ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — ee 12,300 searches alli eshtu students nimge bartidaare currently?",
    },
    pdfGuide: "SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3",
  },

  "Modular Kitchens": {
    niche: "Modular Kitchen Dealers",
    volume: "6,450",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma business bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Hubli modular kitchen market bagge important data ide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 6,450 jana modular kitchen search maadtaare Google mele. Ee niche alli directories highest dominance maadtive — direct dealers invisible aagide."

STEP 5 — CURIOSITY GAP
"12 directories P1 mele idaare — nimma business ee directories ninda aachege kaanisuttade. Ee traffic directly nimge bartibilladre ee opportunity miss aaguttide."

STEP 6 — SOFT PITCH
"Naavu modular kitchen dealers ge help maadtivi — customers directly nimma showroom find maadkobeku anta Google mele, JustDial bidu direct enquiries barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma business ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 6,450 jana modular kitchen search maadtaare — ee niche alli directories highest dominance maadtive.",
    meetingAsk: "15 nimisha call — Jabeer nimma business ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — ee 6,450 searches alli eshtu enquiries nimge bartide currently?",
    },
    pdfGuide: "SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3",
  },

  "IELTS Coaching": {
    niche: "IELTS / Spoken English Coaching",
    volume: "3,200",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma institute bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Hubli IELTS market bagge important data ide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 3,200 jana IELTS coaching search maadtaare. Local institutes ge thumba doda opportunity ide — national brand alli compete maadabahuda."

STEP 5 — CURIOSITY GAP
"National institutes online ads haaktive — local Hubli students local institute prefer maadtaare. Ee gap nimge doda advantage aaguttade."

STEP 6 — SOFT PITCH
"Naavu IELTS coaching institutes ge help maadtivi — students directly nimma institute find maadkobeku anta Google mele, direct admissions barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma institute ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 3,200 jana IELTS coaching search maadtaare — local institutes ge thumba doda opportunity ide.",
    meetingAsk: "15 nimisha call — Jabeer nimma institute ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — ee 3,200 searches alli eshtu students nimge bartidaare currently?",
    },
    pdfGuide: "SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3",
  },

  "Tuition Centres": {
    niche: "Tuition Centres / Home Tutors",
    volume: "11,150",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma centre bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Hubli tuition market bagge important data ide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 11,150 jana tuition search maadtaare Google mele. BYJU's mattu directories dominate maadtive — local centres ge students miss aaguttide."

STEP 5 — CURIOSITY GAP
"National platforms P1 mele idaare — aadre Hubli parents local centre prefer maadtaare. Aa gap nimge advantage aaguttade."

STEP 6 — SOFT PITCH
"Naavu local tuition centres ge help maadtivi — parents directly nimma centre find maadkobeku anta Google mele, BYJU's bidu local direct admissions barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma centre ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 11,150 jana tuition search maadtaare — BYJU's mattu directories dominate maadtive.",
    meetingAsk: "15 nimisha call — Jabeer nimma centre ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — ee 11,150 searches alli eshtu students nimge bartidaare currently?",
    },
    pdfGuide: "SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3",
  },

  Hotels: {
    niche: "Hotels / Guest Houses",
    volume: "8,100",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma hotel bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Hubli hotel market bagge important data ide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 8,100 jana hotel search maadtaare Google mele. OTA platforms ella traffic take maadtive — nimge direct bookings bartallave."

STEP 5 — CURIOSITY GAP
"Goibibo, MakeMyTrip, Booking.com type platforms 20-30% commission take maadtive. Ee bookings directly nimge bartibilladre eshtu loss aaguttide?"

STEP 6 — SOFT PITCH
"Naavu hotels ge help maadtivi — customers directly nimma hotel website mele book maadkobeku anta, OTA commission bidu direct revenue barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma hotel ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 8,100 jana hotel search maadtaare — OTA platforms ella traffic take maadtive.",
    meetingAsk: "15 nimisha call — Jabeer nimma hotel ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — OTA commission eshtu loss aaguttide monthly? Direct bookings cheaper aaguttade.",
      no_budget: "Understand maadtini — OTA commission kottidakke compare maadidre our package thumba affordable.",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — OTA vs direct booking ratio currently eshtu ide nimma hotel ge?",
    },
    pdfGuide: "Hotels — always send Type 1 or Type 3 based on website presence",
  },

  "IVF Clinics": {
    niche: "IVF / Fertility Clinics",
    volume: "350",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma clinic bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Nimma clinic bagge important data ide — share maadabekunagide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli IVF treatment search maadtaare. National chains Nova, Indira dominate maadtive — local clinics patients miss maadtidaare."

STEP 5 — CURIOSITY GAP
"Ee patients national chains ge haadtaare — travel, cost, comfort matters. Local trusted clinic ide antha gothillave. Nimge aa gap ide."

STEP 6 — SOFT PITCH
"Naavu fertility clinics ge help maadtivi — patients directly nimma clinic find maadkobeku anta Google mele, national chains bidu local trusted clinic choose maadkobeku."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma clinic ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli IVF clinic search maadtaare — national chains Nova, Indira dominate maadtive, local clinics patients miss maadtidaare.",
    meetingAsk: "15 nimisha call — Jabeer nimma clinic ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — national chains against compete maadtidira — eshtu patients local ge bartidaare?",
    },
    pdfGuide: "IVF is low volume — always send Type 4 (Niche Market Report)",
  },

  Physiotherapy: {
    niche: "Physiotherapy Clinics",
    volume: "1,900",
    mainScript: `STEP 1 — INTRODUCTION
"Hello, nanu Afifa haeltidini, FortuneMarq ninda call maadtidini. [Business Name] ge call maadtidini — nimma clinic bagge matter ide."

STEP 2 — LANGUAGE PREFERENCE
"Nimma jathe Kannada alli maatanaadabeka, Hindi alli, illa English alli?"

STEP 3 — PERMISSION TO SPEAK
"2 nimisha time idya nimge? Nimma clinic bagge important data ide."

STEP 4 — DATA HOOK
"Navu ond market research maadidivi — Hubli alli 1,900 jana physiotherapy search maadtaare. Bahala kamma local clinics Google mele kaanisilla — patients JustDial, Practo use maadtaare."

STEP 5 — CURIOSITY GAP
"JustDial, Practo P1 mele idaare — aadre nimma clinic directly found aadre commission illadey direct patients bartaare."

STEP 6 — SOFT PITCH
"Naavu physiotherapy clinics ge help maadtivi — patients directly nimma clinic find maadkobeku anta Google mele, platform fees bidu direct appointments barthidhare."

STEP 7 — MEETING ASK
"Naavu ond 15 nimisha call set maadbahudu — nimma clinic ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,
    dataHook: "Hubli alli 1,900 jana physiotherapy search maadtaare — bahala kamma local clinics Google mele kaanisilla.",
    meetingAsk: "15 nimisha call — Jabeer nimma clinic ge specific data thorisi discuss maadtaare.",
    objections: {
      not_interested: "No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",
      has_agency: "Channagide — nimma Google ranking currently elli ide? First page mele idya?",
      no_budget: "Understand maadtini — small packages ide, just information maatra send maadbahudu?",
      callback_later: "Sari, yaava time convenient? Naalidu 11am ge call maadali?",
      doing_own_marketing: "Channagide — Practo, JustDial commission eshtu loss aaguttide monthly?",
    },
    pdfGuide: "Physiotherapy is low volume — always send Type 4 (Niche Market Report)",
  },
};

/** Normalize industry name from lead data to script key */
export function getNicheScript(industry: string | null): NicheScript | null {
  if (!industry) return null;
  const normalized = industry.trim();

  // Direct match
  if (SCRIPTS[normalized]) return SCRIPTS[normalized];

  // Fuzzy match
  const lower = normalized.toLowerCase();
  for (const key of Object.keys(SCRIPTS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return SCRIPTS[key];
    }
  }

  // Keyword matches
  if (lower.includes("gym") || lower.includes("fitness")) return SCRIPTS["Gyms"];
  if (lower.includes("skin") || lower.includes("dermat")) return SCRIPTS["Skin Clinics"];
  if (lower.includes("dental") || lower.includes("dentist")) return SCRIPTS["Dental"];
  if (lower.includes("real estate") || lower.includes("property") || lower.includes("builder")) return SCRIPTS["Real Estate"];
  if (lower.includes("car") || lower.includes("taxi") || lower.includes("rental")) return SCRIPTS["Car Rentals"];
  if (lower.includes("interior")) return SCRIPTS["Interior Designers"];
  if (lower.includes("computer") || lower.includes("it training")) return SCRIPTS["Computer Training"];
  if (lower.includes("jee") || lower.includes("neet") || lower.includes("coaching")) return SCRIPTS["JEE/NEET Coaching"];
  if (lower.includes("modular") || lower.includes("kitchen")) return SCRIPTS["Modular Kitchens"];
  if (lower.includes("ielts") || lower.includes("english")) return SCRIPTS["IELTS Coaching"];
  if (lower.includes("tuition") || lower.includes("tutor")) return SCRIPTS["Tuition Centres"];
  if (lower.includes("hotel") || lower.includes("guest")) return SCRIPTS["Hotels"];
  if (lower.includes("ivf") || lower.includes("fertility")) return SCRIPTS["IVF Clinics"];
  if (lower.includes("physio")) return SCRIPTS["Physiotherapy"];

  return null;
}
