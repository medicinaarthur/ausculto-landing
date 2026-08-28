// Gerador de QR Code (modo byte, correcao M, versoes 1–10).
//
// Escrito a mao em vez de puxar uma biblioteca por CDN: o portal deve
// funcionar sem depender de terceiros no caminho critico, e o QR e usado
// offline pelo embaixador (ele fotografa a tela numa palestra, imprime num
// cartaz). Sao ~200 linhas contra um script externo e mais um ponto de falha.
//
// A implementacao segue a ISO/IEC 18004 e foi validada modulo a modulo
// contra a biblioteca de referencia "qrcode" (ver scripts/verify_qr.mjs).

// ── Aritmetica em GF(256) para o Reed-Solomon ────────────────────────────
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // polinomio primitivo x^8+x^4+x^3+x^2+1
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data, ecLength) {
  const generator = rsGeneratorPoly(ecLength);
  const remainder = new Array(ecLength).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let i = 0; i < ecLength; i += 1) {
      remainder[i] ^= gfMul(generator[i + 1], factor);
    }
  }
  return remainder;
}

// ── Tabelas da especificacao (nivel de correcao M) ───────────────────────
// [codewords de EC por bloco, [blocos, codewords de dados por bloco], ...]
const EC_BLOCKS_M = {
  1: [10, [[1, 16]]],
  2: [16, [[1, 28]]],
  3: [26, [[1, 44]]],
  4: [18, [[2, 32]]],
  5: [24, [[2, 43]]],
  6: [16, [[4, 27]]],
  7: [18, [[4, 31]]],
  8: [22, [[2, 38], [2, 39]]],
  9: [22, [[3, 36], [2, 37]]],
  10: [26, [[4, 43], [1, 44]]],
};

const ALIGNMENT_POSITIONS = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

const MAX_VERSION = 10;

function headerBits(version) {
  // 4 bits de modo + contagem de caracteres: 8 bits ate a versao 9,
  // 16 bits a partir da 10. Esquecer esse degrau faz a v10 aceitar um byte
  // a mais do que cabe.
  return 4 + (version <= 9 ? 8 : 16);
}

function dataCapacityBytes(version) {
  const [, groups] = EC_BLOCKS_M[version];
  let total = 0;
  for (const [blocks, dataCodewords] of groups) total += blocks * dataCodewords;
  return Math.floor((total * 8 - headerBits(version)) / 8);
}

function pickVersion(byteLength) {
  for (let version = 1; version <= MAX_VERSION; version += 1) {
    if (byteLength <= dataCapacityBytes(version)) return version;
  }
  return 0;
}

// ── Codificacao dos dados ────────────────────────────────────────────────
function encodeData(bytes, version) {
  const bits = [];
  const push = (value, length) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >> i) & 1);
  };

  push(0b0100, 4); // modo byte
  push(bytes.length, version <= 9 ? 8 : 16);
  for (const byte of bytes) push(byte, 8);

  const [ecPerBlock, groups] = EC_BLOCKS_M[version];
  let totalDataCodewords = 0;
  for (const [blocks, count] of groups) totalDataCodewords += blocks * count;
  const capacityBits = totalDataCodewords * 8;

  // Terminador e alinhamento em byte.
  for (let i = 0; i < 4 && bits.length < capacityBits; i += 1) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j];
    codewords.push(byte);
  }
  // Preenchimento alternado exigido pela norma.
  const PAD = [0xec, 0x11];
  let padIndex = 0;
  while (codewords.length < totalDataCodewords) {
    codewords.push(PAD[padIndex % 2]);
    padIndex += 1;
  }

  // Divisao em blocos + Reed-Solomon por bloco.
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (const [blocks, count] of groups) {
    for (let b = 0; b < blocks; b += 1) {
      const block = codewords.slice(offset, offset + count);
      offset += count;
      dataBlocks.push(block);
      ecBlocks.push(rsEncode(block, ecPerBlock));
    }
  }

  // Intercalacao: dados de todos os blocos, depois EC de todos os blocos.
  const result = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxData; i += 1) {
    for (const block of dataBlocks) {
      if (i < block.length) result.push(block[i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i += 1) {
    for (const block of ecBlocks) result.push(block[i]);
  }
  return result;
}

// ── Montagem da matriz ───────────────────────────────────────────────────
function createMatrix(size) {
  return Array.from({length: size}, () => new Array(size).fill(null));
}

function placeFinder(matrix, row, col) {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || cc < 0 || rr >= matrix.length || cc >= matrix.length) {
        continue;
      }
      const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
        (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      matrix[rr][cc] = inRing || inCore ? 1 : 0;
    }
  }
}

