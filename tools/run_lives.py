import asyncio, json, random, sys, time
from playwright.async_api import async_playwright

URL = "http://localhost:8765/"
HARNESS = open(__import__("os").path.join(__import__("os").path.dirname(__file__),"harness.js"), encoding="utf-8").read().replace("console.log(", "(()=>{})(")
OUT = sys.argv[1] if len(sys.argv) > 1 else "lives.jsonl"
N = int(sys.argv[2]) if len(sys.argv) > 2 else 4
PAR = int(sys.argv[3]) if len(sys.argv) > 3 else 4
MAX_AGE = int(sys.argv[4]) if len(sys.argv) > 4 else 90
ACT = float(sys.argv[5]) if len(sys.argv) > 5 else 0.25
SEED = int(sys.argv[6]) if len(sys.argv) > 6 else 1


async def one_life(browser, idx, cfg, out):
    ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
    await ctx.route("**/fonts.googleapis.com/**", lambda r: r.abort())
    pg = await ctx.new_page()
    perr, cerr = [], []
    trail = []
    pg.on("console", lambda m: (trail.append(m.text[:200]), trail.__delitem__(0) if len(trail) > 40 else None) if m.text.startswith("ACT") else None)
    pg.on("pageerror", lambda e: perr.append((getattr(e,"stack",None) or str(e))[:1500]))
    pg.on("console", lambda m: cerr.append(m.text[:300]) if m.type == "error" and "ERR_FAILED" not in m.text and "favicon" not in m.text else None)
    t0 = time.time()
    res = {"idx": idx, "cfg": cfg}
    try:
        await pg.goto(URL, wait_until="load")
        await pg.wait_for_function("typeof start==='function' && document.querySelector('#country')")
        for k, v in cfg.items():
            if v is None:
                continue
            await pg.evaluate("([k,v])=>{const e=document.getElementById(k); if(e){e.value=v; e.dispatchEvent(new Event('change',{bubbles:true}));}}", [k, v])
        await pg.click("text=Родиться")
        await pg.wait_for_function("typeof s!=='undefined' && s && s.clock", timeout=15000)
        await pg.evaluate("()=>{try{if(typeof startupNotice180==='function'&&startupNotice180())finishStartup180(false);if(typeof tutorialActive180==='function'&&tutorialActive180())endTutorial180('skipped');}catch(e){}}")
        await pg.evaluate(HARNESS)
        res["start"] = await pg.evaluate("({name:s.name,country:s.country,gender:s.gender,orientation:s.orientation,bg:s.background,age:s.age,year:s.year})")
        texts, issues, actions = [], [], []
        last = None
        for chunk in range(20000):
            st = await pg.evaluate(f"__H.run(6,{ACT})")
            d = await pg.evaluate("__H.dump()")
            texts += d["texts"]; issues += d["issues"]; actions += d["actions"]
            last = st
            if st["dead"] or st["age"] >= MAX_AGE:
                break
            if time.time() - t0 > 1200:
                res["timeout"] = True
                break
        res["end"] = last
        res["final"] = await pg.evaluate("({age:s.age,dead:s.dead,cash:s.cash,country:s.country,job:s.job&&s.job.title,people:s.people.length,alive:s.people.filter(p=>p.alive).length,roles:[...new Set(s.people.map(p=>p.role))],logLen:s.log.length,saveBytes:(localStorage.getItem('life-side-effects-v1')||'').length, lsKeys:Object.keys(localStorage).length, lsBytes:Object.keys(localStorage).reduce((n,k)=>n+(localStorage.getItem(k)||'').length,0)})")
        res["texts"], res["issues"], res["actions"] = texts, issues, actions
    except Exception as e:
        res["fatal"] = repr(e)[:800]
        res["trail"] = trail[:]
    res["pageerrors"], res["consoleerrors"] = perr[:50], cerr[:50]
    res["secs"] = round(time.time() - t0, 1)
    out.write(json.dumps(res, ensure_ascii=False) + "\n"); out.flush()
    print(idx, res.get("start"), "->", res.get("end"), res.get("secs"), "issues", len(res.get("issues", [])), "perr", len(perr), res.get("fatal", ""), flush=True)
    await ctx.close()


async def main():
    rng = random.Random(SEED)
    countries = ["random", "nl", "rs", "ru", "us", "br", "jp", "fr", "es", "de", "uk", "ca", "kr", "cn", "mx", "it", "au", "tr", "za", "th", "no", "in", "id", "eg", "ma", "pl"]
    cfgs = []
    for i in range(N):
        cfgs.append({
            "startAge": rng.choice(["0", "0", "18"]),
            "country": rng.choice(countries),
            "gender": rng.choice(["random", "f", "m"]),
            "orientation": rng.choice(["random", "hetero", "gay", "bi", "ace"]),
            "background": rng.choice(["random", "low", "mid", "high"]),
            "familyOrigin17": rng.choice(["random", "local", "minority", "migrant", "mixed", "settled"]),
            "familyHousehold131": rng.choice(["random", "both", "one", "unknown"]),
        })
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage", "--enable-precise-memory-info"])
        sem = asyncio.Semaphore(PAR)
        with open(OUT, "a", encoding="utf-8") as out:
            async def guarded(i, c):
                async with sem:
                    await one_life(b, i, c, out)
            await asyncio.gather(*[guarded(i, c) for i, c in enumerate(cfgs)])
        await b.close()

asyncio.run(main())
