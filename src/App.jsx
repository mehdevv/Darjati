import { useState, useEffect } from 'react';
import { preloadedData } from './data/preloadedData';
import {
  calculateModuleAverage,
  calculateUEAverage,
  calculateSemesterAverage,
  getAverageColor,
  calculateRequiredAverage,
} from './utils/calculations';
import { generateRandomGrades } from './utils/gradeGenerator';
import { generateDarjaReaction } from './utils/darjaReactions';
import { generateAIDarjaReaction } from './services/openRouterService';
import AIChatbot from './components/AIChatbot';

function App() {
  // Deep clone the preloaded data to avoid mutations
  const [semesters, setSemesters] = useState(() => {
    return JSON.parse(JSON.stringify(preloadedData.semesters));
  });

  const [activeSemesterId, setActiveSemesterId] = useState(semesters[0]?.id || 'sem3');
  /* expandedUEs state removed */
  const [desiredAverage, setDesiredAverage] = useState('');
  const [selectedModuleIds, setSelectedModuleIds] = useState(new Set());
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [useAIReactions, setUseAIReactions] = useState(false);
  const [aiReaction, setAiReaction] = useState(null);
  const [isLoadingAIReaction, setIsLoadingAIReaction] = useState(false);

  const activeSemester = semesters.find((s) => s.id === activeSemesterId);

  // Calculate current semester average
  const currentAverage = activeSemester
    ? calculateSemesterAverage(activeSemester)
    : null;

  // Calculate required average for simulation (Legacy View)
  // We keep this for the visual "Projected" badge, but the main action is now generating specific grades
  const simulation = desiredAverage && desiredAverage !== '' && selectedModuleIds.size > 0
    ? calculateRequiredAverage(
      activeSemester,
      parseFloat(desiredAverage),
      Array.from(selectedModuleIds)
    )
    : null;

  // Generate Darja reaction (static or AI-powered)
  const [darjaReaction, setDarjaReaction] = useState('');

  // Generate reaction when dependencies change
  useEffect(() => {
    if (useAIReactions && activeSemester) {
      setIsLoadingAIReaction(true);
      generateAIDarjaReaction(
        currentAverage,
        desiredAverage,
        simulation?.possible ?? true,
        activeSemester
      )
        .then((reaction) => {
          setAiReaction(reaction);
          setDarjaReaction(reaction);
          setIsLoadingAIReaction(false);
        })
        .catch((error) => {
          console.error('Error generating AI reaction:', error);
          // Fallback to static reaction
          const staticReaction = generateDarjaReaction(
            currentAverage,
            desiredAverage,
            simulation?.possible ?? true
          );
          setDarjaReaction(staticReaction);
          setIsLoadingAIReaction(false);
        });
    } else {
      const staticReaction = generateDarjaReaction(
        currentAverage,
        desiredAverage,
        simulation?.possible ?? true
      );
      setDarjaReaction(staticReaction);
      setAiReaction(null);
    }
  }, [currentAverage, desiredAverage, simulation?.possible, useAIReactions, activeSemester]);

  /* toggleUE and expandAllUEs removed */

  // Update module grade
  const updateModuleGrade = (semesterId, ueId, moduleId, field, value) => {
    setSemesters((prev) =>
      prev.map((semester) => {
        if (semester.id !== semesterId) return semester;

        return {
          ...semester,
          ues: semester.ues.map((ue) => {
            if (ue.id !== ueId) return ue;

            return {
              ...ue,
              modules: ue.modules.map((module) => {
                if (module.id !== moduleId) return module;

                return {
                  ...module,
                  [field]: value === '' ? null : parseFloat(value) || '',
                };
              }),
            };
          }),
        };
      })
    );
  };

  // Toggle module selection for simulation
  const toggleModuleSelection = (moduleId) => {
    const newSelected = new Set(selectedModuleIds);
    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
    } else {
      newSelected.add(moduleId);
    }
    setSelectedModuleIds(newSelected);
  };

  // Estimate required grades (Random Generator)
  const estimateGrades = () => {
    if (!desiredAverage || desiredAverage === '') {
      alert('Veuillez entrer une moyenne souhaitée !');
      return;
    }

    if (!activeSemester) return;

    // 1. Identify modules to modify (Auto-select empty + keep existing selection)
    const modulesToEstimate = new Set(selectedModuleIds);

    activeSemester.ues.forEach(ue => {
      ue.modules.forEach(module => {
        // If already selected, skip
        if (modulesToEstimate.has(module.id)) return;

        // Check compatibility (missing grades)
        const isMissingCC = module.type !== '100%' && (module.cc === null || module.cc === '');
        const isMissingExam = module.exam === null || module.exam === '';

        if (isMissingCC || isMissingExam) {
          modulesToEstimate.add(module.id);
        }
      });
    });

    if (modulesToEstimate.size === 0) {
      alert('Tous les modules sont déjà notés. Sélectionnez manuellement des modules à modifier.');
      return;
    }

    // 2. Generate Grades
    const estimatedSemester = generateRandomGrades(
      activeSemester,
      desiredAverage,
      modulesToEstimate
    );

    if (!estimatedSemester) {
      alert("Impossible d'atteindre cette moyenne avec les modules sélectionnés (les notes dépasseraient 20).");
      // Add 'impossible' state or just select them so user sees?
      setSelectedModuleIds(modulesToEstimate);
      return;
    }

    // 3. Apply changes (Update state)
    setSemesters(prev => prev.map(s => s.id === activeSemester.id ? estimatedSemester : s));
    setSelectedModuleIds(modulesToEstimate);
  };

  // Format average display
  const formatAverage = (avg) => {
    if (avg === null || avg === undefined) return '--';
    return avg.toFixed(2);
  };

  // Get average color class
  const getAverageClass = (avg) => {
    const color = getAverageColor(avg);
    return `average-${color}`;
  };

  // Calculate gap to desired average
  const getGapToDesired = () => {
    if (!desiredAverage || desiredAverage === '' || currentAverage === null) return null;
    const gap = parseFloat(desiredAverage) - currentAverage;
    return gap > 0 ? gap.toFixed(2) : null;
  };

  if (!activeSemester) return null;

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen pb-32 antialiased selection:bg-primary/20">
      {/* Top Navigation / Header */}
      <header className="pt-6 pb-2 px-6 bg-background-light dark:bg-background-dark relative transition-colors duration-300 border-b border-slate-100 dark:border-slate-800/50">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex items-center gap-3">
            <span className="text-primary font-bold text-2xl tracking-tight">/ 2CP</span>
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full shadow-inner ring-1 ring-slate-200 dark:ring-slate-700/50">
              {semesters.map((semester) => (
                <button
                  key={semester.id}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${activeSemesterId === semester.id
                    ? 'bg-white dark:bg-slate-600 text-primary shadow-sm ring-1 ring-slate-100 dark:ring-slate-500/20 scale-100'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  onClick={() => setActiveSemesterId(semester.id)}
                >
                  {semester.id === 'sem3' ? 'S3' : 'S4'}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-tight italic mt-1">
            By kernou mehdi
          </span>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="px-4 mt-2 flex flex-col gap-6">
        {/* Hero Card: Current Average */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-light dark:bg-surface-dark shadow-soft dark:shadow-none p-12 text-center group transition-all duration-300">
          {/* Ambient Glow Effects */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/15 transition-all"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] group-hover:bg-blue-400/15 transition-all"></div>

          <div className="relative z-10 flex flex-col items-center justify-center gap-1">
            <span className={`text-8xl font-black tracking-tighter drop-shadow-sm transition-all duration-500 ${getAverageClass(currentAverage)}`}>
              {formatAverage(currentAverage)}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-extrabold text-sm sm:text-base uppercase tracking-[0.2em] mt-2">
              Moyenne actuelle
            </span>
          </div>
        </div>

        {/* Goal Input Section */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-soft flex items-center justify-between gap-4 border border-transparent focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
          <div className="flex flex-col gap-0.5">
            <label className="text-slate-900 dark:text-white font-semibold text-sm" htmlFor="target-grade">
              Moyenne souhaitée
            </label>
            <span className="text-slate-400 text-sm font-normal">Votre Objectif est :</span>
          </div>
          <div className="relative">
            <input
              className="w-32 text-right bg-background-light dark:bg-background-dark border-none rounded-xl text-xl font-bold text-primary focus:ring-0 p-3 pr-10 placeholder:text-slate-300 shadow-inner"
              id="target-grade"
              inputMode="decimal"
              placeholder="10.00"
              type="number"
              min="0"
              max="20"
              step="0.01"
              value={desiredAverage}
              onChange={(e) => setDesiredAverage(e.target.value)}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-95 flex items-center justify-center"
              onClick={estimateGrades}
              title="Estimer les notes"
            >
              <span className="material-symbols-outlined text-xl">
                calculate
              </span>
            </button>
          </div>
        </div>

        {/* Modules Accordion List */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-soft overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {/* Header Row for the 'Table' */}
          <div className="grid grid-cols-12 gap-2 p-4 bg-slate-50/50 dark:bg-slate-800/20 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">
            <div className="col-span-4 sm:col-span-5 pl-2">Module</div>
            <div className="col-span-3 text-center">TD</div>
            <div className="col-span-3 text-center">Examen</div>
            <div className="col-span-2 text-right pr-2">Moy</div>
          </div>

          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {activeSemester.ues.map((ue) =>
              ue.modules.map((module) => {
                const moduleAvg = calculateModuleAverage(module);
                const isSelected = selectedModuleIds.has(module.id);
                const isLocked = desiredAverage && desiredAverage !== '' && !isSelected;
                const requiredAvg = simulation?.moduleRequirements[module.id];

                return (
                  <div
                    key={module.id}
                    className="p-4 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Top Row: inputs aligned with header */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Name Column */}
                        <div className="col-span-4 sm:col-span-5 flex flex-col justify-center">
                          <span className="text-slate-900 dark:text-white font-semibold text-sm sm:text-base leading-tight">
                            {module.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Coef {module.coefficient}
                          </span>
                        </div>

                        {/* TD Input */}
                        <div className="col-span-3 flex justify-center">
                          {module.type !== '100%' ? (
                            <input
                              className={`w-full max-w-[70px] bg-background-light dark:bg-background-dark border-0 focus:ring-2 focus:ring-primary/50 rounded-lg text-center font-bold text-slate-900 dark:text-white py-2 text-sm shadow-sm transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              type="number"
                              min="0"
                              max="20"
                              step="0.01"
                              placeholder="--"
                              value={module.cc !== null && module.cc !== '' ? module.cc : ''}
                              onChange={(e) =>
                                updateModuleGrade(activeSemesterId, ue.id, module.id, 'cc', e.target.value)
                              }
                              disabled={isLocked}
                            />
                          ) : (
                            <span className="text-slate-300 text-xs">--</span>
                          )}
                        </div>

                        {/* Exam Input */}
                        <div className="col-span-3 flex justify-center">
                          <input
                            className={`w-full max-w-[70px] bg-background-light dark:bg-background-dark border-0 focus:ring-2 focus:ring-primary/50 rounded-lg text-center font-bold text-slate-900 dark:text-white py-2 text-sm placeholder:text-slate-300 shadow-sm transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            type="number"
                            min="0"
                            max="20"
                            step="0.01"
                            placeholder="--"
                            value={module.exam !== null && module.exam !== '' ? module.exam : ''}
                            onChange={(e) =>
                              updateModuleGrade(activeSemesterId, ue.id, module.id, 'exam', e.target.value)
                            }
                            disabled={isLocked}
                          />
                        </div>

                        {/* Result Column */}
                        <div className="col-span-2 flex justify-end items-center pr-2">
                          <span className={`text-sm sm:text-base font-bold ${getAverageClass(moduleAvg)}`}>
                            {formatAverage(moduleAvg)}
                          </span>
                        </div>
                      </div>

                      {/* Simulation Extras (Conditional) */}
                      {(desiredAverage && desiredAverage !== '' || isSelected) && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/50 mt-1">
                          {desiredAverage && desiredAverage !== '' && (
                            <div className="flex items-center gap-2">
                              <input
                                className="rounded text-primary border-slate-300 focus:ring-primary/30 w-3.5 h-3.5 cursor-pointer"
                                id={`checkbox-${module.id}`}
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleModuleSelection(module.id)}
                              />
                              <label
                                className="text-[10px] sm:text-xs text-slate-400 font-medium select-none cursor-pointer"
                                htmlFor={`checkbox-${module.id}`}
                              >
                                Modifier
                              </label>
                            </div>
                          )}

                          {isSelected && requiredAvg !== undefined && (
                            <div
                              className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${requiredAvg > 20
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                }`}
                            >
                              {(() => {
                                // Calculate effective current average (treating nulls as 0)
                                let currentEffectiveAvg = 0;
                                if (module.type === '100%') {
                                  currentEffectiveAvg = parseFloat(module.exam || 0);
                                } else {
                                  currentEffectiveAvg = (parseFloat(module.cc || 0) * 0.4) + (parseFloat(module.exam || 0) * 0.6);
                                }

                                const delta = requiredAvg - currentEffectiveAvg;
                                const sign = delta > 0 ? '+' : '';
                                return `${sign}${delta.toFixed(2)}`;
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AI Reaction Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl flex items-start gap-4 border border-blue-100 dark:border-slate-700 shadow-sm">
          <div className="bg-white dark:bg-slate-700 h-10 w-10 flex items-center justify-center rounded-full shadow-sm shrink-0 text-xl border border-slate-100 dark:border-slate-600">
            {useAIReactions ? '🤖' : '💪'}
          </div>
          <div className="flex-1 pt-0.5">
            {isLoadingAIReaction ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-xs">L'AI génère une réaction...</span>
              </div>
            ) : (
              <p className="text-slate-700 dark:text-slate-200 font-medium text-sm leading-relaxed" dir="rtl">
                {darjaReaction}
              </p>
            )}
            {getGapToDesired() && !isLoadingAIReaction && (
              <p className="text-slate-600 dark:text-slate-300 font-medium text-xs mt-2">
                Il te manque <span className="font-bold text-primary">{getGapToDesired()}</span> points pour atteindre l'objectif.
              </p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setUseAIReactions(!useAIReactions)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${useAIReactions
                  ? 'bg-primary text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
              >
                {useAIReactions ? '✓ AI Activé' : '🤖 Utiliser AI'}
              </button>
              <button
                onClick={() => setIsChatbotOpen(true)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
              >
                💬 Chat avec AI
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Spacer */}
        <div className="h-6"></div>
      </main >

      {/* Sticky Bottom Status Bar */}
      < div className="fixed bottom-0 left-0 w-full z-40" >
        <div className="glass-panel border-t border-slate-200/60 dark:border-slate-700/60 px-6 py-4 pb-8 flex items-center justify-between shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {simulation ? 'Projection' : 'Moyenne'}
            </span>
            <div className="flex items-center gap-1.5">
              {simulation && (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full ${simulation.possible ? 'bg-emerald-400' : 'bg-red-400'
                        } opacity-75`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${simulation.possible ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                    ></span>
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold text-sm">
                    {simulation.possible ? 'Objectif possible' : 'Objectif impossible'}
                  </span>
                </>
              )}
              {!simulation && (
                <span className="text-slate-900 dark:text-white font-bold text-sm">
                  {formatAverage(currentAverage)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsChatbotOpen(true)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 transition-all active:scale-90 relative hover:shadow-xl group"
            title="Chat avec l'AI"
          >
            <span className="material-symbols-outlined text-slate-700 dark:text-slate-200 text-2xl group-hover:rotate-12 transition-transform">smart_toy</span>
            {useAIReactions && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white dark:border-slate-800"></span>
            )}
          </button>
        </div>
      </div >

      {/* AI Chatbot */}
      < AIChatbot
        semester={activeSemester}
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)
        }
      />
    </div >
  );
}

export default App;
