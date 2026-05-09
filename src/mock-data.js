/**
 * Provides static test data for the Guided Wizard UI development.
 * * NOTE: 'round' uses decimal notation (e.g., 1.1) to represent Phase subdivisions,
 * accommodating variable phase rules in the RMU system.
 */

export const MOCK_ROSTER = [
    { id: "token_tarkus", name: "Tarkus", descriptor: "Human Fighter - Heavy chainmail, scarred face, broadsword" },
    { id: "token_elara", name: "Elara", descriptor: "Elven Rogue - Dark cloak, longbow" },
    { id: "token_brute", name: "Goblin Brute", descriptor: "Hulking green-skinned goblin - Spiked club" },
    { id: "token_mystic", name: "Goblin Mystic", descriptor: "Slender yellow-scaled goblin - Bone fetish" },
];

export const MOCK_TIMELINE = [
    {
        id: "evt_001",
        type: "stageLayout",
        round: 1.1,
        zones: [
            { name: "Melee Centre", actors: ["Tarkus", "Goblin Brute"] },
            { name: "Distant Cover", actors: ["Elara", "Goblin Mystic"] },
        ],
    },
    {
        id: "evt_002",
        type: "combatAction",
        round: 1.1,
        source: "Elara",
        target: "Goblin Mystic",
        actionType: "=>", // Ranged/Magic Action
        weapon: "Longbow",
        flair: "!!", // Strange Fate
        result: "Absolute Success",
        effect: "A-Puncture",
        systemNarrative: "Arrow pins the target's sleeve to a nearby tree perfectly. 4 hits.",
        isHighlighted: false,
    },
    {
        id: "evt_003",
        type: "combatAction",
        round: 1.2,
        source: "Goblin Brute",
        target: "Tarkus",
        actionType: "->", // Melee Action
        weapon: "Spiked Club",
        flair: "v", // Catastrophic Momentum
        result: "Blunder",
        effect: "Fumble",
        systemNarrative: "Overbalanced swing. Slips in mud, falls prone, -20 penalty.",
        isHighlighted: false,
    },
    {
        id: "evt_004",
        type: "combatAction",
        round: 1.2,
        source: "Tarkus",
        target: "Goblin Brute",
        actionType: "->",
        weapon: "Broadsword",
        flair: "^", // Explosive Force
        result: "Absolute Success",
        effect: "E-Slashing",
        systemNarrative: "Massive downward strike. Target's chest is cleaved open. Foe is instantly slain.",
        isHighlighted: false,
    },
];
