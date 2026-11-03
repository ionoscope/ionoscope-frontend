import { Role } from '../api/api.models';
export const ROLES: { id: Role; label: string; description: string; symbol: string }[] = [
  {
    id: 'drone_pilot',
    label: 'Пилот БПЛА',
    description: 'Условия радиосвязи и навигации для планирования полётов.',
    symbol: '',
  },
  {
    id: 'geodesist',
    label: 'Геодезист',
    description: 'Состояние ионосферы для спутниковых измерений.',
    symbol: '',
  },
  {
    id: 'aviation_emergency',
    label: 'Авиация / экстренные службы',
    description: 'Контекст для дальней радиосвязи и оперативной работы.',
    symbol: '',
  },
];
export function roleLabel(role: Role): string {
  return ROLES.find((r) => r.id === role)?.label ?? role;
}
