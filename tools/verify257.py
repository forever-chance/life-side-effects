import asyncio,json
from playwright.async_api import async_playwright
TESTS=r"""
(()=>{const r={};
const opts=[...document.querySelectorAll('#background option')].map(o=>o.value+':'+o.textContent);r.background=opts;
return r})()
"""
AFTER=r"""
(()=>{const r={};
r.rates=Object.keys(countries).filter(c=>!Number.isFinite(mortgageRates43[c]));
r.instIt=Math.round(installment(200000,mortgageRates43.it,300));
r.schoolMissing=Object.keys(countries).filter(c=>!schoolLanguageCatalog73[c]);
r.schoolErr=[];for(const c of Object.keys(countries)){try{const p={id:'t'+c,country:c,age:12,school:{type:'public'},city18:cities[c][0]};schoolLanguageDetails73(p)}catch(e){r.schoolErr.push(c+':'+e.message)}}
r.notesEmpty=Object.keys(countries).filter(c=>!countryNotes87[c]);
r.cnUS=birthCitizenships17('us',[{id:'a',citizenships:['cn'],country:'us'},{id:'b',citizenships:['us'],country:'us'}]);
r.cnUSsettled=birthCitizenships17('us',[{id:'a',citizenships:['cn'],country:'us',permanentResident:true},{id:'b',citizenships:['us'],country:'us'}]);
r.cnCN=birthCitizenships17('cn',[{id:'a',citizenships:['cn'],country:'cn'},{id:'b',citizenships:['de'],country:'cn'}]);
r.death=[30,45,60,70,80,90,100].map(a=>[a,+deathChance257(a,70).toFixed(4),+deathChance257(a,20).toFixed(4)]);
// NaN mortgage repair
s.debts=s.debts||[];s.debts.push({id:'m1',type:'bank',country:'it',balance:100000,principal:100000,rate:NaN,payment:400,term:240,paid:0,missed:0,started:s.clock.ticks-5,mortgage43:{propertyId:'x',interest:NaN,interestPaid:0,principalPaid:0,owed:NaN,lastAccrual:s.clock.ticks-1,elapsed:4,history:[],operations:[],status:'active'}});
delete s.repair257;repairSave257();const d=s.debts.at(-1);r.repaired=[d.rate,Math.round(d.payment),d.mortgage43.interest,d.mortgage43.owed];s.debts.pop();
// habit loop: prompt when already used this month
s.age=Math.max(s.age,25);const h=habits78();h.smoke.used=s.clock.ticks;s.pending=[{type:'habit78',kind:'smoke',context:'stress'}];resolvePending();
const btn=[...document.querySelectorAll('#modal button')].find(b=>/Закурить/.test(b.textContent));r.habitBtn=!!btn;if(btn)btn.click();
r.pendingAfter=s.pending.length;r.modalOpenAfter=$('#modal').open;r.modalTitle=document.querySelector('#modal h2,#modal h3')?.textContent||'';
// save() no longer creates bills notice
const before=(life61().notices||[]).length;save();r.saveNotices=(life61().notices||[]).length-before;
return r})()
"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page()
        await pg.route("**/fonts.googleapis.com/**", lambda r: r.abort())
        errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:400]))
        await pg.goto("http://localhost:8765/",wait_until="load")
        await pg.wait_for_function("typeof start==='function' && document.querySelector('#country')")
        print(json.dumps(await pg.evaluate(TESTS),ensure_ascii=False))
        await pg.evaluate("()=>{const e=document.getElementById('country');e.value='pl';e.dispatchEvent(new Event('change',{bubbles:true}));const b=document.getElementById('background');b.value='low';b.dispatchEvent(new Event('change',{bubbles:true}));}")
        await pg.click("text=Родиться")
        await pg.wait_for_function("typeof s!=='undefined' && s && s.clock")
        await pg.evaluate("()=>{try{if(typeof startupNotice180==='function'&&startupNotice180())finishStartup180(false);if(typeof tutorialActive180==='function'&&tutorialActive180())endTutorial180('skipped');}catch(e){}}")
        print('bg chosen:',await pg.evaluate("s.background"))
        await pg.evaluate("()=>{try{document.querySelector('#modal')?.close()}catch(e){}}")
        print(json.dumps(await pg.evaluate(AFTER),ensure_ascii=False,indent=1))
        print('ERR',errs)
        await b.close()
asyncio.run(main())
