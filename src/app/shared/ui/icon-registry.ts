export interface IconGeometry {
  paths: string[];
  circles: Record<string, string>[];
  rects: Record<string, string>[];
  lines: Record<string, string>[];
  polylines: Record<string, string>[];
}
export const ICONS: Record<string, IconGeometry> = {
  clock: {
    paths: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  plus: {
    paths: ['M12 5v14M5 12h14'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  close: {
    paths: ['M18 6 6 18', 'm6 6 12 12'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  arrow: {
    paths: ['m5 12 7-7 7 7', 'M12 19V5'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  sidebar: {
    paths: ['m11 17-5-5 5-5', 'm18 17-5-5 5-5'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  sun: {
    paths: [
      'M12 2v2',
      'M12 20v2',
      'm4.93 4.93 1.41 1.41',
      'm17.66 17.66 1.41 1.41',
      'M2 12h2',
      'M20 12h2',
      'm6.34 17.66-1.41 1.41',
      'm19.07 4.93-1.41 1.41',
    ],
    circles: [
      {
        cx: '12',
        cy: '12',
        r: '4',
      },
    ],
    rects: [],
    lines: [],
    polylines: [],
  },
  moon: {
    paths: ['M20 13a8 8 0 0 1-9-9 8.5 8.5 0 1 0 9 9'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  check: {
    paths: ['M20 6 9 17l-5-5'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  globe: {
    paths: ['M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20', 'M2 12h20'],
    circles: [
      {
        cx: '12',
        cy: '12',
        r: '10',
      },
    ],
    rects: [],
    lines: [],
    polylines: [],
  },
  download: {
    paths: ['M12 15V3', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  expand: {
    paths: ['M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  trash: {
    paths: [
      'M10 11v6',
      'M14 11v6',
      'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
      'M3 6h18',
      'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    ],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  search: {
    paths: ['m21 21-4.34-4.34'],
    circles: [
      {
        cx: '11',
        cy: '11',
        r: '8',
      },
    ],
    rects: [],
    lines: [],
    polylines: [],
  },
  chevron: {
    paths: ['m9 18 6-6-6-6'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  signal: {
    paths: ['M3 17h2v4H3zM9 12h2v9H9zM15 7h2v14h-2zM21 3v18'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  refresh: {
    paths: [
      'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
      'M21 3v5h-5',
      'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16',
      'M8 16H3v5',
    ],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  calendar: {
    paths: [
      'M8 2v3',
      'M16 2v3',
      'M3 9h18',
      'M8 13h.01',
      'M12 13h.01',
      'M16 13h.01',
      'M8 17h.01',
      'M12 17h.01',
      'M16 17h.01',
    ],
    circles: [],
    rects: [
      {
        height: '18',
        rx: '2',
        width: '18',
        x: '3',
        y: '3',
      },
    ],
    lines: [],
    polylines: [],
  },
  bell: {
    paths: [
      'M10.268 21a2 2 0 0 0 3.464 0',
      'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326',
    ],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  settings: {
    paths: [
      'M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915',
    ],
    circles: [
      {
        cx: '12',
        cy: '12',
        r: '3',
      },
    ],
    rects: [],
    lines: [],
    polylines: [],
  },
  dots: {
    paths: [],
    circles: [
      {
        cx: '12',
        cy: '12',
        r: '1',
      },
      {
        cx: '19',
        cy: '12',
        r: '1',
      },
      {
        cx: '5',
        cy: '12',
        r: '1',
      },
    ],
    rects: [],
    lines: [],
    polylines: [],
  },
  'dots-vertical': {
    paths: [],
    circles: [
      {
        cx: '12',
        cy: '12',
        r: '1',
      },
      {
        cx: '12',
        cy: '5',
        r: '1',
      },
      {
        cx: '12',
        cy: '19',
        r: '1',
      },
    ],
    rects: [],
    lines: [],
    polylines: [],
  },
  sort: {
    paths: ['m21 16-4 4-4-4', 'M17 20V4', 'm3 8 4-4 4 4', 'M7 4v16'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  info: {
    paths: ['M12 16v-4', 'M12 8h.01'],
    circles: [
      {
        cx: '12',
        cy: '12',
        r: '10',
      },
    ],
    rects: [],
    lines: [],
    polylines: [],
  },
  warning: {
    paths: [
      'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
      'M12 9v4',
      'M12 17h.01',
    ],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  error: {
    paths: [],
    circles: [
      {
        cx: '12',
        cy: '12',
        r: '10',
      },
    ],
    rects: [],
    lines: [
      {
        x1: '12',
        x2: '12',
        y1: '8',
        y2: '12',
      },
      {
        x1: '12',
        x2: '12.01',
        y1: '16',
        y2: '16',
      },
    ],
    polylines: [],
  },
  success: {
    paths: ['m16 9-5.5 5.5L8 12'],
    circles: [
      {
        cx: '12',
        cy: '12',
        r: '10',
      },
    ],
    rects: [],
    lines: [],
    polylines: [],
  },
  offline: {
    paths: [
      'M12 20h.01',
      'M8.5 16.429a5 5 0 0 1 7 0',
      'M5 12.859a10 10 0 0 1 5.17-2.69',
      'M19 12.859a10 10 0 0 0-2.007-1.523',
      'M2 8.82a15 15 0 0 1 4.177-2.643',
      'M22 8.82a15 15 0 0 0-11.288-3.764',
      'm2 2 20 20',
    ],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  server: {
    paths: [
      'M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2',
      'M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2',
      'M6 6h.01',
      'M6 18h.01',
      'm13 6-4 6h6l-4 6',
    ],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  home: {
    paths: [
      'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8',
      'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    ],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  edit: {
    paths: [
      'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
      'm15 5 4 4',
    ],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  copy: {
    paths: ['M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
    circles: [],
    rects: [
      {
        x: '9',
        y: '9',
        width: '13',
        height: '13',
        rx: '2',
      },
    ],
    lines: [],
    polylines: [],
  },
  prev: {
    paths: ['m15 18-6-6 6-6'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  next: {
    paths: ['m9 18 6-6-6-6'],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  wave: {
    paths: [],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  ionoscope: {
    paths: [],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
  llm: {
    paths: [],
    circles: [],
    rects: [],
    lines: [],
    polylines: [],
  },
};
