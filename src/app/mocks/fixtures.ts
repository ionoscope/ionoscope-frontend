import {
  ForecastRequest,
  ForecastResponse,
  ParameterInfo,
  Role,
  StationInfo,
} from '../core/api/api.models';

export const MOCK_STATIONS: StationInfo[] = [
  { code: 'TR169', name: 'Тромсё', lat: 69.6, lon: 19.2, active: true, freshness_status: 'fresh' },
  {
    code: 'MOCK1',
    name: 'Северная станция · мок',
    lat: 62.1,
    lon: 35.4,
    active: true,
    freshness_status: 'fresh',
    mock: true,
  },
  {
    code: 'MOCK2',
    name: 'Восточная станция · мок',
    lat: 54.3,
    lon: 84.9,
    active: true,
    freshness_status: 'stale',
    mock: true,
  },
];
export const MOCK_PARAMETERS: ParameterInfo[] = [
  { id: 'foF2', label: 'Критическая частота слоя F2', unit: 'MHz', available: true },
  { id: 'MUF', label: 'Максимальная применимая частота', unit: 'MHz', available: false },
  { id: 'TEC', label: 'Полное электронное содержание', unit: 'TECU', available: false },
];
export function mockMode(): string {
  return new URLSearchParams(location.search).get('mock') ?? '';
}
export function mockForecast(
  request: ForecastRequest,
  now = Date.now(),
  mode = mockMode(),
): ForecastResponse {
  const step = 15 * 60_000;
  const end = Math.floor(now / step) * step - step;
  const offset = request.station === 'MOCK1' ? 0.6 : request.station === 'MOCK2' ? -0.4 : 0;
  const observed = Array.from({ length: 97 }, (_, i) => ({
    t: new Date(end - (96 - i) * step).toISOString(),
    value:
      i === 31 || i === 32 || i === 68
        ? null
        : Number((5.7 + offset + 1.2 * Math.sin(i / 15 - 1) + 0.15 * Math.sin(i * 1.9)).toFixed(3)),
  }));
  const prediction = Number(((observed[96]?.value ?? 5.7) + 0.12).toFixed(3));
  const target = mode === 'expired' ? now - step : end + 2 * step;
  const forecast = [
    {
      t_start: new Date(target - step).toISOString(),
      t_end: new Date(target).toISOString(),
      value: prediction,
      lower: null,
      upper: null,
    },
  ];
  return {
    ...request,
    forecast_id: `${request.station}_${crypto.randomUUID().replaceAll('-', '')}`,
    unit: 'MHz',
    horizon: '15min',
    prediction,
    source_timestamp: new Date(end).toISOString(),
    forecast_interval_start: forecast[0]?.t_start ?? '',
    forecast_timestamp: new Date(target).toISOString(),
    observation_timestamp: new Date(end + 10 * 60_000).toISOString(),
    generated_at: new Date(now).toISOString(),
    model: 'HistGradientBoostingRegressor',
    model_version: '0.2.0 · мок',
    cached: false,
    freshness_status: mode === 'expired' ? 'expired' : mode === 'stale' ? 'stale' : 'fresh',
    freshness_message:
      mode === 'stale'
        ? 'Наблюдения поступают с задержкой. Учитывайте это при работе с прогнозом.'
        : null,
    stale_after: new Date(mode === 'stale' ? now - 5 * 60_000 : end + 30 * 60_000).toISOString(),
    valid_until: new Date(target).toISOString(),
    series: { step_minutes: 15, observed, forecast },
    table: {
      columns: [
        { key: 'time', label: 'Время (UTC)', unit: null },
        { key: 'kind', label: 'Тип', unit: null },
        { key: 'foF2', label: 'foF2 (MHz)', unit: 'MHz' },
      ],
      rows: [
        ...observed.map((p) => ({ time: p.t, kind: 'observed', foF2: p.value })),
        { time: new Date(target).toISOString(), kind: 'forecast', foF2: prediction },
      ],
    },
    explanation: null,
  };
}
export const MOCK_EXPLANATIONS: Record<Role, string> = {
  drone_pilot:
    'По точечному прогнозу критическая частота слоя F2 изменится незначительно. Для пилота БПЛА это дополнительный контекст о состоянии ионосферы, а не оценка надёжности конкретного канала управления или GNSS. Перед полётом проверьте навигацию, связь и действующие ограничения. Прогноз не является разрешением на полёт.',
  geodesist:
    'Модель прогнозирует плавное изменение критической частоты слоя F2 в ближайшие 15 минут. foF2 характеризует слой F2 и не заменяет измерение полного электронного содержания или оценку погрешности GNSS. При геодезических работах сверяйтесь с качеством поправок и контрольными измерениями. Это точечная оценка без интервала неопределённости.',
  aviation_emergency:
    'Прогноз показывает ожидаемое состояние слоя F2 на ближайший интервал. Критическая частота foF2 сама по себе не определяет пригодность конкретной КВ-трассы: нужны геометрия трассы и дополнительные данные. Для оперативной работы используйте утверждённые процедуры и резервные каналы связи. Прогноз не гарантирует доступность связи.',
};
