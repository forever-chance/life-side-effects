'use strict';

const offlineAbout122 = about;
about = function () {
 const originalShow = show;
 show = function (title,text,options=[],...rest) {
  return originalShow(title,text,[...options,{label:'Скачать игру для офлайна',fn:prepareOffline122}],...rest);
 };
 try { return offlineAbout122(); }
 finally { show = originalShow; }
};

async function prepareOffline122() {
 if (!navigator.serviceWorker || !navigator.storage || !window.caches) {
  toast('Этот браузер не поддерживает офлайн-режим игры.');
  return;
 }
 try {
  const registration = await navigator.serviceWorker.register('./offline-worker.js');
  await navigator.serviceWorker.ready;
  const worker = registration.active;
  if (!worker) throw new Error('Offline worker unavailable');
  const channel = new MessageChannel();
  const result = new Promise(resolve => {
   const timer = setTimeout(() => resolve(false), 600000);
   channel.port1.onmessage = ({data}) => { clearTimeout(timer); resolve(data); };
  });
  toast('Скачиваю игру и иллюстрации. Оставь вкладку открытой.');
  worker.postMessage('prepare-offline',[channel.port2]);
  const ready = await result;
  channel.port1.close();
  if (ready) await navigator.storage.persist?.().catch(()=>false);
  toast(ready?'Игра готова к запуску без интернета.':'Скачивание прервалось. Нажми кнопку ещё раз, чтобы продолжить.');
 } catch {
  toast('Не удалось подготовить игру для офлайна. Попробуй снова с интернетом.');
 }
}
