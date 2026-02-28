// ── Simple Reference Family Tree (Kerala Theme) ──────────────────────────────
// This is a minimal, easy-to-understand reference tree showing 3 generations
// (Grandparents → Parents/Uncles → Kids/Cousins) with a Kerala cultural context.
// It demonstrates:
//  - Yellow glow around the "You" node
//  - Spouses connected to parents
//  - Sibling & Cousin relationships
// This example is loaded in 'Reference Mode' and does not overwrite real data.

export const exampleFamilyData = {
    people: [

        // ══════════════════════════════════════════════════════
        // GENERATION 1 — Grandparents (Mutthashan & Mutthashi)
        // ══════════════════════════════════════════════════════
        {
            id: 'ex-gf01', firstName: 'Madhavan', middleName: 'Kutty', lastName: 'P.',
            nickname: 'Madhavettan', gender: 'male',
            birthYear: 1942, deathYear: 2018,
            parentIds: [], spouseIds: ['ex-gm01'],
            notes: 'Retired school headmaster. Loved reading Malayalam literature.',
            photoUrl: '',
        },
        {
            id: 'ex-gm01', firstName: 'Saraswathi', lastName: 'T.',
            nickname: 'Ammamma', gender: 'female',
            birthYear: 1948, deathYear: null,
            parentIds: [], spouseIds: ['ex-gf01'],
            notes: 'Makes the best Palada Payasam in the family.',
            photoUrl: '',
        },

        // ══════════════════════════════════════════════════════
        // GENERATION 2 — Parents & Uncle (Achan, Amma, Maman)
        // ══════════════════════════════════════════════════════
        {
            id: 'ex-m01', firstName: 'Latha', middleName: '', lastName: 'Madhavan',
            nickname: 'Amma', gender: 'female',
            birthYear: 1972, deathYear: null,
            parentIds: ['ex-gf01', 'ex-gm01'], spouseIds: ['ex-f01'],
            notes: 'Bank manager. Grew up in Palakkad.',
            photoUrl: '',
        },
        {
            id: 'ex-f01', firstName: 'Sunil', lastName: 'Kumar',
            nickname: 'Achan', gender: 'male',
            birthYear: 1968, deathYear: null,
            parentIds: [], spouseIds: ['ex-m01'],
            notes: 'Civil engineer working in the Middle East.',
            photoUrl: '',
        },
        {
            id: 'ex-uncle01', firstName: 'Rajesh', lastName: 'Madhavan',
            nickname: 'Rajeshettan (Maman)', gender: 'male',
            birthYear: 1976, deathYear: null,
            parentIds: ['ex-gf01', 'ex-gm01'], spouseIds: ['ex-aunt01'],
            notes: 'Latha\'s younger brother. Runs a business in Kochi.',
            photoUrl: '',
        },
        {
            id: 'ex-aunt01', firstName: 'Priya', middleName: 'Kumari', lastName: 'V.',
            nickname: 'Priya Mami', gender: 'female',
            birthYear: 1974, deathYear: null,
            parentIds: [], spouseIds: ['ex-uncle01'],
            notes: 'Ayurvedic doctor.',
            photoUrl: '',
        },

        // ══════════════════════════════════════════════════════
        // GENERATION 3 — You, Siblings & Cousins
        // ══════════════════════════════════════════════════════
        {
            id: 'ex-you', firstName: 'Abhijith', middleName: 'Narayanan', lastName: 'Sunil',
            nickname: 'You', gender: 'male',
            birthYear: 1998, deathYear: null,
            parentIds: ['ex-f01', 'ex-m01'], spouseIds: [],
            notes: 'Software developer, building this family tree!',
            photoUrl: '',
        },
        {
            id: 'ex-sib01', firstName: 'Meera', lastName: 'Sunil',
            nickname: 'Meerakutty', gender: 'female',
            birthYear: 2002, deathYear: null,
            parentIds: ['ex-f01', 'ex-m01'], spouseIds: [],
            notes: 'Currently in college studying architecture.',
            photoUrl: '',
        },
        // Cousin (Uncle's child)
        {
            id: 'ex-cousin01', firstName: 'Rahul', lastName: 'Rajesh',
            nickname: 'Unni', gender: 'male',
            birthYear: 2005, deathYear: null,
            parentIds: ['ex-uncle01', 'ex-aunt01'], spouseIds: [],
            notes: 'Talented continuous Chenda player.',
            photoUrl: '',
        },
    ],
};
