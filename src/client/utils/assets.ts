// Central asset management utility
import { basename } from 'path';

const ASSET_BASE_PATH = '/public/assets';

export const getAssetPath = (assetName: string): string => {
  return `${ASSET_BASE_PATH}/${basename(assetName)}`;
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
export const ASSETS = {
  logos: {
    default: getAssetPath('almanaclogo.png'),
    almanac: getAssetPath('almanaclogo.png'),
  },
  images: {
    hero: getAssetPath('hero-image.svg'),
  },
} as const;

// Type safety for asset paths
export type AssetKey = keyof typeof ASSETS;
export type LogoKey = keyof typeof ASSETS.logos;
export type ImageKey = keyof typeof ASSETS.images;
