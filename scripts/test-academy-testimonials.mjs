import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTestimonials,testimonials} from './academy-testimonials.mjs';
test('testimonials preserve attributed source quotes and one selector per colleague',()=>{
 const html=renderTestimonials();
 assert.equal((html.match(/data-testimonial-slide/g)||[]).length,testimonials.length);
 assert.equal((html.match(/data-testimonial-dot=/g)||[]).length,testimonials.length);
 for(const t of testimonials){assert(t.quote.length>30);assert.match(t.image,/^\/assets\/testimonials\//);assert(html.includes(t.name));}
 assert.doesNotMatch(html,/Pausar|5 estrelas|★★★★★/);
});
