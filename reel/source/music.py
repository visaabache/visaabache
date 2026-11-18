"""Original cinematic sad -> motivational score, 80 BPM, A minor, 38.5 s.
Timeline (bar = 3 s):
  bars 0-1  (0-6)   intro: lonely piano arpeggio + vinyl hiss
  bars 2-5  (6-18)  piano melody + strings + heartbeat kick
  bars 6-7  (18-24) build: strings swell, riser, snare roll, 0.25 s silence
  bars 8-10 (24-33) DROP: boom, drums, full strings, sub bass, octave melody
  bars 11-12(33-38.5) outro: piano + pad, final Am rings out
"""
import numpy as np
from scipy import signal
import wave, sys

SR = 44100
BPM = 80
BEAT = 60 / BPM
BAR = 4 * BEAT
TOTAL = 39.5
N = int(TOTAL * SR)
rng = np.random.default_rng(7)

L = np.zeros(N); R = np.zeros(N)
busses = {k: [np.zeros(N), np.zeros(N)] for k in ["piano", "strings", "drums", "fx", "bass"]}

def midi(n):
    names = {'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11}
    note, octv = n[:-1], int(n[-1])
    m = 12 * (octv + 1) + names[note]
    return 440.0 * 2 ** ((m - 69) / 12)

def add(bus, start, sig, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= N: return
    if sig.ndim == 1:
        l = sig * np.cos((pan + 1) * np.pi / 4) * gain
        r = sig * np.sin((pan + 1) * np.pi / 4) * gain
    else:
        l, r = sig[0] * gain, sig[1] * gain
    j = min(N, i + len(l))
    busses[bus][0][i:j] += l[: j - i]
    busses[bus][1][i:j] += r[: j - i]

def lp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band'); return signal.lfilter(b, a, x)

# ---------------- instruments ----------------
def piano(f, dur, vel=0.6):
    tail = 2.5
    n = int((dur + tail) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    B = 0.00025
    bright = 0.6 + 0.6 * vel
    for k in range(1, 13):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 12000: break
        amp = (1 / k ** 1.35) * (bright ** (k - 1))
        d = (0.55 + 0.32 * k) * (f / 220) ** 0.35
        env = 0.55 * np.exp(-3.2 * d * t) + 0.45 * np.exp(-0.55 * d * t)
        out += amp * env * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28))
    # damper release
    rel = np.ones(n)
    ri = int(dur * SR)
    rel[ri:] = np.exp(-np.arange(n - ri) / SR * 5.0)
    out *= rel
    # attack + hammer
    att = np.minimum(1, t / 0.004)
    out *= att
    ham = lp(rng.standard_normal(int(0.012 * SR)), 3000) * np.exp(-np.arange(int(0.012 * SR)) / SR * 300)
    out[: len(ham)] += 0.15 * ham
    return out * vel

def saw(f, n, detune_c, vib_rate=5.0, vib_depth=0.0018):
    t = np.arange(n) / SR
    ff = f * 2 ** (detune_c / 1200) * (1 + vib_depth * np.sin(2 * np.pi * vib_rate * t + rng.uniform(0, 6)))
    ph = np.cumsum(ff) / SR + rng.uniform(0, 1)
    return 2 * (ph % 1.0) - 1

def strings(freqs, dur, att=1.2, rel=1.8):
    n = int((dur + rel) * SR)
    t = np.arange(n) / SR
    l = np.zeros(n); r = np.zeros(n)
    for f in freqs:
        for v, dc in enumerate([-9, -4, 0, 4, 9, -12]):
            s = saw(f, n, dc + rng.uniform(-1.5, 1.5))
            p = (v / 5) * 2 - 1
            l += s * np.cos((p * 0.7 + 1) * np.pi / 4)
            r += s * np.sin((p * 0.7 + 1) * np.pi / 4)
    env = np.minimum(1, t / att)
    ri = int(dur * SR)
    env[ri:] *= np.exp(-(np.arange(n - ri) / SR) * (4.5 / rel))
    l = lp(l, 2400, 4) * env; r = lp(r, 2400, 4) * env
    return np.vstack([l, r]) / (len(freqs) * 6)

def kick(vel=1.0, low=48, high=140, decay=7.0, length=0.6):
    n = int(length * SR); t = np.arange(n) / SR
    f = low + (high - low) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * decay)
    click = lp(rng.standard_normal(n), 4000) * np.exp(-t * 400) * 0.25
    return np.tanh(1.6 * (s + click)) * vel

