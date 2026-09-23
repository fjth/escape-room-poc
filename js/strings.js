// All UI strings used by JS, keyed by <html lang>.
export const strings = {
  nl: {
    audioOn: 'Tombe-geluid uitzetten',
    audioOff: 'Tombe-geluid aanzetten',
    langHint: 'This page is also available in English →',
    langHintClose: 'Close',
    scarabFound: 'Scarabee gevonden! ({n} van 5)',
    scarabProgress: 'Scarabeeën gevonden: {n} van 5',
    scarabAll: 'Alle vijf de scarabeeën gevonden! De farao beloont je met {pct}% korting. Code <code>{code}</code> staat al klaar in je boeking.',
    bookWithDiscount: 'Boek met korting',
    close: 'Sluiten',
    notifyMe: 'Houd me op de hoogte',
    bookPickDate: 'Kies eerst een datum.',
    bookTaken: 'bezet',
    bookFull: 'volgeboekt',
    bookFew: 'bijna vol',
    bookWhen: '{date} om {time}',
    bookGroup: '{n} spelers · {lang}',
    langNl: 'Nederlands',
    langEn: 'Engels',
    bookCodeOk: 'Scarabee-korting toegepast: {pct}% korting.',
    bookCodeBad: 'Deze code kennen we niet. Al op zoek naar de scarabeeën?',
    bookMissing: 'Kies nog een datum en een tijd.',
    bookDone: '{when} · {group} · totaal {total}.',
  },
  en: {
    audioOn: 'Turn tomb ambience off',
    audioOff: 'Turn tomb ambience on',
    langHint: 'Deze pagina is ook in het Nederlands beschikbaar →',
    langHintClose: 'Sluiten',
    scarabFound: 'Scarab found! ({n} of 5)',
    scarabProgress: 'Scarabs found: {n} of 5',
    scarabAll: 'You found all five scarabs! The pharaoh rewards you with {pct}% off. Code <code>{code}</code> is already applied to your booking.',
    bookWithDiscount: 'Book with discount',
    close: 'Close',
    notifyMe: 'Keep me posted',
    bookPickDate: 'Pick a date first.',
    bookTaken: 'taken',
    bookFull: 'fully booked',
    bookFew: 'almost full',
    bookWhen: '{date} at {time}',
    bookGroup: '{n} players · {lang}',
    langNl: 'Dutch',
    langEn: 'English',
    bookCodeOk: 'Scarab discount applied: {pct}% off.',
    bookCodeBad: "We don't know that code. Hunting for scarabs yet?",
    bookMissing: 'Please pick a date and a time.',
    bookDone: '{when} · {group} · total {total}.',
  },
};

// Equivalent section IDs across the two language pages (for the language switch).
export const sectionMap = {
  nl: { top: 'top', binnenkort: 'soon', verhaal: 'story', info: 'info', prijzen: 'prices', boeken: 'book', faq: 'faq', locatie: 'location' },
  en: { top: 'top', soon: 'binnenkort', story: 'verhaal', info: 'info', prices: 'prijzen', book: 'boeken', faq: 'faq', location: 'locatie' },
};

export const lang = document.documentElement.lang === 'en' ? 'en' : 'nl';
export const t = (key, vars = {}) =>
  strings[lang][key].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
