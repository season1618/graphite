let lerp (x1, y1) (x2, y2) t = (x1 * (1-t) + x2 * t, y1 * (1-t) + y2 * t);
let line (x1, y1) (x2, y2) = curve (lerp (x1, y1) (x2, y2), (0, 1));
let polar (r, th) = (r * cos th, r * sin th);

let v = 50;
let th = 1?;

let g = 9.8;
let f t = (v * cos th * t, v * sin th * t - 0.5 * g * t^2);

line (0, 0) (polar (3 * v, th));
curve(f, (0, 2 * v * sin th / g));
