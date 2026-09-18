let lerp (x1, y1) (x2, y2) t = (x1 * (1-t) + x2 * t, y1 * (1-t) + y2 * t);
let line (x1, y1) (x2, y2) = curve (lerp (x1, y1) (x2, y2), (0, 1));

let bezier b0 b1 b2 t = lerp (lerp b0 b1 t) (lerp b1 b2 t) t;

let b0 = (-200?, 0?);
let b1 = (-50?, 300?);
let b2 = (200?, 50?);

line b0 b1;
line b1 b2;
curve (bezier b0 b1 b2, (0, 1));
