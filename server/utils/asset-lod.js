import fs from "fs";
import path from "path";

const LOD_SLOT_REGEX = /^lod(\d+)$/i;
const LOD_FILE_REGEX = /-lod(\d+)$/i;

export function parseLodLevel(input, defaultLevel = 0) {
    if (input === undefined || input === null || input === "") return defaultLevel;

    if (typeof input === "number" && Number.isInteger(input) && input >= 0) {
        return input;
    }

    if (typeof input !== "string") {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid lod parameter",
        });
    }

    const normalized = input.trim().toLowerCase();
    if (/^\d+$/.test(normalized)) {
        return Number.parseInt(normalized, 10);
    }

    const slotMatch = normalized.match(LOD_SLOT_REGEX);
    if (slotMatch) {
        return Number.parseInt(slotMatch[1], 10);
    }

    throw createError({
        statusCode: 400,
        statusMessage: "Invalid lod parameter",
    });
}

export function buildLodFilename(assetId, level = 0) {
    return `${assetId}-lod${level}`;
}

export function getLegacyLod0Filename(assetId) {
    return assetId;
}

export function getLod0FilenameCandidates(assetId) {
    return [buildLodFilename(assetId, 0), getLegacyLod0Filename(assetId)];
}

function parseLodLevelFromFilename(filename, assetId) {
    if (filename === assetId) return 0;
    if (!filename.startsWith(`${assetId}-lod`)) return null;

    const match = filename.match(LOD_FILE_REGEX);
    if (!match) return null;

    return Number.parseInt(match[1], 10);
}

export function scanAvailableLodLevels(directory, assetId) {
    const available = new Set();

    if (!fs.existsSync(directory)) return [];

    for (const candidate of getLod0FilenameCandidates(assetId)) {
        if (fs.existsSync(path.join(directory, candidate))) {
            available.add(0);
        }
    }

    const names = fs.readdirSync(directory);
    for (const name of names) {
        const level = parseLodLevelFromFilename(name, assetId);
        if (level === null) continue;
        available.add(level);
    }

    return Array.from(available).sort((a, b) => a - b);
}

export function resolveBestLodFile(directory, assetId, requestedLevel = 0) {
    const available = scanAvailableLodLevels(directory, assetId);
    if (!available.length) return null;

    const lowerOrEqual = available.filter((level) => level <= requestedLevel);
    const selectedLevel = lowerOrEqual.length > 0
        ? Math.max(...lowerOrEqual)
        : Math.min(...available);

    if (selectedLevel === 0) {
        for (const candidate of getLod0FilenameCandidates(assetId)) {
            const absolutePath = path.join(directory, candidate);
            if (fs.existsSync(absolutePath)) {
                return { absolutePath, filename: candidate, selectedLevel, availableLevels: available };
            }
        }
        return null;
    }

    const filename = buildLodFilename(assetId, selectedLevel);
    const absolutePath = path.join(directory, filename);
    if (!fs.existsSync(absolutePath)) return null;

    return { absolutePath, filename, selectedLevel, availableLevels: available };
}
