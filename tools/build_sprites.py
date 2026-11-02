# Builds clean, uniformly-celled RGBA sprite sheets from the raw black-bg AI sheets.
# Keying = flood fill from the border (only bg-connected near-black pixels removed),
# so dark jeans/hoodies are no longer punched through like the old keyed/ sheets.
import numpy as np, json
from PIL import Image, ImageFilter
from scipy import ndimage as nd
A='assets/anims/'; O='assets/sprites/'
CW,CH=256,512
def key(img,tol=7):
    a=np.asarray(img.convert('RGB')).astype(int); lum=a.max(2)
    fg=lum>tol
    fg=nd.binary_closing(fg,iterations=4); fg=nd.binary_fill_holes(fg); fg=nd.binary_opening(fg,iterations=1)
    lab2,n=nd.label(fg)
    if n:
        sz=nd.sum(fg,lab2,range(1,n+1)); keep=np.isin(lab2,1+np.where(sz>sz.max()*0.02)[0]); fg=keep
    alpha=Image.fromarray((fg*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))
    out=img.convert('RGBA'); out.putalpha(alpha); return out,fg
def figures(fg,count):
    cols=fg.any(0); runs=[];x=0;W=len(cols)
    while x<W:
        if cols[x]:
            s=x
            while x<W and cols[x]: x+=1
            if x-s>8: runs.append((s,x))
        x+=1
    # merge tiny gaps until count, or fall back to equal slicing
    while len(runs)>count:
        gaps=[runs[i+1][0]-runs[i][1] for i in range(len(runs)-1)];i=int(np.argmin(gaps))
        runs[i]=(runs[i][0],runs[i+1][1]);del runs[i+1]
    if len(runs)<count:
        w=W/count; runs=[(int(i*w),int((i+1)*w)) for i in range(count)]
    return runs
def cell(rgba,fg,x0,x1,H):
    sub=fg[:,x0:x1]; ys=np.where(sub.any(1))[0]; y0,y1=ys[0],ys[-1]+1
    crop=rgba.crop((x0,y0,x1,y1)); return crop
def pack(crops,name,heightRef=None):
    hmax=max(c.size[1] for c in crops); wmax=max(c.size[0] for c in crops)
    sc=min((CH-8)/hmax,(CW-8)/wmax)
    sheet=Image.new('RGBA',(CW*len(crops),CH))
    for i,c in enumerate(crops):
        c2=c.resize((max(1,int(c.size[0]*sc)),max(1,int(c.size[1]*sc))),Image.LANCZOS)
        sheet.paste(c2,(i*CW+(CW-c2.size[0])//2,CH-4-c2.size[1]),c2)   # bottom-aligned, centered
    sheet.save(O+name+'.png',optimize=True); return len(crops)
def strip(src,name,count):
    rgba,fg=key(Image.open(A+src)); runs=figures(fg,count)
    return pack([cell(rgba,fg,a,b,0) for a,b in runs],name)
def backwalk(img,name,n=8,face_left=False):
    rgba,fg=key(img); ys,xs=np.where(fg); c=rgba.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
    w,h=c.size; hip=int(h*0.50); frames=[]
    import math
    for i in range(n):
        ph=i/n*2*math.pi; f=Image.new('RGBA',(w+20,h+20))
        lift=lambda s: max(0.0,s)
        ov=int(h*0.05); top=c.crop((0,0,w,hip+ov)); L=c.crop((0,hip,w//2,h)); R=c.crop((w//2,hip,w,h))
        bob=int(abs(math.sin(ph))*h*0.012); sway=int(math.sin(ph)*w*0.025)
        ll=lift(math.sin(ph)); rl=lift(-math.sin(ph))
        base=h+10
        f.paste(L,(10+sway//2,base-L.size[1]-int(ll*h*0.045)),L); f.paste(R,(10+w//2+sway//2,base-R.size[1]-int(rl*h*0.045)),R)
        tp=top.rotate(math.sin(ph)*1.6,resample=Image.BICUBIC,center=(w/2,hip))
        f.paste(tp,(10+sway,base-(h-hip)-hip-bob - int(0)+2),tp)
        frames.append(f)
    return pack(frames,name)
meta={}
# back views (player): ashaad idle frame 4 is a true back view; emmanuel/landry generated back views
ai=Image.open(A+'ashaad-idle.png'); W=ai.size[0]; _,fg=key(ai); runs=figures(fg,4)
a,b=runs[3]; meta['ashaad-back']=backwalk(ai.crop((a-10,0,b+10,ai.size[1])),'ashaad-back')
meta['emmanuel-back']=backwalk(Image.open(A+'emmanuel-back.jpg'),'emmanuel-back')
meta['landry-back']=backwalk(Image.open(A+'landry-back.jpg'),'landry-back')
for n in ['ashaad-run','emmanuel-run','landry-run','julian-chase','verity-chase','julian-idle','verity-idle']:
    meta[n]=strip(n+'.png',n,4 if 'idle' in n else 6)
json.dump({k:{'frames':v,'cw':CW,'ch':CH} for k,v in meta.items()},open(O+'sprites.json','w'),indent=1)
print(meta)
