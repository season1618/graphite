let lerp3 (x1, y1, z1) (x2, y2, z2) t = (x1 * (1-t) + x2 * t, y1 * (1-t) + y2 * t, z1 * (1-t) + z2 * t);

let orth (x, y, z) = (x, z);
let pers (x, y, z) = (x/y, z/y);

let scale s (x, y) = (s * x, s * y);
let translate (dx, dy, dz) (x, y, z) = (x + dx, y + dy, z + dz);
let rotate th (x, y, z) = (x * cos th - y * sin th, x * sin th + y * cos th, z);

let th = 1;

put scale 300:
put pers:
put translate (-1, 3.3, 0):
put rotate 1:
  let line3 p1 p2 = curve (lerp3 p1 p2, (0, 1));
  let p0 = (-1, -1, -1);
  let p1 = (-1, -1,  1);
  let p2 = (-1,  1, -1);
  let p3 = (-1,  1,  1);
  let p4 = ( 1, -1, -1);
  let p5 = ( 1, -1,  1);
  let p6 = ( 1,  1, -1);
  let p7 = ( 1,  1,  1);

  line3 p0 p1;
  line3 p1 p3;
  line3 p3 p2;
  line3 p2 p0;

  line3 p0 p4;
  line3 p1 p5;
  line3 p2 p6;
  line3 p3 p7;

  line3 p4 p5;
  line3 p5 p7;
  line3 p7 p6;
  line3 p6 p4;

  end
  end
  end
  end
