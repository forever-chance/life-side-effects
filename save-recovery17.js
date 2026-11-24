'use strict';
// Recover a partially applied delete before any legacy auto-recovery reads saves.
try{const raw=localStorage.getItem('life-delete-journal17');if(raw){const journal=JSON.parse(raw);for(const [key,value]of journal.entries){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}localStorage.removeItem('life-delete-journal17');}}catch(e){console.warn('Не удалось восстановить незавершенное удаление сохранения.');}
