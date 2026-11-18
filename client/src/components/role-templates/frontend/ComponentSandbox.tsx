import {useEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'framer-motion';
import type {SandboxWidget} from '../shared/contracts.ts';
import {control,DemoNote} from '../shared/RoleFrame.tsx';
type ComponentState='idle'|'hover'|'loading'|'error'|'success';
const states:ComponentState[]=['idle','hover','loading','error','success'];
function useMotionPreference(){
  const initial=useReducedMotion(),[reduce,setReduce]=useState(Boolean(initial));
  useEffect(()=>{
    // Framer Motion 11 reads this preference only at mount. Follow changes too,
    // including changes made while an interactive portfolio is already open.
    const media=window.matchMedia('(prefers-reduced-motion: reduce)'),sync=()=>setReduce(media.matches);
    sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);
  },[]);
  return reduce;
}
export function ComponentSandbox({data,interactive=true}:{data:SandboxWidget;interactive?:boolean}){
  const[state,setState]=useState<ComponentState>('idle'),reduce=useMotionPreference();
  useEffect(()=>{if(state!=='loading')return;const timer=setTimeout(()=>setState('success'),1600);return()=>clearTimeout(timer);},[state]);
  return <div className="rp-component-lab" data-widget="sandbox"><fieldset disabled={!interactive} className="flex flex-wrap gap-2 border-b border-[var(--rp-border)] p-5"><legend className="sr-only">Component states</legend>{states.map((value)=><button type="button" key={value} className={control} aria-label={`${value[0].toUpperCase()+value.slice(1)} state`} aria-pressed={state===value} onClick={()=>setState(value)}>{value}</button>)}</fieldset>
    <div className="rp-sandbox-stage"><motion.article className={`rp-sandbox-card rp-state-${state}`} initial={false} animate={{y:state==='hover'&&!reduce?-5:0,scale:state==='hover'&&!reduce?1.015:1}} transition={{duration:reduce?0:.18}}>
      <div className="mb-6 flex items-center justify-between gap-3"><span className="font-mono text-[10px] uppercase tracking-widest text-[var(--rp-accent)]">PREFERENCES / INTERACTION CONTRACT</span><span className="rp-state-indicator" aria-hidden="true"/></div><h3 className="text-2xl font-semibold">{data.title}</h3><p className="rp-copy">{data.description}</p>
      <button type="button" disabled={!interactive||state==='loading'} aria-busy={state==='loading'} className="rp-sandbox-action" onClick={()=>setState('loading')}>{state==='loading'&&<span className="rp-loading-ring" aria-hidden="true"/>}{state==='loading'?'Saving…':state==='error'?'Try again':state==='success'?'Saved ✓':data.buttonLabel}</button>
      <div className="mt-5 min-h-12 text-sm" role={state==='error'?'alert':'status'}>{state==='error'?<p className="text-[var(--rp-danger)]">We couldn’t save this change.</p>:state==='success'?<p className="text-[var(--rp-success)]">Saved. You’re all set.</p>:state==='loading'?<p className="text-[var(--rp-muted)]">A local simulation is completing…</p>:<p className="text-[var(--rp-muted)]">A clear action, with a predictable next state.</p>}</div>
    </motion.article><div className="rp-sandbox-code" aria-label="Current component contract"><p className="rp-kicker">STATE CONTRACT</p><pre className="whitespace-pre-wrap break-words font-mono text-xs leading-8">{`<PreferenceAction\n  state="${state}"\n  disabled={${state==='loading'}}\n  aria-busy={${state==='loading'}}\n/>`}</pre><DemoNote>State is local. Loading completes in 1.6 seconds. No data is submitted.</DemoNote></div></div>
  </div>;
}
export function CraftCanvas({accent,interactive}:{accent:string;interactive:boolean}){
  const ref=useRef<HTMLCanvasElement>(null),reduce=useMotionPreference();
  useEffect(()=>{const canvas=ref.current,parent=canvas?.parentElement,ctx=canvas?.getContext('2d');if(!canvas||!parent||!ctx)return;let width=1,height=1,x=0,y=0,frame=0;const draw=()=>{frame=0;ctx.clearRect(0,0,width,height);ctx.strokeStyle=accent+'20';ctx.lineWidth=1;for(let i=0;i<width;i+=32){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,height);ctx.stroke();}for(let i=0;i<height;i+=32){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(width,i);ctx.stroke();}const gradient=ctx.createRadialGradient(x,y,0,x,y,230);gradient.addColorStop(0,accent+'28');gradient.addColorStop(1,accent+'00');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);};const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw);};const resize=()=>{const box=parent.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);width=box.width;height=box.height;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);x=width*.75;y=height*.3;schedule();};const pointer=(event:PointerEvent)=>{if(!interactive||reduce)return;const box=parent.getBoundingClientRect();x=event.clientX-box.left;y=event.clientY-box.top;schedule();};const observer=new ResizeObserver(resize);observer.observe(parent);parent.addEventListener('pointermove',pointer);resize();return()=>{observer.disconnect();parent.removeEventListener('pointermove',pointer);cancelAnimationFrame(frame);};},[accent,interactive,reduce]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"/>;
}
