import { chromium } from "@playwright/test";
const BASE="http://localhost:3111", OUT="/private/tmp/claude-501/-Users-stephanmoralescompean-Desktop-Bluma/8d78f2be-dda2-4fcf-9da3-333752562e3d/scratchpad";
const t=JSON.parse(process.argv[2]??"[]");
const b=await chromium.launch();
for(const x of t){const p=await b.newPage({viewport:{width:x.w??1440,height:x.h??900},deviceScaleFactor:2});
await p.goto(BASE+x.path,{waitUntil:"networkidle"}); if(x.scroll)await p.evaluate(y=>window.scrollTo(0,y),x.scroll);
await p.waitForTimeout(x.wait??1500); await p.screenshot({path:`${OUT}/${x.name}.png`,fullPage:x.full??false});
console.log("shot",x.name); await p.close();}
await b.close();
