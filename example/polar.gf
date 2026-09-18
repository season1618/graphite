let lerp (x1, y1) (x2, y2) t = (x1 * (1-t) + x2 * t, y1 * (1-t) + y2 * t);
let line (x1, y1) (x2, y2) = curve (lerp (x1, y1) (x2, y2), (0, 1));

let polar (r, th) = (r * cos th, r * sin th);

let a = 1?;

let r = 100?;
let th = 1?;

let x = r * cos th;
let y = r * sin th;

line (0, 0) (x, y);
line (0, 0) (x, 0);
line (0, 0) (0, y);
