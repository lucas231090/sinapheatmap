export const CALIBRATION_POINTS = [
  { x: 0.1, y: 0.1 },
  { x: 0.5, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.1, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.9, y: 0.5 },
  { x: 0.1, y: 0.9 },
  { x: 0.5, y: 0.9 },
  { x: 0.9, y: 0.9 },
];

export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

export function solveLinearSystem(A, b) {
  const n = A.length;
  const matrix = A.map((row) => [...row]);
  const vector = [...b];
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(matrix[k][i]) > Math.abs(matrix[maxRow][i])) maxRow = k;
    }
    [matrix[i], matrix[maxRow]] = [matrix[maxRow], matrix[i]];
    [vector[i], vector[maxRow]] = [vector[maxRow], vector[i]];
    const pivot = matrix[i][i];
    if (Math.abs(pivot) < 1e-10) return null;
    for (let j = i; j < n; j++) matrix[i][j] /= pivot;
    vector[i] /= pivot;
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = matrix[k][i];
      for (let j = i; j < n; j++) matrix[k][j] -= factor * matrix[i][j];
      vector[k] -= factor * vector[i];
    }
  }
  return vector;
}

export function ridgeRegression(samples, getTargetLabel) {
  const numFeatures = samples[0].features.length;
  const XtX = Array.from({ length: numFeatures }, () =>
    Array(numFeatures).fill(0),
  );
  const Xty = Array(numFeatures).fill(0);
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i].features;
    const y = getTargetLabel(samples[i]);
    for (let r = 0; r < numFeatures; r++) {
      Xty[r] += x[r] * y;
      for (let c = 0; c < numFeatures; c++) {
        XtX[r][c] += x[r] * x[c];
      }
    }
  }
  const lambda = 0.005;
  for (let i = 1; i < numFeatures; i++) {
    XtX[i][i] += lambda;
  }
  return solveLinearSystem(XtX, Xty);
}

export function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function ransacLinear(samples, getTargetLabel, options = {}) {
  if (!samples || samples.length === 0) return null;
  const iterations = options.iterations || 200;
  const threshold = options.threshold || 0.04;
  const numFeatures = samples[0].features.length;
  let best = { coeffs: null, inliers: [] };
  const n = samples.length;
  let fallback = ridgeRegression(samples, getTargetLabel);
  if (n < numFeatures) return fallback;

  for (let it = 0; it < iterations; it++) {
    const idxs = new Set();
    while (idxs.size < numFeatures) idxs.add(Math.floor(Math.random() * n));
    const subset = Array.from(idxs).map((i) => samples[i]);
    const candidate = ridgeRegression(subset, getTargetLabel);
    if (!candidate) continue;

    const inliers = [];
    for (let i = 0; i < n; i++) {
      const y = getTargetLabel(samples[i]);
      const pred = dot(candidate, samples[i].features);
      const residual = Math.abs(pred - y);
      if (residual <= threshold) inliers.push(samples[i]);
    }
    if (inliers.length > best.inliers.length) {
      const refined = ridgeRegression(inliers, getTargetLabel) || candidate;
      best = { coeffs: refined, inliers };
    }
  }
  return best.coeffs || fallback;
}

export function computeStd(buffer, idx) {
  if (!buffer || buffer.length === 0) return Infinity;
  let mean = 0;
  for (let i = 0; i < buffer.length; i++) mean += buffer[i][idx];
  mean /= buffer.length;
  let s = 0;
  for (let i = 0; i < buffer.length; i++) {
    const d = buffer[i][idx] - mean;
    s += d * d;
  }
  return Math.sqrt(s / buffer.length);
}

export function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
