let lerp (x1, y1) (x2, y2) t = (x1 * (1-t) + x2 * t, y1 * (1-t) + y2 * t);
let line (x1, y1) (x2, y2) = curve (lerp (x1, y1) (x2, y2), (0, 1));

let s = 0?;
let m = s / 60;
let h = m / 60;

let polar (r, th) = (r * sin th, r * cos th);

line (0, 0) (polar (200, s / 60 * 6.28));
line (0, 0) (polar (150, m / 60 * 6.28));
line (0, 0) (polar (100, h / 12 * 6.28));
