module.exports=[137936,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"registerServerReference",{enumerable:!0,get:function(){return d.registerServerReference}});let d=a.r(211857)},713095,(a,b,c)=>{"use strict";function d(a){for(let b=0;b<a.length;b++){let c=a[b];if("function"!=typeof c)throw Object.defineProperty(Error(`A "use server" file can only export async functions, found ${typeof c}.
Read more: https://nextjs.org/docs/messages/invalid-use-server-value`),"__NEXT_ERROR_CODE",{value:"E352",enumerable:!1,configurable:!0})}}Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"ensureServerEntryExports",{enumerable:!0,get:function(){return d}})},923062,a=>{"use strict";var b=a.i(137936),c=a.i(989227),d=a.i(713095);let e=[{name:"CURIOSITY_TYPE_A",category:"CURIOSITY",label:"Curiosity Message — Type A (SERP Ranked)",lead_type:"A",variables:["businessName","city","niche","searchVolume"],message:`Hi! I came across {{businessName}} while researching {{niche}} businesses in {{city}}.

I noticed you're showing up on Google, but you're not in the top 3 positions where most clicks go.

{{searchVolume}} people search for {{niche}} in {{city}} every month.

We help local businesses move up and capture more of that traffic.

Would it be okay if I share a quick report on your online presence? Takes 2 minutes to read.`,requires_meta_approval:!1,meta_category:"UTILITY",sent_by:"afifa"},{name:"CURIOSITY_TYPE_B",category:"CURIOSITY",label:"Curiosity Message — Type B (Has Website, Not Ranking)",lead_type:"B",variables:["businessName","city","niche","searchVolume"],message:`Hi! I came across {{businessName}} while looking at {{niche}} businesses in {{city}}.

I see you have a website, but it's not appearing when people search for {{niche}} in {{city}}.

{{searchVolume}} people make that search every month — and they're not finding you.

We help businesses like yours start ranking and getting found.

Can I share a quick report on what's happening and how to fix it? It's free.`,requires_meta_approval:!1,meta_category:"UTILITY",sent_by:"afifa"},{name:"CURIOSITY_TYPE_C",category:"CURIOSITY",label:"Curiosity Message — Type C (No Website)",lead_type:"C",variables:["businessName","city","niche","searchVolume"],message:`Hi! I came across {{businessName}} on Google Maps.

{{searchVolume}} people search for {{niche}} in {{city}} every month — but there's no website for your business when they search.

That means those potential customers are going to your competitors who do have one.

We build websites that rank and bring in calls. Can I share a quick overview of what that could look like for {{businessName}}?`,requires_meta_approval:!1,meta_category:"UTILITY",sent_by:"afifa"},{name:"CURIOSITY_TYPE_D",category:"CURIOSITY",label:"Curiosity Message — Type D (Low Search Volume)",lead_type:"D",variables:["businessName","city","niche"],message:`Hi! I came across {{businessName}} while researching {{niche}} businesses in {{city}}.

Digital presence is becoming important for every local business — and the ones who build it early have a real advantage.

We help businesses like yours get found online through their website, Google listing, and search rankings.

Can I share what we do and how it works? It's a 2-minute read.`,requires_meta_approval:!1,meta_category:"UTILITY",sent_by:"afifa"},{name:"FOLLOW_BACK_CALL",category:"FOLLOW_BACK_REMINDER",label:"Follow-Back Reminder — After Call",lead_type:null,variables:["businessName"],message:`Hi {{businessName}}, this is Afifa from FortuneMarq.

I tried calling you but couldn't get through. I wanted to share a quick report about your online presence in your city.

Is there a good time I can call you back?`,requires_meta_approval:!1,meta_category:"UTILITY",sent_by:"afifa"},{name:"FOLLOW_BACK_REPORT_SENT",category:"FOLLOW_BACK_REMINDER",label:"Follow-Back After Report Sent",lead_type:null,variables:["businessName"],message:`Hi {{businessName}}, I had sent you a report on your online presence a few days back.

Did you get a chance to go through it?

Happy to answer any questions or explain anything in more detail.`,requires_meta_approval:!1,meta_category:"UTILITY",sent_by:"afifa"},{name:"SEND_PORTFOLIO",category:"OUTCOME_TRIGGERED",label:"Send Portfolio",lead_type:null,variables:["businessName"],message:`Hi {{businessName}}, here is our portfolio of work — websites, GMB profiles, and ranking results we've done for similar businesses in your area.

[Portfolio Link — add link here]

Take a look and let me know your thoughts!`,requires_meta_approval:!1,meta_category:"MARKETING",sent_by:"jabeer_manual"},{name:"POST_MEETING_FOLLOW_UP",category:"POST_MEETING",label:"Post-Meeting Follow-Up",lead_type:null,variables:["businessName","ownerName"],message:`Hi {{ownerName}}, thank you for taking the time for our meeting today.

I hope the presentation gave you a clear picture of the opportunity for {{businessName}} online.

I'll be sending you the proposal shortly. Let me know if you have any questions in the meantime!

— Jabeer, FortuneMarq`,requires_meta_approval:!1,meta_category:"UTILITY",sent_by:"jabeer_manual"},{name:"POST_MEETING_PROPOSAL_SENT",category:"POST_MEETING",label:"Proposal Sent Message",lead_type:null,variables:["ownerName","businessName"],message:`Hi {{ownerName}}, here is the Online Growth Proposal I promised for {{businessName}}.

[Proposal PDF — attached]

Please go through it and let me know if you'd like to adjust anything. Looking forward to working with you!

— Jabeer, FortuneMarq`,requires_meta_approval:!1,meta_category:"UTILITY",sent_by:"jabeer_manual"},{name:"POST_MEETING_PROPOSAL_REMINDER",category:"POST_MEETING",label:"Proposal Follow-Up Reminder",lead_type:null,variables:["ownerName","businessName"],message:`Hi {{ownerName}}, just checking in on the proposal I sent for {{businessName}}.

Did you get a chance to look through it? Happy to clarify anything.

— Jabeer, FortuneMarq`,requires_meta_approval:!1,meta_category:"UTILITY",sent_by:"jabeer_manual"},{name:"UPSELL_SUMMARY_SOCIAL",category:"POST_MEETING",label:"Upsell Summary — Social Media",lead_type:null,variables:["ownerName","businessName"],message:`Hi {{ownerName}}, great speaking with you today!

As discussed, here's a summary of what Social Media Management would look like for {{businessName}}:
• Instagram + Facebook posts: 12/month
• Custom branded creatives
• Reply management
• Monthly performance report

Monthly Retainer: [Price]

Let me know if you'd like to go ahead!

— Jabeer, FortuneMarq`,requires_meta_approval:!1,meta_category:"MARKETING",sent_by:"jabeer_manual"},{name:"UPSELL_SUMMARY_ADS",category:"POST_MEETING",label:"Upsell Summary — Google Ads",lead_type:null,variables:["ownerName","businessName"],message:`Hi {{ownerName}}, following up on our conversation!

Here's what Google Ads management would include for {{businessName}}:
• Campaign setup and management
• Weekly optimisation
• Monthly performance report
• Ad spend is separate (you decide the budget)

Management Fee: [Price]/month

Ready to start? Let me know!

— Jabeer, FortuneMarq`,requires_meta_approval:!1,meta_category:"MARKETING",sent_by:"jabeer_manual"},{name:"UPSELL_CLOSED_CONFIRMATION",category:"POST_MEETING",label:"Upsell Confirmed",lead_type:null,variables:["ownerName","businessName","service"],message:`Hi {{ownerName}}, great news — we're all set to add {{service}} for {{businessName}}!

I'll send the updated agreement shortly. Once confirmed, we'll get everything set up within the week.

Excited to take things to the next level for you!

— Jabeer, FortuneMarq`,requires_meta_approval:!1,meta_category:"UTILITY",sent_by:"jabeer_manual"},{name:"UPSELL_FOLLOWUP",category:"POST_MEETING",label:"Upsell Follow-Up",lead_type:null,variables:["ownerName","businessName"],message:`Hi {{ownerName}}, just checking in on our conversation about expanding services for {{businessName}}.

No pressure at all — just wanted to see if you had any questions or wanted to talk through the numbers again.

— Jabeer, FortuneMarq`,requires_meta_approval:!1,meta_category:"UTILITY",sent_by:"jabeer_manual"}];async function f(){let a=await (0,c.createServerClientWithCookies)(),b=0,d=0;try{for(let c of e){let{data:e}=await a.from("whatsapp_templates").select("id").eq("name",c.name).maybeSingle();if(e){d++;continue}let{error:f}=await a.from("whatsapp_templates").insert({name:c.name,category:c.category,label:c.label,lead_type:c.lead_type,variables:c.variables,message:c.message,requires_meta_approval:c.requires_meta_approval,meta_category:c.meta_category,sent_by:c.sent_by});f?console.error(`Failed to seed template ${c.name}:`,f.message):b++}return{success:!0,seeded:b,skipped:d}}catch(a){return{success:!1,seeded:b,skipped:d,error:a.message}}}(0,d.ensureServerEntryExports)([f]),(0,b.registerServerReference)(f,"006b79b8fc90593709f4d536b4bb65a2f5986a1e12",null),a.s([],922741),a.i(922741),a.s(["006b79b8fc90593709f4d536b4bb65a2f5986a1e12",()=>f],923062)}];

//# sourceMappingURL=_8aa0f98d._.js.map