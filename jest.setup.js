// Mock HTMLCanvasElement.getContext to return a mock context
function createMockContext() {
  const ctx = {
    canvas: { width: 800, height: 600 },
    _fillStyle: '#000',
    _strokeStyle: '#000',
    _globalAlpha: 1,
    _lineWidth: 1,
    _lineCap: 'butt',
    _lineJoin: 'miter',
    _font: '10px sans-serif',
    _textAlign: 'start',
    _textBaseline: 'alphabetic',
    _transform: [1, 0, 0, 1, 0, 0],
    _setLineDash: [],
    _path: [],
    _currentPath: [],

    get fillStyle() { return this._fillStyle; },
    set fillStyle(v) { this._fillStyle = v; },
    get strokeStyle() { return this._strokeStyle; },
    set strokeStyle(v) { this._strokeStyle = v; },
    get globalAlpha() { return this._globalAlpha; },
    set globalAlpha(v) { this._globalAlpha = v; },
    get lineWidth() { return this._lineWidth; },
    set lineWidth(v) { this._lineWidth = v; },
    get lineCap() { return this._lineCap; },
    set lineCap(v) { this._lineCap = v; },
    get lineJoin() { return this._lineJoin; },
    set lineJoin(v) { this._lineJoin = v; },
    get font() { return this._font; },
    set font(v) { this._font = v; },
    get textAlign() { return this._textAlign; },
    set textAlign(v) { this._textAlign = v; },
    get textBaseline() { return this._textBaseline; },
    set textBaseline(v) { this._textBaseline = v; },

    clearRect: jest.fn(),
    beginPath: jest.fn(() => { ctx._currentPath = []; }),
    closePath: jest.fn(),
    moveTo: jest.fn((x, y) => { ctx._currentPath.push(['M', x, y]); }),
    lineTo: jest.fn((x, y) => { ctx._currentPath.push(['L', x, y]); }),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    setTransform: jest.fn(),
    transform: jest.fn(),
    measureText: jest.fn(() => ({ width: 50 })),
    setLineDash: jest.fn((d) => { ctx._setLineDash = d; }),
    getLineDash: jest.fn(() => ctx._setLineDash),

    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
  };
  return ctx;
}

HTMLCanvasElement.prototype.getContext = function () {
  if (!this._mockCtx) {
    this._mockCtx = createMockContext();
  }
  return this._mockCtx;
};

Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  get() { return this._mockCtx ? this._mockCtx.canvas.width : 800; },
  set(v) { if (this._mockCtx) this._mockCtx.canvas.width = v; },
});

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  get() { return this._mockCtx ? this._mockCtx.canvas.height : 600; },
  set(v) { if (this._mockCtx) this._mockCtx.canvas.height = v; },
});

// Mock navigator.vibrate
navigator.vibrate = jest.fn();

// Mock localStorage
const store = {};
Storage.prototype.getItem = jest.fn((key) => store[key] ?? null);
Storage.prototype.setItem = jest.fn((key, value) => { store[key] = String(value); });
Storage.prototype.removeItem = jest.fn((key) => { delete store[key]; });
Storage.prototype.clear = jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); });

// Mock AudioContext
class MockAudioContext {
  constructor() { this.state = 'running'; }
  resume() { this.state = 'running'; }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
      connect: jest.fn(),
    };
  }
  get destination() { return {}; }
  get currentTime() { return 0; }
}
window.AudioContext = MockAudioContext;
window.webkitAudioContext = MockAudioContext;
