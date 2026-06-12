module.exports=[137936,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"registerServerReference",{enumerable:!0,get:function(){return d.registerServerReference}});let d=a.r(211857)},713095,(a,b,c)=>{"use strict";function d(a){for(let b=0;b<a.length;b++){let c=a[b];if("function"!=typeof c)throw Object.defineProperty(Error(`A "use server" file can only export async functions, found ${typeof c}.
Read more: https://nextjs.org/docs/messages/invalid-use-server-value`),"__NEXT_ERROR_CODE",{value:"E352",enumerable:!1,configurable:!0})}}Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"ensureServerEntryExports",{enumerable:!0,get:function(){return d}})},704972,a=>{"use strict";var b=a.i(137936),c=a.i(989227),d=a.i(118558);async function e({text:a,destination:b,timeframe:c,assignee:d}){let e=process.env.ANTHROPIC_API_KEY;if(!e)return{success:!1,error:"ANTHROPIC_API_KEY is not configured on the server."};let f=`You are a task extraction engine for FortuneMarq, a digital marketing agency.

You will receive a strategy document. Your job is to extract ALL actionable tasks and return them as a JSON array.

DESTINATION CONTEXT: ${b}
TIMEFRAME: ${c}
DEFAULT ASSIGNEE: ${d}
TODAY'S DATE: ${new Date().toISOString().split("T")[0]}

Rules:
1. Extract EVERY specific action item from the document
2. If a task has no explicit due date, distribute tasks evenly across the timeframe
3. If a task has no assignee, use the default assignee
4. Break large vague tasks into smaller specific ones (max 2 hours of work per task)
5. Priority: use 'high' for week 1 items, 'medium' for week 2-3, 'low' for later
6. Every task MUST have: title, description, due_date (YYYY-MM-DD), priority, assignee, section_tag

Return ONLY valid JSON, no preamble, no explanation. Format:
{
  "strategy_title": "string",
  "total_tasks": number,
  "tasks": [
    {
      "title": "string (max 80 chars, action verb first)",
      "description": "string (1-2 sentences of context/guidance)",
      "due_date": "YYYY-MM-DD",
      "priority": "high|medium|low",
      "assignee": "admin|telecaller|user_id",
      "section_tag": "string",
      "estimated_minutes": number
    }
  ]
}`;try{let b=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":e,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:4e3,temperature:0,system:f,messages:[{role:"user",content:`Here is the strategy document. Please extract the tasks into the requested JSON format:

${a}`}]})});if(!b.ok){let a=await b.json();return{success:!1,error:a.error?.message||`API Error: ${b.status}`}}let c=await b.json(),d=(c.content?.[0]?.text||"{}").replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();return{success:!0,data:JSON.parse(d)}}catch(a){return{success:!1,error:a instanceof Error?a.message:"Unknown error calling Anthropic API"}}}async function f(){let a=await (0,c.createServerClientWithCookies)(),{data:b}=await a.from("profiles").select("id, full_name, email, role").order("full_name",{ascending:!0});return b||[]}async function g(a,b,e,f,g,h,i){let j=await (0,c.createServerClientWithCookies)(),{data:k}=await j.auth.getUser();if(!k?.user)throw Error("Not authenticated");let{data:l,error:m}=await j.from("strategy_runs").insert({title:b,destination:e,timeframe:f,strategy_text:g,tasks_generated:a.length,created_by:k.user.id,...h?{client_id:h}:{},...i?{strategy_type:i}:{}}).select().single();if(m)return console.error("Error creating strategy run:",m),{success:!1,error:m.message};let n=a.map(a=>({title:a.title,description:a.description,due_date:a.due_date,priority:a.priority,assigned_to:a.assignee,section_tag:a.section_tag,estimated_minutes:a.estimated_minutes,strategy_run_id:l.id,status:"pending",type:"admin",...a.client_id?{client_id:a.client_id}:{}})),{data:o,error:p}=await j.from("tasks").insert(n).select();if(p)return console.error("Error creating tasks:",p),{success:!1,error:p.message};if(o&&o.length>0){let a=o.map(a=>({strategy_run_id:l.id,task_id:a.id})),{error:b}=await j.from("strategy_run_tasks").insert(a);b&&console.error("Error creating strategy links:",b)}return(0,d.revalidatePath)("/admin/strategy/archive"),(0,d.revalidatePath)("/tasks"),{success:!0,count:o?.length||0}}async function h(){let a=await (0,c.createServerClientWithCookies)(),{data:b,error:d}=await a.from("strategy_runs").select("*, profiles!created_by(full_name)").order("created_at",{ascending:!1});return d&&console.error("Error fetching strategy archive:",d),b||[]}async function i(a){let b=await (0,c.createServerClientWithCookies)(),{data:d}=await b.from("tasks").select("id, status").eq("strategy_run_id",a),e=d?.length||0,f=d?.filter(a=>"completed"===a.status||"approved"===a.status).length||0;return{total:e,completed:f,remaining:e-f}}async function j(a){let b=await (0,c.createServerClientWithCookies)(),{data:d,error:e}=await b.from("strategy_runs").select("*").eq("client_id",a).order("created_at",{ascending:!1});if(e&&console.error("Error fetching client strategy runs:",e),!d||0===d.length)return[];let f=[];for(let a of d){let b=await i(a.id);f.push({...a,counts:b})}return f}(0,a.i(713095).ensureServerEntryExports)([e,f,g,h,i,j]),(0,b.registerServerReference)(e,"40091df5affa4e0965a557a569ae588ee3e897318d",null),(0,b.registerServerReference)(f,"00a91a71a3801d776ad37265b1dfc1fbfe8926c04f",null),(0,b.registerServerReference)(g,"7f81d029b972fce57dbbed7eaac6a2e80c4e75c3eb",null),(0,b.registerServerReference)(h,"0008ac9bcfc9e06600f017a63e95305d56d4a7f5d7",null),(0,b.registerServerReference)(i,"40b1dc3e8d8ff12ce2a4ecca9d10fcccbe60334f09",null),(0,b.registerServerReference)(j,"4030d2c4a4bf3b0457be4cf73f4b6472be881977f9",null),a.s(["extractStrategyTasks",()=>e,"fetchClientStrategyRuns",()=>j,"fetchStrategyArchive",()=>h,"fetchStrategyRunCompletion",()=>i,"fetchStrategyTeam",()=>f,"saveApprovedTasks",()=>g])},597421,a=>{"use strict";var b=a.i(704972);a.s([],637192),a.i(637192),a.s(["0008ac9bcfc9e06600f017a63e95305d56d4a7f5d7",()=>b.fetchStrategyArchive,"00a91a71a3801d776ad37265b1dfc1fbfe8926c04f",()=>b.fetchStrategyTeam,"40091df5affa4e0965a557a569ae588ee3e897318d",()=>b.extractStrategyTasks,"4030d2c4a4bf3b0457be4cf73f4b6472be881977f9",()=>b.fetchClientStrategyRuns,"40b1dc3e8d8ff12ce2a4ecca9d10fcccbe60334f09",()=>b.fetchStrategyRunCompletion,"7f81d029b972fce57dbbed7eaac6a2e80c4e75c3eb",()=>b.saveApprovedTasks],597421)}];

//# sourceMappingURL=_673eb47d._.js.map