def snare(vel=1.0):
    n = int(0.45 * SR); t = np.arange(n) / SR
    nz = bp(rng.standard_normal(n), 900, 7500) * np.exp(-t * 16)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.6
    return (nz * 0.9 + body) * vel

def clap(vel=1.0):
    n = int(0.5 * SR); t = np.arange(n) / SR
    nz = bp(rng.standard_normal(n), 1000, 5000)
    env = np.zeros(n)
    for o in [0, 0.011, 0.022, 0.034]:
        i = int(o * SR); env[i:] += np.exp(-(t[: n - i]) * (70 if o < 0.03 else 14))
    return nz * env * 0.6 * vel

def hat(vel=0.3):
    n = int(0.09 * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t * 60) * vel

def boom(vel=1.0):
    n = int(4.0 * SR); t = np.arange(n) / SR
    f = 34 + 70 * np.exp(-t * 9)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.1)
    nz = lp(rng.standard_normal(n), 900) * np.exp(-t * 3.5) * 0.5
    crack = hp(rng.standard_normal(n), 2500) * np.exp(-t * 25) * 0.35
    return np.tanh(1.3 * (s + nz + crack)) * vel

def riser(dur):
    n = int(dur * SR); t = np.arange(n) / SR; x = t / dur
    nz = rng.standard_normal(n)
    out = np.zeros(n)
    bands = [(200, 800), (800, 2500), (2500, 6000), (6000, 14000)]
    for i, (lo, hi) in enumerate(bands):
        g = np.clip(x * 1.3 - i * 0.22, 0, 1) ** 2
        out += bp(nz, lo, hi) * g
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * x)) / SR) * x ** 3 * 0.15
    return (out * x ** 1.5 + tone) * 0.55

