import * as THREE from "three";
import { WorkTimelinePoint } from "../types";

export const WORK_TIMELINE: WorkTimelinePoint[] = [
  {
    point: new THREE.Vector3(4, 0, 0),
    year: '2005',
    title: 'CEO',
    subtitle: 'Founded in Ukraine 05.07.2005',
    position: 'right',
  },
  {
    point: new THREE.Vector3(-4, -4, -3),
    year: '2020',
    title: 'Trapp Minister',
    subtitle: 'DJ. Big Boy',
    position: 'left',
  },
  {
    point: new THREE.Vector3(-3, -1, -6),
    year: '2024',
    title: 'Developer',
    subtitle: '\nSoftware Intern Developer \n 20+ projects',
    position: 'left',
  },
  {
    point: new THREE.Vector3(0, -1, -10),
    year: '2026',
    title: 'Careerist',
    subtitle: 'Member of Hustle Club',
    position: 'left',
  },
  {
    point: new THREE.Vector3(1, 1, -12),
    year: new Date().toLocaleDateString('default', { year: 'numeric' }),
    title: 'Living...',
    subtitle: 'Hobby: overthinking',
    position: 'right',
  }
]