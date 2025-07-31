export interface PlotLocation {
  id: string;
  address: string;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  familyId?: string; // Associated family ID if known
  notes?: string;
}

export interface ImageMapConfig {
  imageUrl: string;
  imageAlt: string;
  plots: PlotLocation[];
}

export interface PlotWithFamily extends PlotLocation {
  family?: {
    id: string;
    name: string;
    members: Array<{
      name: string;
      age: number;
      birthdate: string;
    }>;
    address: string;
    phone?: string;
    email?: string;
  };
} 