function placeAlignment(matrix, version) {
  const positions = ALIGNMENT_POSITIONS[version];
  for (const row of positions) {
    for (const col of positions) {
      // Os cantos coincidem com os localizadores.
      if (matrix[row][col] !== null) continue;
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          const edge = Math.abs(r) === 2 || Math.abs(c) === 2;
          const center = r === 0 && c === 0;
          matrix[row + r][col + c] = edge || center ? 1 : 0;
        }
      }
    }
  }
}

function placeTiming(matrix) {
  const size = matrix.length;
  for (let i = 8; i < size - 8; i += 1) {
    const bit = i % 2 === 0 ? 1 : 0;
    if (matrix[6][i] === null) matrix[6][i] = bit;
    if (matrix[i][6] === null) matrix[i][6] = bit;
  }
}

function reserveFormatAreas(matrix, version) {
  const size = matrix.length;
  for (let i = 0; i < 9; i += 1) {
    if (matrix[8][i] === null) matrix[8][i] = 0;
    if (matrix[i][8] === null) matrix[i][8] = 0;
  }
  for (let i = 0; i < 8; i += 1) {
    if (matrix[8][size - 1 - i] === null) matrix[8][size - 1 - i] = 0;
    if (matrix[size - 1 - i][8] === null) matrix[size - 1 - i][8] = 0;
  }
  matrix[size - 8][8] = 1; // modulo escuro, sempre 1
  if (version >= 7) {
    for (let i = 0; i < 6; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        matrix[size - 11 + j][i] = 0;
        matrix[i][size - 11 + j] = 0;
      }
    }
  }
}

function placeData(matrix, codewords) {
  const size = matrix.length;
  const bits = [];
  for (const byte of codewords) {
    for (let i = 7; i >= 0; i -= 1) bits.push((byte >> i) & 1);
  }

  let bitIndex = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1; // pula a coluna de temporizacao
    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step;
      for (let c = 0; c < 2; c += 1) {
        const cc = col - c;
        if (matrix[row][cc] !== null) continue;
        matrix[row][cc] = bitIndex < bits.length ? bits[bitIndex] : 0;
        bitIndex += 1;
      }
    }
    upward = !upward;
  }
}

const MASK_FUNCTIONS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function isFunctionModule(version, size, row, col) {
  if (row === 6 || col === 6) return true;
  if (row < 9 && col < 9) return true;
  if (row < 9 && col >= size - 8) return true;
  if (row >= size - 8 && col < 9) return true;
  if (version >= 7) {
    if (row < 6 && col >= size - 11) return true;
    if (col < 6 && row >= size - 11) return true;
  }
  const positions = ALIGNMENT_POSITIONS[version];
  for (const ar of positions) {
    for (const ac of positions) {
      if ((ar === 6 && ac === 6) ||
          (ar === 6 && ac === size - 7) ||
          (ar === size - 7 && ac === 6)) {
        continue;
      }
      if (Math.abs(row - ar) <= 2 && Math.abs(col - ac) <= 2) return true;
    }
  }
  return false;
}

