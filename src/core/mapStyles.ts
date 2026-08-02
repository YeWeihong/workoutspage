const MAPCN_STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/bright';
const MAPCN_STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';

/** Token-free MapCN/OpenFreeMap basemap used by the Dashboard theme. */
export function getDashboardMapStyle(dark?: boolean): string {
  return dark === false ? MAPCN_STYLE_LIGHT : MAPCN_STYLE_DARK;
}
