module.exports=[575397,a=>{"use strict";var b=a.i(137936),c=a.i(989227);let d=process.env.ANTHROPIC_API_KEY,e="claude-haiku-4-5-20251001";async function f(a,b,c,h=500){if(!d)return console.error("ANTHROPIC_API_KEY is missing from environment variables."),"AI Error: Configuration missing. Please set ANTHROPIC_API_KEY.";try{let f=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":d,"anthropic-version":"2023-06-01","content-type":"application/json"},body:JSON.stringify({model:e,max_tokens:h,system:a,messages:[{role:"user",content:b}]})}),i=await f.json();if(!f.ok)return console.error("Anthropic API Error:",i),"AI Error: Request failed. Please try again.";let j=i.content?.[0]?.text||"AI Error: No response received.";return g(c,b,j,i.usage?.input_tokens+i.usage?.output_tokens||0),j}catch(a){return console.error("Anthropic API Exception:",a),"AI Error: Connection failed. Check your internet connection."}}async function g(a,b,d,f){try{let g=await (0,c.createServerClientWithCookies)(),{data:{user:h}}=await g.auth.getUser();await g.from("ai_usage_logs").insert({feature:a,input_summary:b.substring(0,500),output_summary:d.substring(0,500),tokens_used:f,model:e,created_by:h?.id})}catch(a){console.error("Failed to log AI usage:",a)}}let h={Gyms:{niche:"Gyms / Fitness Centres",volume:"63,950",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma gym ge specific data thorisi, exactly enu maadabahuda anta discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 63,950 jana prathi gym search maadtaare — top 3 websites only padetive, nimdu illi alla.",meetingAsk:"15 nimisha call — Jabeer nimma gym ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — ee 63,950 searches alli eshtu nimge bartide currently? Yaava month?"},pdfGuide:"SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3"},"Skin Clinics":{niche:"Skin Clinics / Dermatologists",volume:"41,850",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma clinic ge specific data thorisi, exactly enu maadabahuda anta discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 41,850 jana skin clinic search maadtaare — top clinic high traffic padetide ee traffic ninda.",meetingAsk:"15 nimisha call — Jabeer nimma clinic ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — ee 41,850 searches alli eshtu nimge bartide currently?"},pdfGuide:"SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3"},Dental:{niche:"Dental Clinics / Dentists",volume:"21,100",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma clinic ge specific data thorisi, exactly enu maadabahuda anta discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 21,100 jana dentist search maadtaare — ondu clinic dominate maadtide, ulida ella invisible aagide.",meetingAsk:"15 nimisha call — Jabeer nimma clinic ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — ee 21,100 searches alli eshtu nimge bartide currently?"},pdfGuide:"SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3"},"Real Estate":{niche:"Real Estate Agents / Builders",volume:"17,850",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma business ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 17,850 jana real estate search maadtaare — national portals ella traffic take maadtive.",meetingAsk:"15 nimisha call — Jabeer nimma business ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — portal fees eshtu aaguttide monthly? Direct leads cheaper aaguttade."},pdfGuide:"SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3"},"Car Rentals":{niche:"Car Rentals / Taxi Services",volume:"16,450",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma business ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 16,450 jana car rental search maadtaare — ee niche alli yaaruu ads haaktilla.",meetingAsk:"15 nimisha call — Jabeer nimma business ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — ee 16,450 searches alli eshtu nimge bartide currently?"},pdfGuide:"SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3"},"Interior Designers":{niche:"Interior Designers / Home Decor",volume:"16,650",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma business ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 16,650 jana interior designer search maadtaare — directories ee traffic thumba take maadtive.",meetingAsk:"15 nimisha call — Jabeer nimma business ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — ee 16,650 searches alli eshtu nimge bartide currently?"},pdfGuide:"SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3"},"Computer Training":{niche:"Computer Training / IT Institutes",volume:"24,350",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma institute ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 24,350 jana computer course search maadtaare — top institute high traffic padetide.",meetingAsk:"15 nimisha call — Jabeer nimma institute ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — ee 24,350 searches alli eshtu students nimge bartidaare currently?"},pdfGuide:"SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3"},"JEE/NEET Coaching":{niche:"JEE / NEET Coaching Institutes",volume:"12,300",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma institute ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 12,300 students JEE NEET coaching search maadtaare — mostly online platforms ge haadtaare local institutes sigalla antha.",meetingAsk:"15 nimisha call — Jabeer nimma institute ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — ee 12,300 searches alli eshtu students nimge bartidaare currently?"},pdfGuide:"SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3"},"Modular Kitchens":{niche:"Modular Kitchen Dealers",volume:"6,450",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma business ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 6,450 jana modular kitchen search maadtaare — ee niche alli directories highest dominance maadtive.",meetingAsk:"15 nimisha call — Jabeer nimma business ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — ee 6,450 searches alli eshtu enquiries nimge bartide currently?"},pdfGuide:"SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3"},"IELTS Coaching":{niche:"IELTS / Spoken English Coaching",volume:"3,200",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma institute ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 3,200 jana IELTS coaching search maadtaare — local institutes ge thumba doda opportunity ide.",meetingAsk:"15 nimisha call — Jabeer nimma institute ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — ee 3,200 searches alli eshtu students nimge bartidaare currently?"},pdfGuide:"SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3"},"Tuition Centres":{niche:"Tuition Centres / Home Tutors",volume:"11,150",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma centre ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 11,150 jana tuition search maadtaare — BYJU's mattu directories dominate maadtive.",meetingAsk:"15 nimisha call — Jabeer nimma centre ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — ee 11,150 searches alli eshtu students nimge bartidaare currently?"},pdfGuide:"SERP Y → Type 1 | No Website → Type 2 | Has Website not ranking → Type 3"},Hotels:{niche:"Hotels / Guest Houses",volume:"8,100",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma hotel ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 8,100 jana hotel search maadtaare — OTA platforms ella traffic take maadtive.",meetingAsk:"15 nimisha call — Jabeer nimma hotel ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — OTA commission eshtu loss aaguttide monthly? Direct bookings cheaper aaguttade.",no_budget:"Understand maadtini — OTA commission kottidakke compare maadidre our package thumba affordable.",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — OTA vs direct booking ratio currently eshtu ide nimma hotel ge?"},pdfGuide:"Hotels — always send Type 1 or Type 3 based on website presence"},"IVF Clinics":{niche:"IVF / Fertility Clinics",volume:"350",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma clinic ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli IVF clinic search maadtaare — national chains Nova, Indira dominate maadtive, local clinics patients miss maadtidaare.",meetingAsk:"15 nimisha call — Jabeer nimma clinic ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — national chains against compete maadtidira — eshtu patients local ge bartidaare?"},pdfGuide:"IVF is low volume — always send Type 4 (Niche Market Report)"},Physiotherapy:{niche:"Physiotherapy Clinics",volume:"1,900",mainScript:`STEP 1 — INTRODUCTION
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
"Naavu ond 15 nimisha call set maadbahudu — nimma clinic ge specific data thorisi discuss maadabahuda? Jabeer, namma founder, nimma jathe maatanaadtaare."`,dataHook:"Hubli alli 1,900 jana physiotherapy search maadtaare — bahala kamma local clinics Google mele kaanisilla.",meetingAsk:"15 nimisha call — Jabeer nimma clinic ge specific data thorisi discuss maadtaare.",objections:{not_interested:"No problem — ond month bidu follow up maadbahudu? Market data change aaguttade.",has_agency:"Channagide — nimma Google ranking currently elli ide? First page mele idya?",no_budget:"Understand maadtini — small packages ide, just information maatra send maadbahudu?",callback_later:"Sari, yaava time convenient? Naalidu 11am ge call maadali?",doing_own_marketing:"Channagide — Practo, JustDial commission eshtu loss aaguttide monthly?"},pdfGuide:"Physiotherapy is low volume — always send Type 4 (Niche Market Report)"}};function i(a){if(!a)return null;let b=a.trim();if(h[b])return h[b];let c=b.toLowerCase();for(let a of Object.keys(h))if(c.includes(a.toLowerCase())||a.toLowerCase().includes(c))return h[a];return c.includes("gym")||c.includes("fitness")?h.Gyms:c.includes("skin")||c.includes("dermat")?h["Skin Clinics"]:c.includes("dental")||c.includes("dentist")?h.Dental:c.includes("real estate")||c.includes("property")||c.includes("builder")?h["Real Estate"]:c.includes("car")||c.includes("taxi")||c.includes("rental")?h["Car Rentals"]:c.includes("interior")?h["Interior Designers"]:c.includes("computer")||c.includes("it training")?h["Computer Training"]:c.includes("jee")||c.includes("neet")||c.includes("coaching")?h["JEE/NEET Coaching"]:c.includes("modular")||c.includes("kitchen")?h["Modular Kitchens"]:c.includes("ielts")||c.includes("english")?h["IELTS Coaching"]:c.includes("tuition")||c.includes("tutor")?h["Tuition Centres"]:c.includes("hotel")||c.includes("guest")?h.Hotels:c.includes("ivf")||c.includes("fertility")?h["IVF Clinics"]:c.includes("physio")?h.Physiotherapy:null}async function j(a,b,c){let d=i(a);if(d)return`📋 ${d.niche.toUpperCase()} — HUBLI SCRIPT

${d.mainScript}

---
💡 DATA HOOK: "${d.dataHook}"
🎯 MEETING ASK: "${d.meetingAsk}"`;let e=`You are a telecaller script writer for a digital marketing agency in India.
Write short, natural Kanglish (Kannada + English) call scripts for local business owners in Hubli, Karnataka.`,g=`Write a 7-step cold call script for a ${a} business called "${b}" in ${c}.
Include: introduction, language check, permission, data hook, curiosity gap, soft pitch, meeting ask. Format as STEP 1 through STEP 7.`;return await f(e,g,"script_suggester")}async function k(a,b,c){let d=i(a);if(d){let a=c.toLowerCase(),b="";return a.includes("not interested")||a.includes("interest illa")?b=`"${d.objections.not_interested}"`:a.includes("agency")||a.includes("already have")?b=`"${d.objections.has_agency}"`:a.includes("budget")||a.includes("money")||a.includes("expensive")?b=`"${d.objections.no_budget}"`:a.includes("busy")||a.includes("call back")||a.includes("later")?b=`"${d.objections.callback_later}"`:(a.includes("ourselves")||a.includes("own")||a.includes("doing it"))&&(b=`"${d.objections.doing_own_marketing}"`),`📌 SCRIPT RESPONSES — ${d.niche}${b?`

✅ BEST MATCH:
${b}`:""}

---
ALL OBJECTION RESPONSES:

1. Not Interested:
"${d.objections.not_interested}"

2. Has Agency:
"${d.objections.has_agency}"

3. No Budget:
"${d.objections.no_budget}"

4. Call Back Later:
"${d.objections.callback_later}"

5. Doing Own Marketing:
"${d.objections.doing_own_marketing}"`}let e=`${a} owner in ${b} said: "${c}". Give 3 responses numbered 1, 2, 3.`;return await f("You are a sales coach for a digital marketing agency in India. Give short, confident objection responses in Kanglish. 1-2 sentences max each.",e,"objection_handler")}async function l(a){let b=`You are a motivating sales team assistant for a digital marketing agency in India.
Write a short energetic morning brief for a telecaller. Be encouraging and specific. Max 4 sentences. Write in English.`,c=`Today's data for ${a.userName}:
- Follow-ups due: ${a.followUpCount}
- Fresh leads to call: ${a.freshLeadCount}
- Warm leads: ${a.warmLeads.map(a=>`${a.name} (${a.niche})`).join(", ")||"none"}
- Calls yesterday: ${a.callsYesterday}
- Best niche: ${a.bestNiche}
Write their morning brief.`;return await f(b,c,"morning_brief")}async function m(a){let b=`Last week's data:
${JSON.stringify(a,null,2)}

Write a 3-paragraph summary: performance, what worked, 2 recommendations.`;return await f("You are a business analyst writing a weekly report for a digital marketing agency owner in India. Be concise and insightful.",b,"weekly_report",1e3)}(0,a.i(713095).ensureServerEntryExports)([j,k,l,m]),(0,b.registerServerReference)(j,"704832c627e833a1e0924110ef498877e0ea3a32ce",null),(0,b.registerServerReference)(k,"701268f585c92f0c2d33ac1795e75dd1a85b850f84",null),(0,b.registerServerReference)(l,"405b371b36341a53c3dfabed9bc63422e710a1103f",null),(0,b.registerServerReference)(m,"404c0909e946591e56cedb9473a6b613b188a5f00d",null),a.s([],541643),a.i(541643),a.s(["404c0909e946591e56cedb9473a6b613b188a5f00d",()=>m],575397)}];

//# sourceMappingURL=_next-internal_server_app_admin_reports_page_actions_3b3b57cd.js.map