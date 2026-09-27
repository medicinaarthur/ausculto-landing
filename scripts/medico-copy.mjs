/** The doctor page is supplied as a precompiled bundle; apply only reviewed copy at assembly. */
export function updateMedicoCopy(source,facts) {
  return source.replace(/Meu Plantão/gi,'AusFlow')
    .replace(/250\+/g,`${facts.medicalCalculatorsMinimum}+`)
    .replace(/4\.700\+/g,facts.pathologies.toLocaleString('pt-BR'))
    .replace(/50\.000\+/g,`${facts.questionBankMinimum/1000} mil+`);
}
