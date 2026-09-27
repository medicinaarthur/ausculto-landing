import {readFileSync} from 'node:fs';
import {escapeHtml as esc} from './academy-articles.mjs';
export const testimonials=JSON.parse(readFileSync(new URL('./data/academy-testimonials.json',import.meta.url),'utf8')).testimonials;
export const testimonialAssets=['assets/css/academy-testimonials.css','assets/js/academy-testimonials.js',...testimonials.map(t=>t.image.slice(1))];
export function renderTestimonials(){
 return `<section class="academy-testimonials" aria-label="Depoimentos de quem usa o Ausculto" data-academy-testimonials><div class="at-stage">${testimonials.map((t,i)=>`<figure class="at-slide${i===0?' is-active':''}" data-testimonial-slide aria-label="${i+1} de ${testimonials.length}"><span class="at-portrait at-portrait--${t.frame}"><img src="${esc(t.image)}" alt="Foto de ${esc(t.name)}" width="112" height="112" loading="lazy" decoding="async"></span><figcaption><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span></figcaption><blockquote>“${esc(t.quote)}”</blockquote></figure>`).join('')}</div><div class="at-dots" role="group" aria-label="Escolher depoimento" hidden>${testimonials.map((t,i)=>`<button type="button" data-testimonial-dot="${i}" aria-label="Depoimento de ${esc(t.name)}" aria-pressed="${i===0}"><span></span></button>`).join('')}</div></section>`;
}
