/**
 * Terrain types and their properties.
 * Terrains can obscure sight and sound (from their numeric value), 
 * and can be traversable or not (from their name).
 */
export enum Terrain {
    Open = 0,
    DimSight = 1,
    PartialSight = 2,
    BlockSight = DimSight + PartialSight,
    DimSound = 4,
    PartialSound = 8,
    BlockSound = DimSound + PartialSound,
    BlockBoth = BlockSight + BlockSound,
    Water = 16,
    Shrubbery = 32 + BlockSight + DimSound,
    Glass = 64 + PartialSound,
    Curtain = 128 + PartialSight,
    Wall = 256 + BlockBoth,
}

/**
 * Amount of sight attenuation for a given terrain type.
 * Sight attenuation is the fraction of sight that is not blocked.
 * @param t terrain type
 * @returns fraction of 1
 */
export function sightAttenuation(t : Terrain) : number {
    if (t & Terrain.BlockSight) return 0;
    if (t & Terrain.DimSight) return 0.3;
    if (t & Terrain.PartialSight) return 0.6;
    return 0.9;
}

/**
 * Amount of sound attenuation for a given terrain type.
 * Sound attenuation is the fraction of sound that is not blocked.
 * @param t terrain type
 * @returns fraction of 1
 */
export function soundAttenuation(t : Terrain) : number {
    if (t & Terrain.BlockSound) return 0;
    if (t & Terrain.DimSound) return 0.3;
    if (t & Terrain.PartialSound) return 0.6;
    return 0.9;
}