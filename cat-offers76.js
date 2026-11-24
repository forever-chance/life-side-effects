'use strict';
const originalPetOffer76 = petOffer38;
petOffer38 = function(kind, breed = null, source = 'shelter') {
  if (kind !== 'cat' || source === 'rehoming') return originalPetOffer76(kind, breed, source);
  const previous = petState38().offers[breed || kind];
  const reserved = previous?.status === 'queued' && s.clock.tasks.some(
    task => task.action === 'pet' && task.payload?.id === previous.id
  );
  if (previous && !reserved && previous.expires === s.clock.ticks) {
    previous.expires--;
  }
  const offer = originalPetOffer76(kind, breed);
  if (previous && offer && offer !== previous && offer.art38 === previous.art38) {
    const alternatives = petPool66('cat', offer.breed38 || null).filter(
      art => art.id !== previous.art38
    );
    if (alternatives.length) offer.art38 = alternatives[petHash38(offer.id) % alternatives.length].id;
  }
  return offer;
};
