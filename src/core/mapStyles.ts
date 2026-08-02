const MAPBOX_STYLE_LIGHT = 'mapbox://styles/mapbox/light-v11';
const MAPBOX_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';

/** Mapbox basemap used by the Dashboard theme. */
export function getDashboardMapStyle(dark?: boolean): string {
  return dark === false ? MAPBOX_STYLE_LIGHT : MAPBOX_STYLE_DARK;
}
