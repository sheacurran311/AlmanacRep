// Central asset management utility
import { basename } from 'path';

const ASSET_BASE_PATH = '/assets';

interface AssetRegistry {
  logos: {
    default: string;
    almanac: string;
    placeholder: string;
  };
  images: {
    hero: string;
  };
}

export const getAssetPath = (assetName: string): string => {
  // Strip any leading slashes from the asset name
  const cleanAssetName = assetName.replace(/^\/+/, '');
  return `${ASSET_BASE_PATH}/${cleanAssetName}`;
};

export const validateAssetExists = async (assetPath: string): Promise<boolean> => {
  try {
    const response = await fetch(assetPath);
    return response.ok;
  } catch {
    return false;
  }
};

// Asset registry for better management and preloading
export const ASSETS: AssetRegistry = {
  logos: {
    default: getAssetPath('almanaclogo.svg'),
    almanac: getAssetPath('almanaclogo.svg'),
    placeholder: getAssetPath('placeholder-logo.svg'),
  },
  images: {
    hero: getAssetPath('hero-image.svg'),
  },
} as const;

// Type safety for asset paths
export type AssetKey = keyof typeof ASSETS;
export type LogoKey = keyof typeof ASSETS.logos;
export type ImageKey = keyof typeof ASSETS.images;

// Utility function to check if a key exists in the asset registry
export const isValidAssetKey = (key: string, category: keyof AssetRegistry): boolean => {
  return key in ASSETS[category];
};
