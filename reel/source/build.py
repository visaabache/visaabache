"""Build the 9:16 reel: segments -> concat -> grade/fx/text -> mux music."""
import subprocess, os, sys

U = "/root/.claude/uploads/5eabab15-7d97-56aa-94f3-0ba5d7294540"
S = "/tmp/claude-0/-home-user-visaabache/5eabab15-7d97-56aa-94f3-0ba5d7294540/scratchpad"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/home/user/visaabache/reel"
SEG = f"{S}/seg"; os.makedirs(SEG, exist_ok=True); os.makedirs(OUT, exist_ok=True)

TIE = f"{U}/fd2c5cf5-IMG_7099.mov"
BELT = f"{U}/e04f19ad-IMG_7099.mov"
JACKET = f"{U}/a1c7b632-IMG_7099.mov"
BUS = f"{U}/5b931f92-IMG_7106.mov"
AIRPORT = f"{U}/aa28c8ee-IMG_7108.mov"
FPS = 30

def run(cmd):
    print(" ".join(cmd)[:300], flush=True)
    subprocess.run(cmd, check=True)

# name, file, src_start, out_dur, speed(<1 = slow), zoom (start,end), crop, gamma
segs = [
    ("A",  AIRPORT, 3.40, 3.0, 0.5, (1.12, 1.00), None, 1.0),
    ("B",  TIE,     0.50, 4.5, 1.0, (1.00, 1.08), None, 1.0),
    ("C",  BELT,    1.50, 3.0, 1.0, (1.06, 1.00), None, 1.0),
    ("D1", JACKET,  2.50, 3.0, 1.0, (1.00, 1.07), None, 1.0),
    ("D2", JACKET,  9.00, 3.0, 1.0, (1.07, 1.00), None, 1.0),
    ("E1", BUS,     4.00, 4.0, 1.0, (1.00, 1.08), (1215, 2160, 580, 300), 1.25),
    ("E2", BUS,    11.50, 3.5, 1.0, (1.08, 1.14), (1215, 2160, 580, 300), 1.25),
    ("F1", AIRPORT, 6.30, 4.5, 0.5, (1.15, 1.00), None, 1.0),
    ("F2", AIRPORT, 9.50, 4.5, 0.5, (1.00, 1.10), None, 1.0),
]

files = []
for name, f, ss, dur, spd, (z0, z1), crop, gamma in segs:
    out = f"{SEG}/{name}.mp4"; files.append(out)
    nfr = int(round(dur * FPS))
    vf = []
    if spd != 1.0:
        vf.append(f"setpts={1/spd}*PTS")
    vf.append(f"fps={FPS}")
    if crop:
        w, h, x, y = crop
        vf.append(f"crop={w}:{h}:{x}:{y}")
    vf.append("scale=2160:3840:flags=lanczos")
    z = f"{z0}+({z1}-{z0})*on/{nfr - 1}"
    vf.append(f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps={FPS}")
    if gamma != 1.0:
        vf.append(f"eq=gamma={gamma}:contrast=1.05")
    vf.append(f"trim=end_frame={nfr},setpts=PTS-STARTPTS,format=yuv420p")
    if os.environ.get("SKIP") and os.path.exists(out): continue
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-t", str(dur * spd + 0.5), "-i", f,
         "-an", "-vf", ",".join(vf), "-c:v", "libx264", "-preset", "fast", "-crf", "14", out])

# G: freeze frame end card (sharp -> blurred & darker)
still = f"{SEG}/G_still.png"
run(["ffmpeg", "-v", "error", "-y", "-ss", "11.70", "-i", AIRPORT, "-frames:v", "1", still])
g = f"{SEG}/G.mp4"; files.append(g)
nfr = int(5.5 * FPS)
run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-t", "5.5", "-i", still,
     "-filter_complex",
     f"[0:v]scale=2160:3840,zoompan=z='1.10+0.06*on/{nfr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps={FPS},"
     "format=yuv420p,split[a][b];[b]gblur=sigma=22,eq=brightness=-0.10:contrast=0.9[bl];"
     "[a][bl]xfade=transition=fade:duration=1.4:offset=0.4,trim=duration=5.5[v]",
     "-map", "[v]", "-c:v", "libx264", "-preset", "fast", "-crf", "14", g])

with open(f"{SEG}/list.txt", "w") as fh:
    for p in files: fh.write(f"file '{p}'\n")
base = f"{SEG}/base.mp4"
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{SEG}/list.txt", "-c", "copy", base])

# ---------------- final pass ----------------
flash = ("0.55*exp(-(t-3.0)*14)*between(t,3.0,3.4)"
         "+0.85*exp(-(t-24.0)*7)*between(t,24.0,24.8)"
         "+0.30*exp(-(t-33.0)*10)*between(t,33.0,33.4)")
shake_amp = ("(10*exp(-(t-3.0)*10)*between(t,3.0,3.4)"
             "+22*exp(-(t-24.0)*6)*between(t,24.0,24.9)"
             "+8*exp(-(t-33.0)*10)*between(t,33.0,33.4))")
vf = ",".join([
    "hue=s=0",
    "curves=master='0/0.035 0.18/0.13 0.5/0.50 0.82/0.86 1/0.965'",
    "colorbalance=bs=0.035:bm=0.012:bh=-0.01",
    f"eq=brightness='{flash}':eval=frame",
    "scale=1128:2006",
    f"crop=1080:1920:x='24+{shake_amp}*sin(t*97)':y='43+{shake_amp}*cos(t*83)'",
    "vignette=angle=PI/4.2",
    "noise=alls=6:allf=t",
    f"subtitles={S}/text.ass:fontsdir=/usr/share/fonts/opentype",
    "format=yuv420p",
])

common_v = ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-maxrate", "16M", "-bufsize", "32M", "-profile:v", "high",
            "-pix_fmt", "yuv420p", "-r", str(FPS), "-movflags", "+faststart"]

run(["ffmpeg", "-v", "error", "-y", "-i", base, "-i", f"{S}/music_raw.wav",
     "-filter_complex", f"[0:v]{vf}[v];[1:a]loudnorm=I=-14:TP=-1.2:LRA=11,aresample=48000[a]",
     "-map", "[v]", "-map", "[a]", *common_v, "-c:a", "aac", "-b:a", "256k", "-shortest",
     f"{OUT}/airport_agent_reel.mp4"])

# silent version for adding a trending Instagram sound in-app
run(["ffmpeg", "-v", "error", "-y", "-i", f"{OUT}/airport_agent_reel.mp4", "-map", "0:v", "-c", "copy",
     "-movflags", "+faststart", f"{OUT}/airport_agent_reel_NO_MUSIC.mp4"])
# music alone
run(["ffmpeg", "-v", "error", "-y", "-i", f"{S}/music_raw.wav", "-af", "loudnorm=I=-14:TP=-1.2:LRA=11",
     "-ar", "48000", "-b:a", "320k", f"{OUT}/original_score.mp3"])
print("done")