function penalty(matrix) {
  const size = matrix.length;
  let score = 0;

  // Regra 1: sequencias de 5 ou mais modulos iguais.
  for (let i = 0; i < size; i += 1) {
    for (const horizontal of [true, false]) {
      let run = 1;
      for (let j = 1; j < size; j += 1) {
        const prev = horizontal ? matrix[i][j - 1] : matrix[j - 1][i];
        const cur = horizontal ? matrix[i][j] : matrix[j][i];
        if (cur === prev) {
          run += 1;
        } else {
          if (run >= 5) score += 3 + (run - 5);
          run = 1;
        }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
  }

  // Regra 2: blocos 2x2 da mesma cor.
  for (let r = 0; r < size - 1; r += 1) {
    for (let c = 0; c < size - 1; c += 1) {
      const v = matrix[r][c];
      if (v === matrix[r][c + 1] && v === matrix[r + 1][c] &&
          v === matrix[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  // Regra 3: padrao 1:1:3:1:1 com quatro claros de cada lado.
  const PATTERN_A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const PATTERN_B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const matches = (line, start, pattern) => {
    for (let i = 0; i < pattern.length; i += 1) {
      if (line[start + i] !== pattern[i]) return false;
    }
    return true;
  };
  for (let i = 0; i < size; i += 1) {
    const row = matrix[i];
    const col = matrix.map((r) => r[i]);
    for (const line of [row, col]) {
      for (let j = 0; j + 11 <= size; j += 1) {
        if (matches(line, j, PATTERN_A)) score += 40;
        if (matches(line, j, PATTERN_B)) score += 40;
      }
    }
  }

  // Regra 4: desequilibrio entre claros e escuros, em passos de 5%.
  let dark = 0;
  for (const row of matrix) for (const v of row) if (v) dark += 1;
  const percent = (dark * 100) / (size * size);
  score += Math.abs(Math.ceil(percent / 5) - 10) * 10;

  return score;
}

function formatBits(maskIndex) {
  // Nivel M = 00, seguido dos 3 bits da mascara; depois BCH(15,5) com o
  // gerador 0x537 e a mascara fixa 0x5412 exigida pela norma.
  const data = (0b00 << 3) | maskIndex;
  let remainder = data;
  for (let i = 0; i < 10; i += 1) {
    remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  }
  return ((data << 10) | remainder) ^ 0x5412;
}

function versionBits(version) {
  // BCH(18,6) com gerador 0x1f25. Só usado a partir da versao 7.
  let remainder = version;
  for (let i = 0; i < 12; i += 1) {
    remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
  }
  return (version << 12) | remainder;
}

function applyFormatInfo(matrix, maskIndex) {
  const size = matrix.length;
  const bits = formatBits(maskIndex);
  for (let i = 0; i < 15; i += 1) {
    const bit = (bits >> i) & 1;
    // Copia 1, em volta do localizador superior esquerdo. A ordem sobe pela
    // coluna 8 e depois corre pela linha 8 — inverter linha/coluna aqui
    // produz um QR que nenhum leitor abre.
    if (i < 6) {
      matrix[i][8] = bit;
    } else if (i === 6) {
      matrix[7][8] = bit;
    } else if (i === 7) {
      matrix[8][8] = bit;
    } else if (i === 8) {
      matrix[8][7] = bit;
    } else {
      matrix[8][14 - i] = bit;
    }
    // Copia 2: os 8 primeiros bits correm pela LINHA 8 a direita, e os 7
    // ultimos descem pela COLUNA 8 — nao o contrario.
    if (i < 8) {
      matrix[8][size - 1 - i] = bit;
    } else {
      matrix[size - 15 + i][8] = bit;
    }
  }
}

function applyVersionInfo(matrix, version) {
  if (version < 7) return;
  const size = matrix.length;
  const bits = versionBits(version);
  for (let i = 0; i < 18; i += 1) {
    const bit = (bits >> i) & 1;
    const row = Math.floor(i / 3);
    const col = i % 3;
    matrix[size - 11 + col][row] = bit;
    matrix[row][size - 11 + col] = bit;
  }
}

/**
 * Constroi a matriz do QR Code.
 *
 * @param {string} text Conteudo a codificar.
 * @return {Array<Array<number>>|null} Matriz de 0/1, ou null se nao couber.
 */
export function buildQrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(String(text || "")));
  if (!bytes.length) return null;
  const version = pickVersion(bytes.length);
  if (!version) return null;

  const size = version * 4 + 17;
  const codewords = encodeData(bytes, version);

  const base = createMatrix(size);
  placeFinder(base, 0, 0);
  placeFinder(base, 0, size - 7);
  placeFinder(base, size - 7, 0);
  placeAlignment(base, version);
  placeTiming(base);
  reserveFormatAreas(base, version);
  placeData(base, codewords);

  // Escolhe a mascara com menor penalidade, como manda a norma.
  let best = null;
  let bestScore = Infinity;
  for (let maskIndex = 0; maskIndex < 8; maskIndex += 1) {
    const candidate = base.map((row) => row.slice());
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (isFunctionModule(version, size, r, c)) continue;
        if (MASK_FUNCTIONS[maskIndex](r, c)) candidate[r][c] ^= 1;
      }
    }
    applyFormatInfo(candidate, maskIndex);
    applyVersionInfo(candidate, version);
    const score = penalty(candidate);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

/**
 * Desenha o QR num canvas, com margem (quiet zone) de 4 modulos.
 *
 * @param {HTMLCanvasElement} canvas Alvo.
 * @param {string} text Conteudo.
 * @return {boolean} true se desenhou.
 */
export function drawQr(canvas, text) {
  const matrix = buildQrMatrix(text);
  if (!canvas || !matrix) return false;
  const context = canvas.getContext("2d");
  if (!context) return false;

  const quiet = 4;
  const modules = matrix.length + quiet * 2;
  const scale = Math.max(1, Math.floor(canvas.width / modules));
  const drawn = modules * scale;

  canvas.width = drawn;
  canvas.height = drawn;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, drawn, drawn);
  context.fillStyle = "#060f1e";
  for (let r = 0; r < matrix.length; r += 1) {
    for (let c = 0; c < matrix.length; c += 1) {
      if (!matrix[r][c]) continue;
      context.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
    }
  }
  return true;
}
