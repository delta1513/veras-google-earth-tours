import data from "@/data/places.json";

export type Place = {
  name: string;
  url: string;
  thumbnail: string | null;
};

export type Region = {
  id: string;
  lat: number;
  lng: number;
  places: Place[];
};

export const regions: Region[] = (data as { regions: Region[] }).regions;
