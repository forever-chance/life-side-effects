'use strict';
// Repaint saved games only after every interface extension has loaded.
function restoreGrandparentLines147(){
 if(!s||s.grandparentLines147)return;
 s.grandparentLines147=true;
 createGrandparents145();
 save();
}
const loadBeforeGrandparents147=loadCharacter;
loadCharacter=function(id){
 const previous=s;
 loadBeforeGrandparents147(id);
 if(s!==previous){restoreGrandparentLines147();render();}
};
if(s){ensureUX();restoreGrandparentLines147();render();}
