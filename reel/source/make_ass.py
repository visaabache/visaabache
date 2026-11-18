"""Generate on-screen text (ASS) with word-by-word reveals."""
S = "/tmp/claude-0/-home-user-visaabache/5eabab15-7d97-56aa-94f3-0ba5d7294540/scratchpad"

def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"

head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Inter Display SemiBold,72,&H00FFFFFF,&H00FFFFFF,&H70000000,&H00000000,0,0,0,0,100,100,0,0,1,4,0,5,80,80,0,1
Style: Hook,Inter Display Bold,84,&H00FFFFFF,&H00FFFFFF,&H70000000,&H00000000,0,0,0,0,100,100,0,0,1,5,0,5,70,70,0,1
Style: Title,Inter Display ExtraBold,92,&H00FFFFFF,&H00FFFFFF,&H60000000,&H00000000,0,0,0,0,100,100,6,0,1,5,0,5,60,60,0,1
Style: Small,Inter Display Medium,36,&H00E6E6E6,&H00FFFFFF,&H70000000,&H00000000,0,0,0,0,100,100,8,0,1,3,0,5,60,60,0,1
Style: Stamp,JetBrains Mono,38,&H00FFFFFF,&H00FFFFFF,&H70000000,&H00000000,1,0,0,0,100,100,2,0,1,3,0,7,70,70,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

ev = []
def line(start, end, text, style="Main", pos=(540, 760), word_step=0.16, fade_out=250, extra=""):
    """Word-by-word reveal with a soft rise; lines separated by \\N."""
    t = 0
    parts = []
    for li, ln in enumerate(text.split("\\N")):
        words = ln.split(" ")
        wp = []
        for w in words:
            ms = int(t * 1000)
            wp.append(f"{{\\alpha&HFF&\\t({ms},{ms + 180},\\alpha&H00&)}}{w}")
            t += word_step
        parts.append(" ".join(wp))
    x, y = pos
    tag = f"{{\\an5\\blur3\\move({x},{y + 18},{x},{y},0,450)\\fad(0,{fade_out}){extra}}}"
    ev.append(f"Dialogue: 1,{ts(start)},{ts(end)},{style},,0,0,0,,{tag}" + "\\N".join(parts))
    halo = "\\N".join(parts).replace("\\alpha&HFF&", "\\1a&HFF&\\3a&HFF&").replace("\\alpha&H00&", "\\3a&H50&")
    htag = f"{{\\an5\\bord22\\blur24\\3c&H000000&\\move({x},{y + 18},{x},{y},0,450)\\fad(0,{fade_out}){extra}}}"
    ev.append(f"Dialogue: 0,{ts(start)},{ts(end)},{style},,0,0,0,,{htag}" + halo)

def plain(start, end, text, style, pos, fin=250, fout=250, extra=""):
    x, y = pos
    ev.append(f"Dialogue: 1,{ts(start)},{ts(end)},{style},,0,0,0,,"
              f"{{\\an5\\pos({x},{y})\\blur2\\fad({fin},{fout}){extra}}}{text}")
    ev.append(f"Dialogue: 0,{ts(start)},{ts(end)},{style},,0,0,0,,"
              f"{{\\an5\\pos({x},{y})\\bord16\\blur18\\1a&HFF&\\3a&H60&\\fad({fin},{fout}){extra}}}{text}")

def stamp(start, end, text):
    # blinking red REC dot + time, top-left (clear of IG top bar)
    ev.append(f"Dialogue: 2,{ts(start)},{ts(end)},Stamp,,0,0,0,,"
              f"{{\\an7\\pos(72,236)\\fad(150,150)\\c&H3030FF&\\bord0}}●")
    ev.append(f"Dialogue: 2,{ts(start)},{ts(end)},Stamp,,0,0,0,,"
              f"{{\\an7\\pos(116,228)\\fad(150,150)}}{text}")

# --- HOOK ---
plain(0.10, 2.92, "A DAY AS AN AIRPORT AGENT · MOROCCO", "Small", (540, 330), fin=200, fout=120)
line(0.25, 2.92, "They see\\Nthe uniform...", "Hook", (540, 1130), word_step=0.28, fade_out=120)

# --- getting ready ---
stamp(3.05, 7.45, "05:00 AM")
line(3.20, 7.35, "...but they never see\\Nthe 5 AM alarm.", word_step=0.20)
stamp(7.55, 10.45, "05:20 AM")
line(7.65, 10.40, "Same shirt. Same tie.\\NSame fight.", word_step=0.20)
stamp(10.55, 16.45, "05:45 AM")
line(10.65, 13.40, "Tired? Yes.", "Hook", word_step=0.30)
line(13.60, 16.40, "Giving up? Never.", "Hook", word_step=0.30)

# --- commute ---
stamp(16.55, 23.70, "06:10 AM")
line(16.75, 20.40, "The city is still asleep...", word_step=0.22, extra="")
line(20.60, 23.70, "...and I'm already\\Non my way.", word_step=0.20)

# --- DROP: airport ---
ev.append(f"Dialogue: 1,{ts(24.02)},{ts(28.30)},Title,,0,0,0,,"
          "{\\an5\\pos(540,1110)\\blur2\\fad(0,250)\\fscx135\\fscy135\\t(0,220,\\fscx100\\fscy100)}AGADIR\\NAL MASSIRA")
ev.append(f"Dialogue: 0,{ts(24.02)},{ts(28.30)},Title,,0,0,0,,"
          "{\\an5\\pos(540,1110)\\bord26\\blur28\\1a&HFF&\\3a&H40&\\fad(0,250)\\fscx135\\fscy135\\t(0,220,\\fscx100\\fscy100)}AGADIR\\NAL MASSIRA")
plain(24.35, 28.30, "AIRPORT  ·  MOROCCO", "Small", (540, 1275), fin=300, fout=250)
line(28.55, 32.90, "Every flight you take\\Nstarts with people\\Nyou never notice.", word_step=0.20, pos=(540, 1120))

# --- END CARD ---
line(33.30, 38.40, "Do it for the ones\\Nwaiting for you at home.", word_step=0.22, pos=(540, 860), fade_out=600)
plain(35.40, 38.40, "save this for the hard days", "Small", (540, 1040), fin=500, fout=600)

open(f"{S}/text.ass", "w").write(head + "\n".join(ev) + "\n")
print(len(ev), "events")
