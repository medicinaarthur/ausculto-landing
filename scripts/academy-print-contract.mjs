import {createHash} from 'node:crypto';

// Only printed content belongs to this digest. Percentages stay in native HTML.
export const dossierPrintCopyHash = bank => createHash('sha256').update(JSON.stringify([
 bank.name, bank.edition, bank.shortDescription, bank.facts,
 bank.themes, bank.institution, bank.quote,
])).digest('hex');
