'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Code2, Video, MessageSquare, Plus, Hash, Mic, MicOff, Maximize2, Terminal, Users, PhoneOffIcon } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function Showcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const uiWrapperRef = useRef<HTMLDivElement>(null);
  const appWindowRef = useRef<HTMLDivElement>(null);
  
  // Specific UI Elements to highlight
  const sidebarRef = useRef<HTMLDivElement>(null);
  const videoGridRef = useRef<HTMLDivElement>(null);
  const codeEditorRef = useRef<HTMLDivElement>(null);
  const aiOverlayRef = useRef<HTMLDivElement>(null);
  
  // Text content for sequence
  const caption1Ref = useRef<HTMLDivElement>(null);
  const caption2Ref = useRef<HTMLDivElement>(null);
  const caption3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Master Pin Timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=4000', // Long scroll duration for the whole showcase
        pin: true,
        scrub: 1,
      }
    });

    // Initial state: UI is tilted and zoomed out
    gsap.set(appWindowRef.current, { 
      rotateX: 45, 
      rotateY: -10, 
      rotateZ: 5, 
      scale: 0.6, 
      y: 100, 
      boxShadow: '0 50px 100px -20px rgba(0,0,0,0.8)' 
    });
    
    gsap.set([caption1Ref.current, caption2Ref.current, caption3Ref.current], { opacity: 0, y: 30 });
    gsap.set(aiOverlayRef.current, { opacity: 0, scale: 0.9, y: 20 });

    // STEP 1: Swoop in to flat, centered view
    tl.to(appWindowRef.current, {
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1.05,
      y: -20,
      boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 30px 60px -10px rgba(0,0,0,0.9)',
      duration: 1,
      ease: 'power2.inOut'
    })
    .to(caption1Ref.current, { opacity: 1, y: 0, duration: 0.5 }, '-=0.5');

    // Hold step 1
    tl.to({}, { duration: 0.5 });

    // STEP 2: Focus on the Live Video/Collaboration (Zoom into top right)
    tl.to(caption1Ref.current, { opacity: 0, y: -30, duration: 0.5 })
      .to(appWindowRef.current, {
        scale: 1.4,
        x: '-25%', // Pan left to bring right side (video) into focus
        y: '15%',  // Pan down to bring top into focus
        duration: 1,
        ease: 'power2.inOut'
      }, '<')
      .to(sidebarRef.current, { opacity: 0.2, filter: 'blur(4px)', duration: 0.5 }, '<')
      .to(codeEditorRef.current, { opacity: 0.3, filter: 'blur(2px)', duration: 0.5 }, '<')
      .to(videoGridRef.current, { boxShadow: '0 0 40px -10px rgba(139, 92, 246, 0.5)', borderColor: 'rgba(139, 92, 246, 0.5)', duration: 0.5 }, '<')
      .to(caption2Ref.current, { opacity: 1, y: 0, duration: 0.5 });

    // Hold step 2
    tl.to({}, { duration: 0.5 });

    // STEP 3: Shift focus to Code & AI Copilot
    tl.to(caption2Ref.current, { opacity: 0, y: -30, duration: 0.5 })
      .to(videoGridRef.current, { boxShadow: 'none', borderColor: 'rgba(255,255,255,0.05)', opacity: 0.3, filter: 'blur(2px)', duration: 0.5 }, '<')
      .to(appWindowRef.current, {
        scale: 1.3,
        x: '5%',   // Pan right to center code editor
        y: '-10%', // Pan up
        duration: 1,
        ease: 'power2.inOut'
      }, '<')
      .to(codeEditorRef.current, { opacity: 1, filter: 'blur(0px)', duration: 0.5 }, '<')
      .to(aiOverlayRef.current, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.2')
      .to(caption3Ref.current, { opacity: 1, y: 0, duration: 0.5 }, '<');

    // Hold step 3
    tl.to({}, { duration: 0.5 });

    // STEP 4: Zoom out and fade to transition to next section
    tl.to([caption3Ref.current, aiOverlayRef.current], { opacity: 0, y: -30, duration: 0.5 })
      .to(appWindowRef.current, {
        scale: 0.8,
        x: 0,
        y: -100,
        opacity: 0,
        rotateX: -10,
        duration: 1,
        ease: 'power2.in'
      }, '<');

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.trigger === containerRef.current) t.kill();
      });
    };
  }, []);

  return (
    <section ref={containerRef} className="relative w-full h-screen bg-background overflow-hidden flex items-center justify-center perspective-[2000px]">
      
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-[800px] h-[600px] bg-primary/20 blur-3xl rounded-full " />
      </div>

      {/* Captions Overlay */}
      <div className="absolute top-24 left-0 w-full z-30 pointer-events-none px-6 flex justify-center text-center">
        <div className="relative w-full max-w-2xl h-20">
          <div ref={caption1Ref} className="absolute inset-0 flex flex-col items-center justify-center">
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-2 shadow-foreground drop-shadow-lg">Discord-Grade Workspaces</h3>
            <p className="text-lg text-foreground/80 font-medium">Text, voice, and AI tools for your university team.</p>
          </div>
          <div ref={caption2Ref} className="absolute inset-0 flex flex-col items-center justify-center">
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-2 shadow-foreground drop-shadow-lg">LiveKit Enterprise Calling</h3>
            <p className="text-lg text-foreground/80 font-medium">Low-latency group video calls directly in your squad.</p>
          </div>
          <div ref={caption3Ref} className="absolute inset-0 flex flex-col items-center justify-center">
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-2 shadow-foreground drop-shadow-lg">Hive AI Copilot</h3>
            <p className="text-lg text-foreground/80 font-medium">Multimodal intelligence for your team incubation.</p>
          </div>
        </div>
      </div>

      {/* App Interface Container */}
      <div ref={uiWrapperRef} className="relative z-10 w-full max-w-[1200px] aspect-[16/9] px-4 md:px-12 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* The Application Window */}
        <div 
          ref={appWindowRef}
          className="relative w-full h-full rounded-xl overflow-hidden bg-background border border-foreground/10 flex flex-col shadow-2xl"
        >
          {/* Mac-style Window Header */}
          <div className="h-10 bg-card border-b border-foreground/5 flex items-center px-4 justify-between shrink-0">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-foreground/40">
              <Sparkles className="w-3 h-3" /> project-hive-studio
            </div>
            <div className="w-16" /> {/* Spacer for symmetry */}
          </div>

          {/* App Body */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar */}
            <div ref={sidebarRef} className="hidden md:flex w-64 border-r border-foreground/5 bg-muted flex-col shrink-0">
              <div className="p-4 border-b border-foreground/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Your Squads</span>
                  <Plus className="w-4 h-4 text-foreground/40 hover:text-foreground cursor-pointer" />
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-foreground/5 border border-foreground/10 cursor-pointer">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">H</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground/90">HackMIT Team</span>
                </div>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3">Channels</div>
                <div className="space-y-1">
                  {['general', 'architecture', 'frontend', 'backend'].map((ch, i) => (
                    <div key={ch} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${i === 2 ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground/90'} cursor-pointer transition-colors`}>
                      <Hash className="w-4 h-4 opacity-50" /> {ch}
                    </div>
                  ))}
                </div>
                <div className="text-xs font-bold text-foreground/40 uppercase tracking-widest mt-6 mb-3">Live Rooms</div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-purple-500/10 text-purple-400 font-medium cursor-pointer border border-purple-500/20">
                  <Video className="w-4 h-4" /> Collab Stage
                </div>
                <div className="pl-9 mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-foreground/70">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/50" />
                    Alex (You)
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/70">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                    Sarah
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-foreground/5 bg-background">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">Alex Dev</div>
                    <div className="text-xs text-foreground/40 truncate">Online</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col bg-[#141416] min-w-0">
              {/* Toolbar */}
              <div className="h-12 border-b border-foreground/5 flex items-center justify-between px-4 shrink-0 bg-muted overflow-x-auto">
                <div className="flex items-center gap-4 text-sm whitespace-nowrap">
                  <span className="text-foreground/50 hover:text-foreground cursor-pointer transition-colors">#general</span>
                  <span className="text-primary border-b-2 border-primary pb-3 mt-3 cursor-pointer">#frontend</span>
                  <span className="text-foreground/50 hover:text-foreground cursor-pointer transition-colors">#backend</span>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors border border-emerald-500/20 shrink-0">
                    <Users className="w-3.5 h-3.5" /> 4 Members
                  </button>
                </div>
              </div>

              {/* Code & Video Split */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                
                {/* Code Editor */}
<div ref={codeEditorRef} className="flex-1 p-4 md:p-6 font-sans text-xs md:text-sm leading-relaxed overflow-hidden relative flex flex-col justify-end">
  
  <div className="flex gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-emerald-500/20 shrink-0 border border-emerald-500/50" />
    <div className="flex-1">
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-emerald-400">Sarah</span>
        <span className="text-[10px] text-foreground/40">10:41 AM</span>
      </div>
      <p className="text-foreground/80 mt-1">Hey guys! I just pushed the new teammate discovery UI. Can someone review?</p>
    </div>
  </div>

  <div className="flex gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-blue-500/20 shrink-0 border border-blue-500/50" />
    <div className="flex-1">
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-blue-400">Alex</span>
        <span className="text-[10px] text-foreground/40">10:42 AM</span>
      </div>
      <p className="text-foreground/80 mt-1">Looks awesome! Im joining the LiveKit room now to screenshare the WebRTC integration.</p>
    </div>
  </div>

  <div className="flex gap-3 mb-4">
    <div className="w-8 h-8 rounded-full bg-amber-500/20 shrink-0 flex items-center justify-center border border-amber-500/50">
      <Sparkles className="w-4 h-4 text-amber-400" />
    </div>
    <div className="flex-1">
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-amber-400">HiveMind AI</span>
        <span className="text-[10px] text-foreground/40">10:42 AM</span>
      </div>
      <p className="text-foreground/80 mt-1">I noticed you are working on WebRTC. Would you like me to generate a Socket.IO signaling server template?</p>
      <div className="mt-2 p-2 rounded bg-background border border-foreground/10 text-xs text-foreground/60 w-fit flex items-center gap-2 cursor-pointer hover:bg-foreground/5">
        <Terminal className="w-3.5 h-3.5" /> generate-signaling.ts
      </div>
    </div>
  </div>

  {/* Chat Input box mock */}
  <div className="mt-2 h-10 rounded-lg bg-background border border-foreground/10 flex items-center px-3 text-foreground/40 gap-2">
    <Plus className="w-4 h-4" /> Message #frontend...
  </div>

  {/* AI Copilot Overlay */}
                  <div ref={aiOverlayRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-48 md:left-12 md:translate-x-0 md:translate-y-0 w-[90%] md:w-[400px] max-w-[400px] rounded-lg bg-[#1a1a24] border border-primary/40 shadow-[0_10px_40px_-10px_rgba(139,92,246,0.3)] flex flex-col overflow-hidden z-20">
                    <div className="px-3 py-2 bg-primary/10 border-b border-primary/20 flex items-center gap-2 text-xs font-semibold text-primary">
                      <Sparkles className="w-3.5 h-3.5" /> Hive AI Suggestion
                    </div>
                    <div className="p-3 text-xs leading-relaxed text-foreground/80">
                      Consider wrapping the ThemeProvider with a SessionProvider if you are implementing next-auth for squad authentication.
                    </div>
                    <div className="px-3 py-2 bg-background/20 flex gap-2 justify-end">
                      <button className="px-3 py-1 rounded text-xs text-foreground/50 hover:bg-foreground/5">Dismiss</button>
                      <button className="px-3 py-1 rounded bg-primary/20 text-primary text-xs hover:bg-primary/30 font-medium">Accept Change</button>
                    </div>
                  </div>
                </div>

                {/* Video Call & Chat Pane */}
                <div ref={videoGridRef} className="hidden lg:flex w-80 border-l border-foreground/5 bg-muted flex-col shrink-0 transition-shadow">
                  {/* Video Grid */}
                  <div className="p-3 grid grid-cols-2 gap-2 h-48 shrink-0">
                    <div className="relative rounded-lg bg-card border border-foreground/10 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Sarah" />
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-background/60 text-[10px] text-foreground backdrop-blur-md">Sarah</div>
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      </div>
                    </div>
                    <div className="relative rounded-lg bg-[#1a1a24] border border-primary/30 overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">AL</div>
                      </div>
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-background/60 text-[10px] text-foreground backdrop-blur-md">Alex (You)</div>
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                        <MicOff className="w-2.5 h-2.5 text-red-400" />
                      </div>
                    </div>
                    <div className="relative rounded-lg bg-card border border-foreground/10 overflow-hidden col-span-2">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="David" />
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-background/60 text-[10px] text-foreground backdrop-blur-md">David (Sharing)</div>
                    </div>
                  </div>

                  {/* Room Controls */}
                  <div className="px-3 pb-3 flex items-center justify-center gap-2 border-b border-foreground/5">
                    <button className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/80 hover:bg-foreground/20"><Mic className="w-4 h-4" /></button>
                    <button className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/80 hover:bg-foreground/20"><Video className="w-4 h-4" /></button>
                    <button className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-foreground"><PhoneOffIcon className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-foreground/10 mx-1" />
                    <button className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/50 hover:bg-foreground/10 hover:text-foreground"><Maximize2 className="w-3.5 h-3.5" /></button>
                  </div>

                  {/* Mini Chat */}
                  <div className="flex-1 p-3 flex flex-col text-xs">
                    <div className="flex-1 overflow-y-auto space-y-3">
                      <div>
                        <span className="text-foreground/40 mr-2">10:42 AM</span>
                        <span className="text-emerald-400 font-semibold mr-2">Sarah:</span>
                        <span className="text-foreground/80">I just updated the layout file.</span>
                      </div>
                      <div>
                        <span className="text-foreground/40 mr-2">10:43 AM</span>
                        <span className="text-primary font-semibold mr-2">Hive AI:</span>
                        <span className="text-foreground/80">Suggestion available for #frontend</span>
                      </div>
                    </div>
                    <div className="mt-2 h-8 rounded bg-foreground/5 border border-foreground/10 flex items-center px-2 text-foreground/40">
                      Type in Collab Stage...
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}


