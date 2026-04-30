import rawData from './bahratal.json';

export interface Route {
  number: string;
  name: string;
  grade: string;
  grade_normalized: string;
  grade_sort: number;
  grade_group: string;
  description: string;
  first_ascent: string;
}

export interface Block {
  number: string;
  name: string;
  lat: number | null;
  lng: number | null;
  gps_url: string;
  images: string[];
  route_count: number;
  routes: Route[];
}

export interface Sector {
  name: string;
  number: number;
  parking_gps: string;
  description: string;
  center_lat: number;
  center_lng: number;
  block_count: number;
  route_count: number;
  grade_distribution: Record<string, number>;
  blocks: Block[];
}

export interface AreaData {
  area: {
    name: string;
    description: string;
    description_de: string;
    main_parking: string;
    accommodation: {
      name: string;
      address: string;
      gps: string;
      website: string;
      notes: string;
    };
    center_lat: number;
    center_lng: number;
  };
  sectors: Sector[];
}

export const data: AreaData = rawData as AreaData;

export const GRADE_GROUPS = ['4-5', '6a', '6b', '6c', '7a', '7b', '7c', '8a', '8b+'] as const;
export type GradeGroup = (typeof GRADE_GROUPS)[number];

export const GRADE_COLORS: Record<string, string> = {
  '4-5': '#22c55e',
  '6a': '#84cc16',
  '6b': '#eab308',
  '6c': '#f97316',
  '7a': '#ef4444',
  '7b': '#dc2626',
  '7c': '#9333ea',
  '8a': '#6d28d9',
  '8b+': '#1e1b4b',
  'Unknown': '#78716c',
};

export const SECTOR_COLORS: Record<string, string> = {
  "BG'S": '#ef4444',
  "Erbstoll'n": '#f97316',
  'Fuck': '#eab308',
  'Gulag': '#22c55e',
  'Hammertor': '#14b8a6',
  'Kleine Bastei': '#0ea5e9',
  'Maibaumwand': '#6366f1',
  'Muerte': '#8b5cf6',
  'Schlachthof': '#ec4899',
  'The First': '#f43f5e',
  'Wasserfall': '#06b6d4',
};

export function getSector(slug: string): Sector | undefined {
  return data.sectors.find(s => slugify(s.name) === slug);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['´`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getGradeDistribution(routes: Route[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const r of routes) {
    const g = r.grade_group || 'Unknown';
    dist[g] = (dist[g] || 0) + 1;
  }
  return dist;
}

export function getAllRoutes(): (Route & { sectorName: string; blockName: string; sectorSlug: string })[] {
  const routes: (Route & { sectorName: string; blockName: string; sectorSlug: string })[] = [];
  for (const sector of data.sectors) {
    for (const block of sector.blocks) {
      for (const route of block.routes) {
        routes.push({
          ...route,
          sectorName: sector.name,
          blockName: block.name,
          sectorSlug: slugify(sector.name),
        });
      }
    }
  }
  return routes;
}

export function getAllBlocks(): (Block & { sectorName: string; sectorSlug: string })[] {
  const blocks: (Block & { sectorName: string; sectorSlug: string })[] = [];
  for (const sector of data.sectors) {
    for (const block of sector.blocks) {
      blocks.push({
        ...block,
        sectorName: sector.name,
        sectorSlug: slugify(sector.name),
      });
    }
  }
  return blocks;
}
