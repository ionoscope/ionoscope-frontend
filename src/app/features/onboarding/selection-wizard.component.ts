import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Role, Selection, StationInfo } from '../../core/api/api.models';
import { ROLES } from '../../core/config/roles';
import { CatalogStore } from '../../state/catalog.store';
import { IconComponent } from '../../shared/ui/icon.component';

@Component({
  selector: 'app-selection-wizard',
  imports: [IconComponent, CdkScrollable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './selection-wizard.component.html',
})
export class SelectionWizardComponent {
  readonly initial = input<Selection | null>(null);
  readonly startStep = input(0);
  readonly editing = input(false);
  readonly singleField = input(false);
  readonly complete = output<Selection>();
  readonly cancelled = output<void>();
  readonly catalog = inject(CatalogStore);
  readonly roles = ROLES;
  readonly step = signal(0);
  readonly role = signal<Role | null>(null);
  readonly stations = signal<string[]>([]);
  readonly parameter = signal('foF2');
  readonly search = signal('');
  private readonly initialization = effect(() => {
    const initial = this.initial();
    this.step.set(this.startStep());
    this.role.set(initial?.role ?? null);
    this.stations.set(initial ? [...initial.stations] : []);
    this.parameter.set(initial?.parameter ?? 'foF2');
  });
  private readonly loading = this.catalog.load();
  readonly filteredStations = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('ru');
    return this.catalog
      .stations()
      .filter((s) => `${s.code} ${s.name}`.toLocaleLowerCase('ru').includes(query));
  });
  readonly validStations = computed(
    () =>
      this.stations().length >= 1 &&
      this.stations().length <= 5 &&
      this.stations().every((code) =>
        this.catalog.stations().some((s) => s.code === code && s.active),
      ),
  );
  readonly validParameter = computed(() =>
    this.catalog.parameters().some((p) => p.id === this.parameter() && p.available),
  );
  readonly canContinue = computed(() =>
    this.step() === 0
      ? this.role() !== null
      : this.step() === 1
        ? this.validStations()
        : this.singleField()
          ? this.validParameter()
          : this.role() !== null && this.validStations() && this.validParameter(),
  );
  toggle(station: StationInfo): void {
    if (!station.active && !this.stations().includes(station.code)) return;
    this.stations.update((list) =>
      list.includes(station.code)
        ? list.filter((code) => code !== station.code)
        : list.length < 5
          ? [...list, station.code]
          : list,
    );
  }
  next(): void {
    if (!this.canContinue()) return;
    if (this.singleField()) {
      const initial = this.initial();
      if (!initial) return;
      if (this.step() === 0) {
        const role = this.role();
        if (role) this.complete.emit({ ...initial, role });
      } else if (this.step() === 1)
        this.complete.emit({ ...initial, stations: [...this.stations()] });
      else this.complete.emit({ ...initial, parameter: this.parameter() });
      return;
    }
    if (this.step() < 2) this.step.update((step) => step + 1);
    else {
      const role = this.role();
      if (role)
        this.complete.emit({ role, stations: this.stations(), parameter: this.parameter() });
    }
  }
  roleKey(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const focused = event.currentTarget instanceof HTMLElement ? event.currentTarget.id : '';
    const current = this.roles.findIndex((r) => `role-${r.id}` === focused);
    const delta = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1;
    const role = this.roles[(current + delta + this.roles.length) % this.roles.length];
    if (role) {
      this.role.set(role.id);
      document.getElementById(`role-${role.id}`)?.focus();
    }
  }
}
