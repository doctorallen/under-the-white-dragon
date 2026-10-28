'use strict';
// A sprite painted from shapes, flat: three hard tones a material (shadow,
// base, light) with no noise, a box a flat panel (lit along its top and left
// edges, shaded along its bottom and right), a shadow line where one part lies
// over another (`part`), and a dark outline round the whole, so everything
// reads as drawn pixel art, people and props alike. (`Spr.soft` paints the old
// way, in soft runs of close tones, for anything that wants it.)
//
// The painter is Tycho's (Tycho.sprite.Shapes, which grew from this file):
// `new Spr(w, h, seed)`, `Spr.figure`, `Spr.soft`; ell, box, limb, cap, shape,
// poly and px in a material's ramp, `part()`, then `done()` for the sprite
// ({ c, e, w, h, ax, ay }). Its finish is this game's (soot ink, the defaults).
const Spr = Tycho.sprite.Shapes;
// a sprite facing the other way (its picture and glow flipped, its anchor mirrored)
const flipSprite = (s) => Tycho.sprite.flipSprite(s);
