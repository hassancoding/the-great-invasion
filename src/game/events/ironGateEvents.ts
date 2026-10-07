export type IronGateEventId =
  | 'RECON_CONTACT'
  | 'CHECKPOINT_ATTACK'
  | 'CONVOY_DISTRESS'
  | 'REINFORCEMENTS';

export type IronGateEvent = {
  id: IronGateEventId;
  time: number;
  title: string;
  message: string;
  triggered: boolean;
};

export const IRON_GATE_EVENTS: IronGateEvent[] = [
  {
    id: 'RECON_CONTACT',
    time: 12,
    title: 'RECON CONTACT',
    message: 'Enemy movement detected beyond the eastern ridge.',
    triggered: false,
  },
  {
    id: 'CHECKPOINT_ATTACK',
    time: 38,
    title: 'NORTHERN CHECKPOINT',
    message: 'Friendly checkpoint is under pressure. Alpha can reinforce.',
    triggered: false,
  },
  {
    id: 'CONVOY_DISTRESS',
    time: 72,
    title: 'CONVOY DISTRESS',
    message: 'Supply convoy is approaching the valley. Keep the route open.',
    triggered: false,
  },
  {
    id: 'REINFORCEMENTS',
    time: 115,
    title: 'ENEMY REINFORCEMENTS',
    message: 'Enemy vehicles are moving toward the communications facility.',
    triggered: false,
  },
];
