import { createContext } from 'react';
import type { Waypoint } from '../types';

type WaypointUpdater = Waypoint[] | ((prev: Waypoint[]) => Waypoint[]);

/** Called by LabeledEdge to update waypoints without bypassing useEdgesState */
export const EdgeUpdateContext = createContext<(edgeId: string, updater: WaypointUpdater) => void>(() => {});
