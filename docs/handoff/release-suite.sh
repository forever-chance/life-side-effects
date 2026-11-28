#!/bin/bash
G=${1:?папка игры}; OUT=${2:?папка логов}; SAVE=${OWNER_SAVE:-}; RES=${UNIS_RESEARCH:-}
cd "$G"; mkdir -p "$OUT"
out=$OUT
: > $out/summary.txt
run(){ name=$1; shift; "$@" > $out/$name.log 2>&1; rc=$?; echo "$name rc=$rc $(grep -aE 'прошл|passed|ИТОГ|Итог|[0-9]+/[0-9]+|FAIL' $out/$name.log | tail -1 | cut -c1-160)" >> $out/summary.txt; }
run v2791 env OWNER_SAVE=$SAVE UNIS_RESEARCH=$RES node tools/verify2791_unis.js
run q27911 env OWNER_SAVE=$SAVE UNIS_RESEARCH=$RES node tools/verify27911_quebec.js
run l27912 env OWNER_SAVE=$SAVE UNIS_RESEARCH=$RES node tools/verify27912_langs.js
run g27913 env OWNER_SAVE=$SAVE UNIS_RESEARCH=$RES node tools/verify27913_langs.js
run i27914 env OWNER_SAVE=$SAVE UNIS_RESEARCH=$RES node tools/verify27914_ids.js
run card env OWNER_SAVE=$SAVE node tools/verify273_card.js
run verify node tools/verify.js
for f in tools/verify27*_*.js; do b=$(basename $f .js); [ $b = verify273_card ] && continue; [ $b = verify2791_unis ] && continue; [ $b = verify27911_quebec ] && continue; [ $b = verify27912_langs ] && continue; [ $b = verify27913_langs ] && continue; [ $b = verify27914_ids ] && continue; run $b node $f; done
run bench node tools/save_bench.js 40 3
run audit python3 tools/text_audit.py
echo DONE >> $out/summary.txt
