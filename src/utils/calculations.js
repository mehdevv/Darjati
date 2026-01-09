/**
 * Calculation utilities for the Moyenne Calculator
 * Implements the Algerian university grading system logic
 */

/**
 * Calculate module average
 * @param {Object} module - Module object with type, cc, exam
 * @returns {number|null} - Module average or null if data incomplete
 */
export function calculateModuleAverage(module) {
  if (module.type === '100%') {
    // 100% Exam (no CC)
    return module.exam !== null && module.exam !== '' ? parseFloat(module.exam) : null;
  } else {
    // 40% CC + 60% Exam
    const cc = module.cc !== null && module.cc !== '' ? parseFloat(module.cc) : null;
    const exam = module.exam !== null && module.exam !== '' ? parseFloat(module.exam) : null;

    if (cc !== null && exam !== null) {
      return (cc * 0.4) + (exam * 0.6);
    }
    return null;
  }
}

/**
 * Calculate UE average
 * @param {Object} ue - UE object with modules array
 * @returns {number|null} - UE average or null if data incomplete
 */
export function calculateUEAverage(ue) {
  const modules = ue.modules || [];
  let totalWeighted = 0;
  let totalCoeff = 0;

  modules.forEach((module) => {
    // Always count the coefficient
    totalCoeff += module.coefficient;

    const moduleAvg = calculateModuleAverage(module);
    if (moduleAvg !== null) {
      totalWeighted += moduleAvg * module.coefficient;
    }
    // If moduleAvg is null, it contributes 0 to totalWeighted
  });

  if (totalCoeff === 0) return 0;
  return totalWeighted / totalCoeff;
}

/**
 * Calculate semester average
 * @param {Object} semester - Semester object with ues array
 * @returns {number|null} - Semester average or null if data incomplete
 */
export function calculateSemesterAverage(semester) {
  const ues = semester.ues || [];
  let totalWeighted = 0;
  let totalCoeff = 0;

  ues.forEach((ue) => {
    // Always count the coefficient
    totalCoeff += ue.coefficient;

    // Calculate UE average (now returns 0 for empty UEs)
    const ueAvg = calculateUEAverage(ue);
    // Note: calculateUEAverage returns a value based on its modules' contributions.
    // If a UE is effectively 0, it contributes 0 to weighted sum.

    totalWeighted += ueAvg * ue.coefficient;
  });

  if (totalCoeff === 0) return 0;
  return totalWeighted / totalCoeff;
}

/**
 * Get color class based on average
 * @param {number|null} average - Average to evaluate
 * @returns {string} - Color class name
 */
export function getAverageColor(average) {
  if (average === null || average === undefined) return 'neutral';
  if (average < 10) return 'red';
  if (average >= 10 && average < 12) return 'orange';
  return 'green';
}

/**
 * Calculate required average for selected modules to reach desired semester average
 * @param {Object} semester - Semester object
 * @param {number} desiredAverage - Desired semester average
 * @param {Array<string>} selectedModuleIds - IDs of modules that can be adjusted
 * @returns {Object} - { possible: boolean, requiredAverage: number|null, moduleRequirements: Object }
 */
export function calculateRequiredAverage(semester, desiredAverage, selectedModuleIds) {
  if (!selectedModuleIds || selectedModuleIds.length === 0) {
    return { possible: false, requiredAverage: null, moduleRequirements: {} };
  }

  const moduleRequirements = {};

  // Step 1: Calculate locked UEs (UEs with no selected modules) - their contribution is fixed
  let lockedSemesterWeighted = 0;
  let lockedSemesterCoeff = 0;

  // Step 2: Group UEs into locked and selected
  const selectedUEs = [];

  semester.ues.forEach((ue) => {
    const selectedModules = ue.modules.filter(m => selectedModuleIds.includes(m.id));

    if (selectedModules.length === 0) {
      // This UE is fully locked - use its current average
      const ueAvg = calculateUEAverage(ue);
      if (ueAvg !== null) {
        lockedSemesterWeighted += ueAvg * ue.coefficient;
        lockedSemesterCoeff += ue.coefficient;
      }
    } else {
      // This UE has selected modules
      const lockedModules = ue.modules.filter(m => !selectedModuleIds.includes(m.id));

      // Calculate weighted contribution of locked modules in this UE
      let lockedWeightedInUE = 0;
      lockedModules.forEach((module) => {
        const moduleAvg = calculateModuleAverage(module);
        if (moduleAvg !== null) {
          lockedWeightedInUE += moduleAvg * module.coefficient;
        }
      });

      selectedUEs.push({
        ue,
        selectedModules,
        lockedWeighted: lockedWeightedInUE,
      });
    }
  });

  // Step 3: Calculate what we need from selected UEs
  const totalSemesterCoeff = semester.ues.reduce((sum, ue) => sum + ue.coefficient, 0);
  const requiredSemesterWeighted = desiredAverage * totalSemesterCoeff;
  const requiredSelectedWeighted = requiredSemesterWeighted - lockedSemesterWeighted;

  // Step 4: Calculate total coefficient of selected UEs
  let selectedUECoeff = 0;
  selectedUEs.forEach(({ ue }) => {
    selectedUECoeff += ue.coefficient;
  });

  if (selectedUECoeff === 0) {
    return { possible: false, requiredAverage: null, moduleRequirements: {} };
  }

  // Step 5: Calculate required average for selected UEs
  const requiredSelectedUEAvg = requiredSelectedWeighted / selectedUECoeff;

  // We allow requiredSelectedUEAvg to be > 20 for "Impossible" feedback

  // Step 6: For each selected UE, calculate what its selected modules need to average
  selectedUEs.forEach(({ ue, selectedModules, lockedWeighted }) => {
    // Total coefficient of all modules in this UE (denominator for UE Avg)
    const totalUEModCoeffs = ue.modules.reduce((sum, m) => sum + m.coefficient, 0);

    // Equation: UE_Avg = (Locked_Raw + Selected_Raw) / Total_Mod_Coeffs
    // Target_Contribution = UE_Avg * UE_Coeff
    // So: Req_UE_Avg = (Locked_Raw + Selected_Raw) / Total_Mod_Coeffs
    // => Selected_Raw = (Req_UE_Avg * Total_Mod_Coeffs) - Locked_Raw

    const requiredRawSum = requiredSelectedUEAvg * totalUEModCoeffs;
    const requiredSelectedRaw = requiredRawSum - lockedWeighted;

    // Total coefficient of selected modules in this UE
    const selectedCoeff = selectedModules.reduce((sum, m) => sum + m.coefficient, 0);

    if (selectedCoeff > 0) {
      // Required average for selected modules in this UE
      const requiredModuleAvg = requiredSelectedRaw / selectedCoeff;

      // Assign the calculate average, even if > 20 or < 0
      selectedModules.forEach((module) => {
        moduleRequirements[module.id] = requiredModuleAvg;
      });
    }
  });

  // Check if any module requirement is > 20 OR < 0
  const isPossible = !Object.values(moduleRequirements).some(avg => avg > 20 || avg < 0);

  // Calculate overall required average
  const allRequiredAvgs = Object.values(moduleRequirements);
  const overallRequiredAvg = allRequiredAvgs.length > 0
    ? allRequiredAvgs.reduce((sum, avg) => sum + avg, 0) / allRequiredAvgs.length
    : requiredSelectedUEAvg;

  return {
    possible: isPossible,
    requiredAverage: overallRequiredAvg,
    moduleRequirements,
  };
}

