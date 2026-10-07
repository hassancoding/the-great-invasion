export type VehicleKind = 'APC' | 'TRUCK' | 'HELICOPTER';

export type BattlefieldVehicle = {
  id: string;
  kind: VehicleKind;
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number;
  route: number;
  alive: boolean;
};

export const INITIAL_VEHICLES: BattlefieldVehicle[] = [
  { id: 'convoy-1', kind: 'TRUCK', x: -72, y: 1, z: 52, heading: 0, speed: 7, route: 0, alive: true },
  { id: 'convoy-2', kind: 'TRUCK', x: -84, y: 1, z: 52, heading: 0, speed: 7, route: 0, alive: true },
  { id: 'apc-alpha', kind: 'APC', x: -20, y: 1, z: 48, heading: 0, speed: 4, route: 1, alive: true },
  { id: 'apc-enemy', kind: 'APC', x: 68, y: 1, z: -36, heading: Math.PI, speed: 3.5, route: 2, alive: true },
  { id: 'heli-1', kind: 'HELICOPTER', x: -70, y: 30, z: -70, heading: 0, speed: 14, route: 3, alive: true },
];
