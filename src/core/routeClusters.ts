import * as polyline from '@mapbox/polyline';
import type { Activity } from './types';
import { normalizeSportType } from './sports';

type Coordinate = [number, number];

interface DecodedRoute {
  coordinates: Coordinate[];
  samples: Coordinate[];
  sportType: string;
}

export interface TrackCluster {
  representative: Activity;
  count: number;
}

const EARTH_RADIUS_METERS = 6_371_000;
const SAMPLE_COUNT = 20;
const ENDPOINT_TOLERANCE_METERS = 300;
const MEAN_ROUTE_TOLERANCE_METERS = 250;
const MAX_ROUTE_TOLERANCE_METERS = 900;

function haversineDistance(a: Coordinate, b: Coordinate): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const lat1 = toRadians(a[0]);
  const lat2 = toRadians(b[0]);
  const deltaLat = toRadians(b[0] - a[0]);
  const deltaLng = toRadians(b[1] - a[1]);
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function sampleRoute(
  coordinates: Coordinate[],
  sampleCount = SAMPLE_COUNT
): Coordinate[] {
  const cumulativeDistances = [0];
  for (let index = 1; index < coordinates.length; index++) {
    cumulativeDistances.push(
      cumulativeDistances[index - 1] +
        haversineDistance(coordinates[index - 1], coordinates[index])
    );
  }

  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
  if (totalDistance === 0) return Array(sampleCount).fill(coordinates[0]);

  const samples: Coordinate[] = [];
  let coordinateIndex = 1;
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    const targetDistance =
      (totalDistance * sampleIndex) / Math.max(sampleCount - 1, 1);
    while (
      coordinateIndex < cumulativeDistances.length - 1 &&
      cumulativeDistances[coordinateIndex] < targetDistance
    ) {
      coordinateIndex++;
    }

    const startIndex = coordinateIndex - 1;
    const segmentDistance = Math.max(
      cumulativeDistances[coordinateIndex] - cumulativeDistances[startIndex],
      1
    );
    const fraction =
      (targetDistance - cumulativeDistances[startIndex]) / segmentDistance;
    const start = coordinates[startIndex];
    const end = coordinates[coordinateIndex];
    samples.push([
      start[0] + (end[0] - start[0]) * fraction,
      start[1] + (end[1] - start[1]) * fraction,
    ]);
  }
  return samples;
}

function decodeRoute(activity: Activity): DecodedRoute | null {
  if (!activity.summary_polyline) return null;
  try {
    const coordinates = polyline.decode(
      activity.summary_polyline
    ) as Coordinate[];
    if (coordinates.length < 2) return null;
    return {
      coordinates,
      samples: sampleRoute(coordinates),
      sportType: normalizeSportType(activity.type),
    };
  } catch {
    return null;
  }
}

function routesAreSimilar(
  activityA: Activity,
  routeA: DecodedRoute,
  activityB: Activity,
  routeB: DecodedRoute
): boolean {
  if (routeA.sportType !== routeB.sportType) return false;

  const distanceTolerance = Math.max(
    500,
    Math.max(activityA.distance, activityB.distance) * 0.12
  );
  if (Math.abs(activityA.distance - activityB.distance) > distanceTolerance)
    return false;

  const startA = routeA.coordinates[0];
  const endA = routeA.coordinates[routeA.coordinates.length - 1];
  const startB = routeB.coordinates[0];
  const endB = routeB.coordinates[routeB.coordinates.length - 1];
  const sameDirection =
    haversineDistance(startA, startB) < ENDPOINT_TOLERANCE_METERS &&
    haversineDistance(endA, endB) < ENDPOINT_TOLERANCE_METERS;
  const reverseDirection =
    haversineDistance(startA, endB) < ENDPOINT_TOLERANCE_METERS &&
    haversineDistance(endA, startB) < ENDPOINT_TOLERANCE_METERS;
  if (!sameDirection && !reverseDirection) return false;

  const samplesB =
    !sameDirection && reverseDirection
      ? [...routeB.samples].reverse()
      : routeB.samples;
  const sampleDistances = routeA.samples.map((point, index) =>
    haversineDistance(point, samplesB[index])
  );
  const meanDistance =
    sampleDistances.reduce((sum, distance) => sum + distance, 0) /
    sampleDistances.length;

  return (
    meanDistance < MEAN_ROUTE_TOLERANCE_METERS &&
    Math.max(...sampleDistances) < MAX_ROUTE_TOLERANCE_METERS
  );
}

export function clusterSimilarTracks(activities: Activity[]): TrackCluster[] {
  const sortedActivities = [...activities].sort(
    (a, b) =>
      new Date(b.start_date_local).getTime() -
      new Date(a.start_date_local).getTime()
  );
  const routes = sortedActivities.map(decodeRoute);
  const used = new Set<number>();
  const clusters: TrackCluster[] = [];

  for (let index = 0; index < sortedActivities.length; index++) {
    if (used.has(index) || !routes[index]) continue;
    let count = 1;

    for (
      let candidateIndex = index + 1;
      candidateIndex < sortedActivities.length;
      candidateIndex++
    ) {
      if (used.has(candidateIndex) || !routes[candidateIndex]) continue;
      if (
        routesAreSimilar(
          sortedActivities[index],
          routes[index],
          sortedActivities[candidateIndex],
          routes[candidateIndex]
        )
      ) {
        used.add(candidateIndex);
        count++;
      }
    }

    used.add(index);
    clusters.push({ representative: sortedActivities[index], count });
  }

  return clusters;
}
