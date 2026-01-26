import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const steps = [
    {
      targetId: 'editor-panel',
      title: 'Start Here',
      text: 'Upload your cover art, canvas video, and lyrics here. Your changes update in real-time.',
      position: 'top-20 left-[400px]'
    },
    {
      targetId: 'player-bar',
      title: 'Interactive Player',
      text: 'Control playback here. Click the small album art on the left to toggle the Sidebar!',
      position: 'bottom-24 left-10'
    },
    {
      targetId: 'right-sidebar',
      title: 'Rich Sidebar',
      text: 'Switch between Cover Art, Canvas Video and Lyrics. Try Full Screen mode!',
      position: 'top-20 right-[430px]'
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setVisible(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none">
       {/* Dimmed Background */}
       <div className="absolute inset-0 bg-black/40"></div>

       {/* Tooltip */}
       <div className={`absolute pointer-events-auto transition-all duration-500 ${currentStep.position}`}>
           <div className="bg-[#1ed760] text-black p-5 rounded-xl shadow-2xl max-w-xs relative animate-enter-view">
               <button 
                 onClick={() => setVisible(false)}
                 className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded-full"
               >
                   <X size={16} />
               </button>
               <h3 className="font-bold text-lg mb-2">{currentStep.title}</h3>
               <p className="text-sm font-medium leading-relaxed mb-4">{currentStep.text}</p>
               
               <div className="flex justify-between items-center">
                   <div className="flex gap-1">
                       {steps.map((_, i) => (
                           <div key={i} className={`h-1.5 w-1.5 rounded-full ${i === step ? 'bg-black' : 'bg-black/20'}`}></div>
                       ))}
                   </div>
                   <button 
                     onClick={handleNext}
                     className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold hover:scale-105 transition"
                   >
                       {step === steps.length - 1 ? 'Finish' : 'Next'}
                   </button>
               </div>
               
               {/* Arrow */}
               <div className="absolute w-4 h-4 bg-[#1ed760] rotate-45 -z-10 bottom-0 left-0 translate-y-1/2 translate-x-6"></div>
           </div>
       </div>
    </div>
  );
};

export default Onboarding;