def rev_swell(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = hp(rng.standard_normal(n), 3000) * np.exp(-t * 3.0)
    return s[::-1] * 0.5

def whoosh(dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR; x = t / dur
    s = bp(rng.standard_normal(n), 400, 3500) * np.sin(np.pi * x) ** 2
    return s * 0.35

def heartbeat(vel=0.7):
    a = kick(vel, low=42, high=90, decay=9, length=0.5)
    b = kick(vel * 0.7, low=40, high=80, decay=10, length=0.5)
    out = np.zeros(int(0.8 * SR)); out[: len(a)] += a
    o = int(0.24 * SR); out[o:o + len(b)] += b
    return out

# ---------------- harmony ----------------
CH = {
    'Am': ['A2', 'E3', 'A3', 'C4', 'E4'],
    'F':  ['F2', 'C3', 'F3', 'A3', 'C4'],
    'C':  ['C2', 'G2', 'C3', 'E3', 'G3'],
    'G':  ['G2', 'D3', 'G3', 'B3', 'D4'],
}
ARP = {
    'Am': ['A3', 'C4', 'E4', 'A4', 'B4', 'A4', 'E4', 'C4'],
    'F':  ['F3', 'A3', 'C4', 'F4', 'G4', 'F4', 'C4', 'A3'],
    'C':  ['C4', 'E4', 'G4', 'C5', 'D5', 'C5', 'G4', 'E4'],
    'G':  ['G3', 'B3', 'D4', 'G4', 'A4', 'G4', 'D4', 'B3'],
}
PAD = {
    'Am': ['A3', 'C4', 'E4', 'A4'], 'F': ['F3', 'A3', 'C4', 'F4'],
    'C': ['G3', 'C4', 'E4', 'G4'], 'G': ['G3', 'B3', 'D4', 'G4'],
}
MEL = {
    'Am': [(0, 'E5', 2), (2, 'D5', 1), (3, 'C5', 1)],
    'F':  [(0, 'C5', 2), (2, 'A4', 1), (3, 'C5', 1)],
    'C':  [(0, 'G4', 1.5), (1.5, 'E5', 1.5), (3, 'D5', 1)],
    'G':  [(0, 'D5', 3), (3, 'B4', 1)],
}
def up(n): return n[:-1] + str(int(n[-1]) + 1)
def dn(n): return n[:-1] + str(int(n[-1]) - 1)

prog = ['Am', 'F', 'Am', 'F', 'C', 'G', 'F', 'G', 'Am', 'F', 'C', 'G', 'Am']

for b, ch in enumerate(prog):
    t0 = b * BAR
    # --- piano: left hand chord (bass + fifth) ---
    if b == 12:  # final chord, long ring
        for k, nn in enumerate(CH['Am']):
            add('piano', t0 + k * 0.03, piano(midi(nn), 3.0, 0.55), pan=-0.3 + 0.15 * k)
        add('piano', t0 + 0.2, piano(midi('E5'), 3.0, 0.5), pan=0.2)
        add('piano', t0 + 0.2, piano(midi('A5'), 3.0, 0.3), pan=0.3)
        continue
    lh_vel = 0.38 if b < 2 else 0.45
    add('piano', t0, piano(midi(CH[ch][0]), BAR, lh_vel), pan=-0.25)
    add('piano', t0 + 0.02, piano(midi(CH[ch][1]), BAR, lh_vel * 0.7), pan=-0.2)
    # --- arpeggio eighths ---
    arp_vel = {0: .30, 1: .30}.get(b, .20 if b < 6 else (.24 if b < 8 else (.26 if b < 11 else .22)))
    if b == 7: arp_vel = 0.22
    for i, nn in enumerate(ARP[ch]):
        tt = t0 + i * BEAT / 2
        if b == 7 and tt >= 23.70: break
        human = rng.uniform(-0.008, 0.008)
        v = arp_vel * (1.0 if i % 2 == 0 else 0.8)
        add('piano', tt + human, piano(midi(nn), BEAT / 2 * 1.6, v), pan=0.15 + 0.03 * (i % 4))
    # --- melody bars 2-5, 8-11 ---
    if 2 <= b <= 5 or 8 <= b <= 11:
        for beat, nn, d in MEL[ch]:
            v = 0.55 if b < 8 else 0.62
            add('piano', t0 + beat * BEAT + 0.01, piano(midi(nn), d * BEAT, v), pan=0.05)
            if b >= 8:  # octave doubling in drop
                add('piano', t0 + beat * BEAT + 0.012, piano(midi(up(nn)), d * BEAT, v * 0.45), pan=0.25)
                add('piano', t0 + beat * BEAT + 0.012, piano(midi(dn(nn)), d * BEAT, v * 0.5), pan=-0.1)
    # --- strings ---
    if 2 <= b <= 11:
        g = {2: .35, 3: .4, 4: .45, 5: .5, 6: .6, 7: .75, 8: 1.0, 9: 1.0, 10: 1.0, 11: .7}[b]
        dur = BAR if b != 7 else BAR - 0.3
        sv = strings([midi(n) for n in PAD[ch]], dur, att=0.9 if b < 8 else 0.15, rel=1.5)
        if b == 7:
            sv *= np.linspace(0.8, 1.4, sv.shape[1])
        add('strings', t0, sv, gain=g)
        if b >= 8:  # high octave shimmer
            sv2 = strings([midi(up(n)) for n in PAD[ch][1:]], BAR, att=0.3, rel=1.5)
            add('strings', t0, sv2, gain=0.35)
    # --- sub bass ---
    if 6 <= b <= 10:
        n = int(BAR * SR); t = np.arange(n) / SR
        f = midi(dn(CH[ch][0])) if CH[ch][0][-1] != '1' else midi(CH[ch][0])
        f = midi(CH[ch][0][:-1] + '1')
        env = np.minimum(1, t / 0.02) * np.minimum(1, (BAR - t) / 0.08)
        if b == 7: env *= (t < BAR - 0.3)
        s = np.tanh(1.5 * np.sin(2 * np.pi * f * t)) * env
        add('bass', t0, s, gain=0.30 if b >= 8 else 0.15)
    # --- drums ---
    if 2 <= b <= 5:  # heartbeat
        add('drums', t0, heartbeat(0.55))
        add('drums', t0 + 2 * BEAT, heartbeat(0.42))
    if b == 6:
        add('drums', t0, heartbeat(0.6)); add('drums', t0 + 2 * BEAT, heartbeat(0.6))
    if b == 7:  # snare build
        times = [t0 + i * BEAT / 2 for i in range(4)] + [t0 + 2 * BEAT + i * BEAT / 4 for i in range(7)]
        for i, tt in enumerate(times):
            add('drums', tt, snare(0.18 + 0.05 * i), pan=0.1)
        add('drums', t0, kick(0.7)); add('drums', t0 + BEAT, kick(0.7))
    if 8 <= b <= 10:
        for kb in [0, 1.5, 2, 3.5] if b != 10 else [0, 1.5, 2, 2.75, 3.5]:
            add('drums', t0 + kb * BEAT, kick(0.95 if kb in (0, 2) else 0.6))
        for sb in [1, 3]:
            add('drums', t0 + sb * BEAT, clap(0.85), pan=0.05)
            add('drums', t0 + sb * BEAT, snare(0.35))
        for i in range(8):
            add('drums', t0 + i * BEAT / 2 + 0.01, hat(0.18 if i % 2 else 0.28), pan=0.35)

# ---------------- FX ----------------
add('fx', 24.0, boom(1.0))
add('fx', 18.0, riser(5.75), gain=0.8)
add('fx', 24.0 - 2.2, rev_swell(2.2), pan=0, gain=0.9)
for wt in [3.0, 10.5, 16.5, 33.0]:
    add('fx', wt - 0.45, whoosh(0.5), gain=0.9)
add('fx', 3.0, boom(0.35))       # soft hit on the first cut
add('fx', 33.0, boom(0.45))      # hit into the end card
# vinyl hiss / crackle bed
hiss = lp(hp(rng.standard_normal(N), 1500), 6000) * 0.012
crack = np.zeros(N)
idx = rng.choice(N, size=int(TOTAL * 9), replace=False)
crack[idx] = rng.uniform(-1, 1, len(idx)) * 0.12
crack = hp(crack, 2000)
bed = (hiss + crack)
add('fx', 0, bed, gain=1.0)

# ---------------- reverb & mix ----------------
def ir(seconds, decay, seed, lpf=6000):
    r = np.random.default_rng(seed)
    n = int(seconds * SR); t = np.arange(n) / SR
    x = r.standard_normal(n) * np.exp(-t * decay)
    x = lp(x, lpf)
    x[: int(0.015 * SR)] *= np.linspace(0, 1, int(0.015 * SR))
    return x / np.sqrt(np.sum(x ** 2))

def reverb(bus, wet, seconds=3.0, decay=2.2, lpf=6000):
    l, r = busses[bus]
    rl = signal.fftconvolve(l, ir(seconds, decay, 1, lpf))[:N]
    rr = signal.fftconvolve(r, ir(seconds, decay, 2, lpf))[:N]
    return l + wet * rl, r + wet * rr

mix_l = np.zeros(N); mix_r = np.zeros(N)
for bus, (wet, g, sec, dec) in {
    'piano': (0.55, 1.0, 3.5, 1.6),
    'strings': (0.6, 0.55, 3.5, 1.6),
    'drums': (0.35, 0.85, 2.2, 3.0),
    'fx': (0.45, 0.9, 3.0, 2.0),
    'bass': (0.0, 1.0, 1.0, 5.0),
}.items():
    l, r = reverb(bus, wet, sec, dec) if wet else busses[bus]
    mix_l += g * l; mix_r += g * r

# sidechain-ish duck of strings/piano on drop kicks is skipped; gentle glue:
mix = np.vstack([mix_l, mix_r])
mix = hp(mix, 30)
# dynamics automation: quiet & lonely -> swelling -> full drop
tt = np.arange(N) / SR
auto = np.interp(tt, [0, 5.9, 6.1, 17.9, 18.0, 23.75, 23.76, 24.0, 33.0, 39.5],
                     [0.5, 0.5, 0.68, 0.72, 0.72, 1.0, 0.9, 1.0, 1.0, 0.85])
mix *= auto
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(1.4 * mix) / np.tanh(1.4)
# fade in/out
fi = int(0.05 * SR); mix[:, :fi] *= np.linspace(0, 1, fi)
end = int(38.5 * SR); fo = int(2.5 * SR)
mix[:, end - fo:end] *= np.linspace(1, 0, fo) ** 1.5
mix[:, end:] = 0
mix = mix[:, :end]
pcm = (mix.T * 0.89 * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("ok", mix.shape[1] / SR)
