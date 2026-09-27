import {readFileSync} from 'node:fs';
export const simDemo=JSON.parse(readFileSync(new URL('./data/academy-sim-demo.json',import.meta.url),'utf8'));
export function renderSimDemo(){
 const payload=JSON.stringify(simDemo).replace(/</g,'\\u003c');
 return `<div class="sim-demo" id="simulados-demo"><span class="sim-demo__badge">Configure sua próxima prova</span>
 <form data-sim-demo aria-label="Prévia do gerador de simulados">
 <ol class="sim-steps" aria-label="Etapas">${['Formato','Banca','Assuntos','Questões'].map((label,i)=>`<li data-sim-step aria-label="${i+1}. ${label}"><span>${i+1}</span><small>${label}</small></li>`).join('')}</ol>
 <h4 data-sim-heading tabindex="-1">1. Escolha como praticar</h4>
 <div data-sim-panel><p>Configure sua prova no aplicativo.</p></div>
 <section id="sim-selector" class="sim-selector" aria-labelledby="sim-selector-title" hidden>
 <header><div><span class="sim-selector-kicker">Selecione seus assuntos</span><h5 id="sim-selector-title">Selecionar</h5></div><button type="button" data-sim-cancel aria-label="Voltar sem aplicar a seleção">×</button></header>
 <label class="sim-selector-search"><span>Buscar nesta lista</span><input type="search" autocomplete="off" placeholder="Digite um assunto"></label>
 <div data-sim-options></div>
 <footer><span data-sim-selection-count role="status"></span><button type="button" data-sim-clear>Limpar</button><button type="button" data-sim-apply>Aplicar seleção</button></footer>
 </section>
 <p class="sim-demo__status" role="status" aria-live="polite" data-sim-status></p>
 <div class="sim-navigation"><button type="button" data-sim-back hidden>← Voltar</button><button type="button" data-sim-next disabled>Continuar →</button><a class="sim-demo__cta" href="${simDemo.appUrl}">Gerar simulado no app ↗</a></div>
 <p class="sim-demo__note">Prévia interativa. As escolhas não são transferidas; finalize a configuração no app. Cobertura e disponibilidade são confirmadas no aplicativo.</p>
 <noscript><p>Abra o app para configurar seu simulado.</p></noscript></form></div><script type="application/json" id="sim-preview-data">${payload}</script>`;
}
