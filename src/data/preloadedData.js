// Preloaded data structure for Semestre 3 and Semestre 4
// Each semester contains UEs, each UE contains modules

export const preloadedData = {
  semesters: [
    {
      id: 'sem3',
      name: 'SEMESTRE 3',
      ues: [
        {
          id: 'ue-2-1-1',
          name: 'UE Fondamentale 2.1.1',
          coefficient: 9,
          modules: [
            {
              id: 'mod-analyse-3',
              name: 'Analyse Mathématique 3',
              coefficient: 3,
              type: '40/60', // 40% CC + 60% Exam
              cc: null,
              exam: null,
            },
            {
              id: 'mod-algebre-2',
              name: 'Algèbre Linéaire 2',
              coefficient: 3,
              type: '40/60',
              cc: null,
              exam: null,
            },
          ],
        },
        {
          id: 'ue-2-1-2',
          name: 'UE Fondamentale 2.1.2',
          coefficient: 6,
          modules: [
            {
              id: 'mod-analyse-fin',
              name: 'Analyse Financière',
              coefficient: 2,
              type: '40/60',
              cc: null,
              exam: null,
            },
            {
              id: 'mod-micro-eco-1',
              name: 'Micro Économie 1',
              coefficient: 2,
              type: '40/60',
              cc: null,
              exam: null,
            },
          ],
        },
        {
          id: 'ue-methodo-2-1',
          name: 'UE Méthodologie 2.1',
          coefficient: 5,
          modules: [
            {
              id: 'mod-proba-2',
              name: 'Probabilités 2',
              coefficient: 3,
              type: '40/60',
              cc: null,
              exam: null,
            },
            {
              id: 'mod-info-3',
              name: 'Informatique 3',
              coefficient: 2,
              type: '40/60',
              cc: null,
              exam: null,
            },
          ],
        },
        {
          id: 'ue-decouv-2-1',
          name: 'UE Découverte & Transversale 2.1',
          coefficient: 6,
          modules: [
            {
              id: 'mod-geo-eco',
              name: 'Géographie Économique',
              coefficient: 1,
              type: '100%', // 100% Exam (no CC)
              cc: null,
              exam: null,
            },
            {
              id: 'mod-francais-3',
              name: 'Français 3',
              coefficient: 1,
              type: '40/60',
              cc: null,
              exam: null,
            },
            {
              id: 'mod-anglais-3',
              name: 'Anglais 3',
              coefficient: 1,
              type: '40/60',
              cc: null,
              exam: null,
            },
          ],
        },
      ],
    },
    {
      id: 'sem4',
      name: 'SEMESTRE 4',
      ues: [
        {
          id: 'ue-2-2-1',
          name: 'UE Fondamentale 2.2.1',
          coefficient: 9,
          modules: [
            {
              id: 'mod-analyse-4',
              name: 'Analyse Mathématique 4',
              coefficient: 3,
              type: '40/60',
              cc: null,
              exam: null,
            },
            {
              id: 'mod-algebre-3',
              name: 'Algèbre Linéaire 3',
              coefficient: 3,
              type: '40/60',
              cc: null,
              exam: null,
            },
          ],
        },
        {
          id: 'ue-2-2-2',
          name: 'UE Fondamentale 2.2.2',
          coefficient: 6,
          modules: [
            {
              id: 'mod-compta-gest',
              name: 'Comptabilité de Gestion',
              coefficient: 2,
              type: '40/60',
              cc: null,
              exam: null,
            },
            {
              id: 'mod-micro-eco-2',
              name: 'Micro Économie 2',
              coefficient: 2,
              type: '40/60',
              cc: null,
              exam: null,
            },
          ],
        },
        {
          id: 'ue-methodo-2-2',
          name: 'UE Méthodologie 2.2',
          coefficient: 5,
          modules: [
            {
              id: 'mod-proba-3',
              name: 'Probabilités 3',
              coefficient: 3,
              type: '40/60',
              cc: null,
              exam: null,
            },
            {
              id: 'mod-info-4',
              name: 'Informatique 4',
              coefficient: 2,
              type: '40/60',
              cc: null,
              exam: null,
            },
          ],
        },
        {
          id: 'ue-decouv-2-2',
          name: 'UE Découverte & Transversale 2.2',
          coefficient: 5,
          modules: [
            {
              id: 'mod-histoire',
              name: 'Histoire contemporaine',
              coefficient: 1,
              type: '100%',
              cc: null,
              exam: null,
            },
            {
              id: 'mod-francais-4',
              name: 'Français 4',
              coefficient: 1,
              type: '40/60',
              cc: null,
              exam: null,
            },
            {
              id: 'mod-anglais-4',
              name: 'Anglais 4',
              coefficient: 1,
              type: '40/60',
              cc: null,
              exam: null,
            },
          ],
        },
      ],
    },
  ],
};

