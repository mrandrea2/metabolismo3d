import { colors } from "./phases.js";

const tau = 2 * Math.PI;
const mix = (a, b, t) => a + (b - a) * t;
const between = (a, b, t) => a.map((value, i) => mix(value, b[i], t));
const smooth = t => t * t * (3 - 2 * t);
const orbit = (angle, rx, ry, z = 0) => [Math.cos(angle) * rx, Math.sin(angle) * ry, z];

function pathAt(path, progress) {
  const time = Math.max(0, Math.min(1, progress)) * (path.length - 1);
  const start = Math.min(path.length - 2, Math.floor(time));
  return between(path[start], path[start + 1], time - start);
}

function tint(color, adjustment) {
  const value = parseInt(color.slice(1), 16);
  return '#' + [16, 8, 0].map(shift => {
    const channel = (value >> shift) & 255;
    return Math.round(adjustment > 0 ? mix(channel, 255, adjustment) : channel * (1 + adjustment))
      .toString(16).padStart(2, "0");
  }).join("");
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  const gradients = new Map();
  let width, height, scale, camera, compact;
  let commands, labels;
  const focal = 13;

  function project(point) {
    const [x, y, z] = point;
    const rotatedX = x * camera.cosY + z * camera.sinY;
    const yawDepth = -x * camera.sinY + z * camera.cosY;
    const rotatedY = y * camera.cosP - yawDepth * camera.sinP;
    const depth = y * camera.sinP + yawDepth * camera.cosP;
    const k = scale * focal / Math.max(4, focal - depth);
    return { x: width / 2 + rotatedX * k, y: height / 2 - rotatedY * k, z: depth, k };
  }

  function ball(point, radius, color, glow = false, opacity = 1) {
    const p = project(point);
    const r = Math.max(1.1, radius * p.k);
    commands.push({ z: p.z, paint() {
      ctx.save();
      ctx.globalAlpha = opacity;
      if (glow) { ctx.shadowBlur = Math.min(18, r * 1.25); ctx.shadowColor = color; }
      let shades = gradients.get(color);
      if (!shades) {
        shades = [tint(color, .72), tint(color, .18), color, tint(color, -.65)];
        gradients.set(color, shades);
      }
      const g = ctx.createRadialGradient(p.x - r * .33, p.y - r * .36, r * .06, p.x, p.y, r * 1.04);
      shades.forEach((shade, i) => g.addColorStop([0, .27, .58, 1][i], shade));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, tau);
      ctx.fill();
      ctx.restore();
    } });
  }

  function line(from, to, color, thickness = .047, opacity = 1, dash = false) {
    const a = project(from), b = project(to);
    commands.push({ z: (a.z + b.z) / 2 - .025, paint() {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(.75, thickness * (a.k + b.k) / 2);
      ctx.lineCap = "round";
      if (dash) ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    } });
  }

  function trail(points, color, opacity = .6) {
    points.slice(1).forEach((point, i) => line(points[i], point, color, .043, opacity));
  }

  function text(point, words, color = "#e9efff", options = {}) {
    labels.push({ p: project(point), words, color, ...options });
  }

  function paintLabel({ p, words, color, small = false, align = "center", dy = 0, pill = false }) {
    ctx.save();
    const font = small ? (compact ? 10 : 13) : (compact ? 12 : 16);
    ctx.font = `${small ? 580 : 710} ${font}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = align;
    const textWidth = ctx.measureText(words).width;
    const x = Math.max(6 + (align === "center" ? textWidth / 2 : 0),
      Math.min(width - 6 - (align === "center" ? textWidth / 2 : textWidth), p.x));
    const y = Math.max(46, Math.min(height - 31, p.y + dy));
    if (pill) {
      const left = x - (align === "center" ? textWidth / 2 : 0) - 5;
      ctx.fillStyle = "#10172ce8";
      ctx.beginPath();
      ctx.roundRect(left, y - font * .76, textWidth + 10, font * 1.52, 5);
      ctx.fill();
    } else {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#0b1123";
      ctx.strokeText(words, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(words, x, y);
    ctx.restore();
  }

  function particlePath(points, t, color, radius = .12) {
    ball(pathAt(points, t), radius, color, true);
    if (t > .09) ball(pathAt(points, t - .08), radius * .6, color, false, .55);
  }

  function molecule(center, atoms, angle, size, color, bond) {
    const coords = atoms.map(([x, y, z]) => [
      center[0] + size * (x * Math.cos(angle) - z * Math.sin(angle)),
      center[1] + size * y,
      center[2] + size * (x * Math.sin(angle) + z * Math.cos(angle))
    ]);
    const edges = coords.slice(1).map((point, i) => [coords[i], point]);
    edges.forEach(([a, b]) => {
      line(a, b, bond, .135 * size);
      line(a, b, tint(bond, .27), .036 * size);
    });
    coords.forEach(point => ball(point, .28 * size, color));
    return coords;
  }

  const glucose = {
    atoms: [[1.01, .48, .13], [1.03, -.62, -.13], [0, -1.12, .22], [-1, -.58, -.2], [-.95, .51, .16], [-1.83, .98, -.06], [0, 1.06, -.17]],
    bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 0]]
  };
  const fructose = {
    atoms: [[1.88, .80, -.02], [1.01, .40, .12], [.65, -.82, -.14], [-.63, -.84, .16], [-1.03, .38, -.14], [-1.91, .77, .03], [0, 1.05, .14]],
    bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 1]]
  };
  const trio = [[-.52, -.25, .12], [0, .23, -.18], [.53, -.17, .16]];
  const duo = [[-.3, .15, .07], [.3, -.12, -.07]];

  function sugar(t, angle) {
    const converted = t >= .67;
    const model = converted ? fructose : glucose;
    const turn = ([x, y, z]) => [
      1.19 * (x * Math.cos(angle) - z * Math.sin(angle)),
      .12 + 1.19 * y,
      .14 + 1.19 * (x * Math.sin(angle) + z * Math.cos(angle))
    ];
    const atoms = model.atoms.map(turn);
    model.bonds.forEach(([a, b]) => {
      line(atoms[a], atoms[b], "#8270c8", .16);
      line(atoms[a], atoms[b], "#b5a2e3", .041);
    });
    atoms.forEach((point, i) => ball(point, i === 6 ? .29 : .33, i === 6 ? colors.oxygen : colors.carbon));
    [-1, 1].forEach((side, i) => {
      const start = [side * 3.48, .17, -.14];
      const site = turn(fructose.atoms[i ? 0 : 5]);
      const oxygen = [site[0] + side * .36, site[1] + .27, site[2] + .10];
      const end = [oxygen[0] + side * .30, oxygen[1] + .17, oxygen[2]];
      const route = [start, [side * 3.21, .69, .08], end];
      trail(route, "#b58760", .55);
      ball(start, .17, colors.phosphate, false, .60);
      ball(pathAt(route, smooth(t)), .23, colors.phosphate, true);
      if (t > .90) {
        line(site, oxygen, colors.oxygen, .077);
        ball(oxygen, .13, colors.oxygen);
        line(oxygen, pathAt(route, smooth(t)), colors.phosphate, .076);
      }
      text([start[0], -.36, 0], t < .7 ? "ATP" : "ADP", colors.phosphate, { small: true });
    });
    text([0, -1.82, .44], converted ? "Fruttosio-1,6-bisfosfato · 6 C" : "Glucosio · 6 C", "#e3d9ff", { pill: true });
  }

  function glycolysis(step, t) {
    const angle = .24 + t * .45;
    if (step === 0) {
      sugar(t, angle);
      return;
    }
    if (step === 1) {
      const separation = mix(.66, 1.83, smooth(t));
      [-1, 1].forEach((side, i) => {
        const center = [side * separation, .2 + side * .31, side * .15];
        const atoms = molecule(center, trio, side * angle, 1.05, colors.carbon, "#8270c8");
        const terminal = atoms[i ? 2 : 0];
        const p = [terminal[0] + side * .38, terminal[1] - .34, terminal[2] + .05];
        line(terminal, p, colors.phosphate, .08);
        ball(p, .2, colors.phosphate);
        if (t > .45) text([center[0], center[1] - .79, .35], "Trioso fosfato · 3 C", "#e4d9ff", { small: true, pill: true });
      });
      return;
    }
    if (step === 2) {
      [-1, 1].forEach(side => {
        const x = side * 1.62;
        molecule([x, .47, 0], trio, side * angle, 1.1, colors.carbon, "#8270c8");
        const nadh = [[x, .16, .2], [x + side * .34, -.27, .54], [x + side * .5, -.75, .35]];
        const atp = [[x, .19, .04], [x - side * .52, -.39, -.2], [x - side * .78, -.77, .32]];
        trail(nadh, colors.nadh, .44);
        trail(atp, colors.phosphate, .44);
        particlePath(nadh, t, colors.nadh, .17);
        particlePath(atp, t, colors.phosphate, .17);
        text([x + side * .55, -1.18, .36], "NADH", colors.nadh, { small: true, pill: true });
        text([x - side * .85, -1.18, .36], "2 ATP", colors.phosphate, { small: true, pill: true });
      });
      return;
    }
    [-1, 1].forEach(side => {
      const x = side * 1.62;
      molecule([x, .45, .14], trio, side * angle, 1.3, colors.product, "#4bb5a6");
      text([x, -.31, .18], "Piruvato · 3 C", colors.product, { pill: true });
    });
    const end = [[-1.45, -1.14, .3], [1.45, -1.14, .3]];
    ball(end[0], .17, colors.phosphate, true);
    ball(end[1], .17, colors.nadh, true);
    text([-1.45, -1.56, .3], "2 ATP netti", colors.phosphate, { small: true });
    text([1.45, -1.56, .3], "2 NADH", colors.nadh, { small: true });
  }

  const cycleNames = ["Ossalacetato", "Citrato", "Isocitrato", "α-chetoglutarato", "Succinil-CoA", "Succinato", "Fumarato", "Malato"];
  const cyclePoints = cycleNames.map((_, i) => orbit(Math.PI * (.65 - i / 4), 2.44, 1.39, Math.sin(i * .8) * .19));

  function krebs(step, t) {
    const arcs = cyclePoints.map((point, i) => {
      const next = cyclePoints[(i + 1) % cyclePoints.length];
      const angle = Math.PI * (.65 - (i + .5) / 4);
      return [point, orbit(angle, 2.44, 1.39, mix(point[2], next[2], .5)), next];
    });
    arcs.forEach((arc, i) => {
      const selected = (step === 1 && i === 0) || (step === 2 && i >= 1 && i < 5) || (step === 3 && i >= 5);
      const color = selected ? "#65dfc5" : "#3f7e87";
      trail(arc, color, selected ? .82 : .52);
      const node = arc[0];
      ball(node, selected ? .17 : .125, selected ? colors.product : "#5da5ac", selected);
      const middle = arc[1];
      const arrow = [middle[0] * .955, middle[1] * .93, middle[2]];
      line(between(middle, arc[2], .20), arrow, color, .035, .88);
      line(between(middle, arc[2], .20), [middle[0] * 1.055, middle[1] * 1.07, middle[2]], color, .035, .88);
      text([node[0] * 1.21, node[1] * 1.26, node[2]], cycleNames[i], selected ? "#d5fff3" : "#a8c4d1", { small: true });
    });
    if (step < 2) {
      const from = [-1.07, .15, .63], center = [0, .04, .75];
      const move = smooth(t);
      if (step === 0) {
        molecule(from, trio, t, .67, colors.carbon, "#8270c8");
        particlePath([from, [-.42, .2, .86], center], t, colors.product);
        molecule(center, duo, t, .7, colors.product, "#4bb5a6");
        text([from[0] - .13, -.37, .55], "Piruvato", "#d5cbff", { small: true, pill: true });
        text([.23, -.37, .55], "Acetil-CoA", colors.product, { small: true, pill: true });
        ball(pathAt([from, [-.54, .45, 1.05], [.43, .78, .65]], move), .15, colors.co2, true);
        text([.62, .78, .64], "CO₂", colors.co2, { small: true });
        ball(pathAt([from, [.21, .47, .63], [1.23, .44, .5]], move), .14, colors.nadh, true);
        text([1.32, .75, .54], "NADH", colors.nadh, { small: true });
      } else {
        const route = [center, [-.49, .52, .83], cyclePoints[0]];
        trail(route, "#61d9ba", .68);
        molecule(pathAt(route, move), duo, t, .75, colors.product, "#4bb5a6");
        particlePath(arcs[0], move, colors.product);
        text([.05, -.38, .4], "Acetile · 2 C", colors.product, { small: true, pill: true });
      }
      return;
    }
    const start = step === 2 ? 1 : 5, length = step === 2 ? 4 : 3;
    const path = arcs.slice(start, start + length).flatMap(arc => arc.slice(0, 2));
    path.push(cyclePoints[(start + length) % cyclePoints.length]);
    particlePath(path, t, colors.product, .21);
    const outputs = step === 2
      ? [[2, -.77, .46, colors.co2, "CO₂ + NADH", .14], [3, .65, .26, colors.co2, "CO₂ + NADH", .39], [4, .40, -.52, colors.phosphate, "GTP o ATP", .69]]
      : [[5, .64, .12, colors.fadh, "FADH₂", .15], [7, -.68, -.21, colors.nadh, "NADH", .7]];
    outputs.forEach(([i, x, y, color, label, onset]) => {
      if (t < onset) return;
      const route = [cyclePoints[i], [x * 1.3, y * 1.12, .53], [x, y, .88]];
      particlePath(route, Math.min(1, (t - onset) * 5), color, .15);
      text([x, y - .31, .88], label, color, { small: true, pill: true });
    });
  }

  const complexX = [-3.03, -1.77, -.46, 1.49, 3.35];
  const complexColors = ["#7866e5", "#608bd2", "#6479e6", "#a678df", "#ecad57"];
  const q = [-1.25, .14, .91], cytochrome = [.59, .72, .76];
  const chain = [q, [-.44, .18, .65], cytochrome, [1.49, .18, .61]];
  const entryPaths = [
    [[-3.34, -1.45, .52], [-3.03, -.53, .53], [-3.03, .11, .62], q],
    [[-1.94, -1.42, .56], [-1.77, -.47, .57], q]
  ];

  function membrane() {
    for (let row = 0; row < 5; row += 1) {
      const z = -.94 + row * .46;
      for (let i = 0; i < 24; i += 1) {
        const x = -4.13 + i * .357 + (row % 2) * .1;
        const wave = .048 * Math.sin(x * 1.5 + row * .36);
        const top = [x, .29 + wave, z], bottom = [x, -.28 + wave, z];
        line(top, [x + .045, .02 + wave, z - .055], "#56678d", .035, .65);
        line(bottom, [x - .037, -.035 + wave, z + .07], "#56678d", .035, .65);
        ball(top, .092, row % 2 ? "#546e9e" : "#6a81b1", false, .78);
        ball(bottom, .086, "#465c87", false, .75);
      }
    }
  }

  function complex(x, type, active, spin) {
    const color = complexColors[type];
    const center = type === 4 ? -.16 : .03;
    const lobes = type === 4
      ? [[0, .21, .06, .41], [0, -.12, .11, .29], [0, -.50, .08, .16], [0, -.84, .09, .47]]
      : [[0, .29, .02, .40], [-.15, -.04, -.11, .34], [.16, -.24, .08, .34], [0, -.5, .1, type === 1 ? .26 : .38]];
    lobes.forEach(([dx, dy, z, r]) => {
      const lobe = [x + dx, center + dy, z];
      ball(lobe, r, color);
      if (type !== 4 || dy === -.84) {
        for (let i = 0; i < 4; i += 1) {
          const angle = i * tau / 4 + dy + spin;
          const satellite = [lobe[0] + Math.cos(angle) * r * .63, lobe[1] + r * .21, lobe[2] + Math.sin(angle) * r * .78];
          ball(satellite, r * .44, tint(color, i % 2 ? .16 : -.15), active && i === 0);
        }
      }
    });
  }

  function oxidative(step, t) {
    membrane();
    complexX.forEach((x, i) => {
      const active = [[0, 1], [0, 2, 3], [3], [4]][step].includes(i);
      complex(x, i, active, i === 4 && step === 3 ? tau * t * 3 : 0);
    });
    text([-.11, 2.05, .18], "Spazio intermembrana", "#c3cce3", { small: true, dy: compact ? 8 : 3 });
    text([0, -2.04, .15], "Matrice mitocondriale", "#c3cce3", { small: true });
    complexX.slice(0, 4).forEach((x, i) => text([x, .87, .82], ["I", "II", "III", "IV"][i], "#eef0ff", { small: true, pill: true }));
    text([3.35, .92, .63], "ATP sintasi", colors.phosphate, { small: true, pill: true });
    text([q[0], -.57, .93], "Q", colors.electron, { small: true, pill: true });
    text([cytochrome[0], .99, .81], "Cit. c", colors.electron, { small: true, pill: true });
    ball(q, .13, "#4bafc9");
    ball(cytochrome, .11, "#4bafc9");
    entryPaths.forEach(path => trail(path, colors.electron, step === 0 ? .6 : .23));
    trail(chain, colors.electron, step === 1 ? .85 : .28);
    if (step === 0) {
      particlePath(entryPaths[0], t, colors.electron, .15);
      particlePath(entryPaths[1], Math.max(0, (t - .18) / .82), colors.electron, .15);
      text([-3.34, -1.64, .49], "NADH", colors.electron, { small: true, pill: true });
      text([-1.83, -1.64, .51], "FADH₂", colors.electron, { small: true, pill: true });
    }
    if (step === 1) {
      particlePath(chain, t, colors.electron, .15);
      [0, 2, 3].forEach((i, order) => {
        const x = complexX[i];
        const track = [[x - .18, -.96, .65], [x + .16, .18, .74], [x + .13, 1.51, .47]];
        trail(track, colors.proton, .48);
        particlePath(track, (t * 1.65 + order * .25) % 1, colors.proton, .12);
      });
    }
    if (step >= 1) {
      const count = step === 1 ? 2 + Math.floor(t * 11) : step === 3 ? 12 - Math.floor(t * 6) : 12;
      for (let i = 0; i < count; i += 1) {
        ball([-3.33 + i * .54, 1.35 + (i % 3) * .15, -.19 + (i % 4) * .18], .067, colors.proton, true, .78);
      }
    }
    if (step === 2) {
      const oxygen = [[.71, -1.35, .78], [1.12, -.97, .75], [1.49, -.62, .72]];
      const water = [[1.49, -.62, .72], [1.84, -.88, .85], [2.22, -1.35, .77]];
      trail(oxygen, "#a6d8fb", .58);
      trail(water, "#a6d8fb", .58);
      particlePath(chain, Math.min(1, t * 1.8), colors.electron, .14);
      particlePath(t < .55 ? oxygen : water, t < .55 ? t / .55 : (t - .55) / .45, t < .55 ? "#c1e6ff" : "#8cffe2", .17);
      text([.7, -1.6, .77], "O₂", "#c1e6ff", { small: true, pill: true });
      text([2.24, -1.59, .77], "H₂O", "#8cffe2", { small: true, pill: true });
    }
    if (step === 3) {
      const returnPath = [[3.30, 1.65, .54], [3.42, .48, .65], [3.45, -.38, .73], [3.27, -1.26, .65]];
      trail(returnPath, colors.proton, .7);
      particlePath(returnPath, t, colors.proton, .14);
      if (t > .30) particlePath(returnPath, t - .30, colors.proton, .11);
      const atp = [[3.26, -1.02, .66], [2.95, -1.30, .87], [2.35, -1.37, .93]];
      trail(atp, colors.phosphate, .58);
      if (t > .45) particlePath(atp, (t - .45) / .55, colors.phosphate, .17);
      text([2.42, -1.61, .86], t > .46 ? "ATP" : "ADP + Pᵢ", colors.phosphate, { small: true, pill: true });
    }
  }

  return function draw(phase, step, t, view) {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    const dpi = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(width * dpi), h = Math.round(height * dpi);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
    ctx.clearRect(0, 0, width, height);
    compact = width < 550;
    scale = Math.min(width / (phase === "oxidative" ? 10.35 : 8.55), height / 5.2) * view.zoom;
    camera = { cosY: Math.cos(view.yaw), sinY: Math.sin(view.yaw), cosP: Math.cos(view.pitch), sinP: Math.sin(view.pitch) };
    commands = [];
    labels = [];
    if (phase === "glycolysis") glycolysis(step, t);
    if (phase === "krebs") krebs(step, t);
    if (phase === "oxidative") oxidative(step, t);
    commands.sort((a, b) => a.z - b.z).forEach(command => command.paint());
    labels.forEach(paintLabel);
  };
}
