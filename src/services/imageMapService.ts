import { db } from '@/firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where 
} from 'firebase/firestore';
import type { PlotLocation, ImageMapConfig, PlotWithFamily } from '@/types/image-map';
import type { FamilyWithMembers } from '@/types/family';

const COLLECTION_NAME = 'imageMap';

export class ImageMapService {
  // Get all plot locations
  static async getPlotLocations(): Promise<PlotLocation[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const plots: PlotLocation[] = [];
      querySnapshot.forEach((doc) => {
        plots.push({ id: doc.id, ...doc.data() } as PlotLocation);
      });
      return plots;
    } catch (error) {
      console.error('Error fetching plot locations:', error);
      throw error;
    }
  }

  // Get a single plot location
  static async getPlotLocation(id: string): Promise<PlotLocation | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as PlotLocation;
      }
      return null;
    } catch (error) {
      console.error('Error fetching plot location:', error);
      throw error;
    }
  }

  // Save a plot location
  static async savePlotLocation(plot: Omit<PlotLocation, 'id'>): Promise<string> {
    try {
      const docRef = doc(collection(db, COLLECTION_NAME));
      const plotWithId = { ...plot, id: docRef.id };
      await setDoc(docRef, plot);
      return docRef.id;
    } catch (error) {
      console.error('Error saving plot location:', error);
      throw error;
    }
  }

  // Update a plot location
  static async updatePlotLocation(id: string, updates: Partial<PlotLocation>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating plot location:', error);
      throw error;
    }
  }

  // Delete a plot location
  static async deletePlotLocation(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting plot location:', error);
      throw error;
    }
  }

  // Get plots with associated family data
  static async getPlotsWithFamilies(families: FamilyWithMembers[]): Promise<PlotWithFamily[]> {
    try {
      const plots = await this.getPlotLocations();
      const plotsWithFamilies: PlotWithFamily[] = plots.map(plot => {
        const family = families.find(f => f.id === plot.familyId);
        return {
          ...plot,
          family: family ? {
            id: family.id,
            name: family.headOfHousehold,
            members: family.members.map(member => ({
              name: member.preferredName,
              age: member.age,
              birthdate: member.birthDate
            })),
            address: family.address || '',
            phone: family.members[0]?.individualPhone,
            email: family.members[0]?.individualEmail
          } : undefined
        };
      });
      return plotsWithFamilies;
    } catch (error) {
      console.error('Error fetching plots with families:', error);
      throw error;
    }
  }



  // Get image map configuration
  static async getImageMapConfig(): Promise<ImageMapConfig | null> {
    try {
      const docRef = doc(db, 'config', 'imageMap');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as ImageMapConfig;
      }
      return null;
    } catch (error) {
      console.error('Error fetching image map config:', error);
      throw error;
    }
  }

  // Save image map configuration
  static async saveImageMapConfig(config: ImageMapConfig): Promise<void> {
    try {
      const docRef = doc(db, 'config', 'imageMap');
      await setDoc(docRef, config);
    } catch (error) {
      console.error('Error saving image map config:', error);
      throw error;
    }
  }
} 