import { Terrain } from '../../client/Terrain';

describe('terrain values', () => {
    it('should have correct terrain values', () => {
        expect(Terrain.Open).toBe(0);
        expect(Terrain.DimSight).toBe(1);
        expect(Terrain.PartialSight).toBe(2);
        expect(Terrain.BlockSight).toBe(3);
        expect(Terrain.DimSound).toBe(4);
        expect(Terrain.PartialSound).toBe(8);
        expect(Terrain.BlockSound).toBe(12);
        expect(Terrain.BlockBoth).toBe(15);
        expect(Terrain.Water).toBe(16);
        expect(Terrain.Shrubbery).toBe(39);
        expect(Terrain.Glass).toBe(72);
        expect(Terrain.Curtain).toBe(130);
        expect(Terrain.Wall).toBe(271);
    });
});