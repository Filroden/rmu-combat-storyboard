const MELEE_MULTIPLIER = 1.5;
const PERIPHERY_MULTIPLIER = 6;

/**
 * Generates the Stage Layout schema for the Dense Notation Sieve.
 */
export function generateStageLayout(combat, roundNumber) {
    return {
        id: foundry.utils.randomID(),
        type: "stageLayout",
        round: roundNumber,
        zones: _calculateSemanticZones(combat.combatants),
    };
}

/**
 * Groups active combatants into distinct skirmishes and peripheral zones.
 */
function _calculateSemanticZones(combatants) {
    const tokens = combatants.map((c) => c.token?.object).filter(Boolean);
    const unassigned = new Set(tokens);
    const zones = [];
    let skirmishCount = 1;

    for (const token of tokens) {
        if (!unassigned.has(token)) continue;

        const cluster = _extractMeleeCluster(token, unassigned);

        if (cluster.length > 1 && _containsEnemies(cluster)) {
            zones.push({
                name: `Melee Skirmish ${skirmishCount++}`,
                actors: cluster.map(_formatActorName),
            });
        } else {
            cluster.forEach((t) => unassigned.add(t));
        }
    }

    const periphery = [];
    const cover = [];

    for (const token of unassigned) {
        const zoneName = _categorizeUnengagedToken(token, tokens);
        const formattedName = _formatActorName(token);

        if (zoneName === "Periphery") periphery.push(formattedName);
        else cover.push(formattedName);
    }

    if (periphery.length) zones.push({ name: "Periphery", actors: periphery });
    if (cover.length) zones.push({ name: "Distant Cover", actors: cover });

    return zones;
}

/**
 * Flat BFS to find all connected tokens within melee range of each other.
 */
function _extractMeleeCluster(startToken, unassigned) {
    const meleeRange = canvas.grid.distance * MELEE_MULTIPLIER;
    const cluster = [];
    const queue = [startToken];

    unassigned.delete(startToken);

    while (queue.length > 0) {
        const current = queue.shift();
        cluster.push(current);

        for (const other of Array.from(unassigned)) {
            if (_getDistance(current, other) <= meleeRange) {
                unassigned.delete(other);
                queue.push(other);
            }
        }
    }
    return cluster;
}

/**
 * Validates if a cluster contains hostile actors.
 */
function _containsEnemies(cluster) {
    const dispositions = new Set(cluster.map((t) => t.document.disposition));
    return dispositions.size > 1;
}

/**
 * Determines a ranged/unengaged token's zone based on distance to the nearest enemy.
 */
function _categorizeUnengagedToken(token, allTokens) {
    const enemies = allTokens.filter((t) => t.document.disposition !== token.document.disposition);
    if (enemies.length === 0) return "Periphery";

    const distances = enemies.map((e) => _getDistance(token, e));
    const nearestEnemyDist = Math.min(...distances);

    return nearestEnemyDist <= canvas.grid.distance * PERIPHERY_MULTIPLIER ? "Periphery" : "Distant Cover";
}

/**
 * Appends elevation data and active spatial statuses to a token's name.
 */
function _formatActorName(token) {
    const elevation = token.document.elevation || 0;

    // Fetch active status effects from the actor
    const statuses = token.actor?.statuses || new Set();

    const isFlying = statuses.has("fly");
    const isHovering = statuses.has("hover");
    const isBurrowing = statuses.has("burrow");

    let locomotion = "";
    if (isFlying) locomotion = "Flying";
    else if (isHovering) locomotion = "Hovering";
    else if (isBurrowing) locomotion = "Burrowing";

    // If they are on the ground and doing nothing special, return just the name
    if (elevation === 0 && !locomotion) return token.name;

    const units = canvas.scene?.grid?.units || "ft";

    if (elevation !== 0) {
        // Replace the generic "Elevated" with the specific locomotion state if they have one
        const verticalState = locomotion || (elevation > 0 ? "Elevated" : "Subterranean");
        return `${token.name} (${verticalState} ${Math.abs(elevation)}${units})`;
    }

    // They are at elevation 0, but have a status (e.g., hovering an inch off the floor)
    return `${token.name} (${locomotion})`;
}

/**
 * Calculates the true 3D Pythagorean distance between two tokens in grid units.
 */
function _getDistance(t1, t2) {
    const dx = t1.center.x - t2.center.x;
    const dy = t1.center.y - t2.center.y;
    const dist2D = (Math.hypot(dx, dy) / canvas.grid.size) * canvas.grid.distance;
    const dz = Math.abs((t1.document.elevation || 0) - (t2.document.elevation || 0));

    return Math.hypot(dist2D, dz);
}
