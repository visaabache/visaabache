import sys,json,soundfile as sf
from kokoro_onnx import Kokoro
k=Kokoro(sys.argv[1],sys.argv[2]);lines=json.load(open(sys.argv[3]));out=sys.argv[4]
for key,txt in lines.items():
    a,sr=k.create(txt,voice='af_heart',speed=0.95,lang='en-us');sf.write(f"{out}/{key}.wav",a,sr);print(key,round(len(a)/sr,2))
