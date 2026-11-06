import { Component, inject, input, OnChanges, OnDestroy, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
@Component({
  selector: 'app-user-avatar',
  standalone: true,
  template: `@if (photoUrl()) { <img class="avatar" [class.avatar-small]="small()" [src]="photoUrl()!" [alt]="'Fotografía de ' + name()" /> } @else { <span
    class="avatar"
    [class.avatar-small]="small()"
    [attr.aria-label]="'Inicial de ' + name()"
  >{{ name().slice(0, 1) }}</span> }`,
})
export class UserAvatarComponent implements OnChanges, OnDestroy {
  private readonly api = inject(ApiService);
  readonly name = input.required<string>();
  readonly small = input(false);
  readonly photoKey = input<string | undefined>();
  readonly photoUserId = input<string | undefined>();
  readonly photoUrl = signal<string | null>(null);
  private currentObjectUrl?: string;

  ngOnChanges(): void { void this.loadPhoto(); }
  ngOnDestroy(): void { this.clearPhoto(); }
  private async loadPhoto(): Promise<void> {
    if (!this.photoKey() || !this.api.enabled) { this.clearPhoto(); return; }
    try {
      const blob = await firstValueFrom(this.api.profilePhoto(this.photoUserId()));
      this.clearPhoto();
      this.currentObjectUrl = URL.createObjectURL(blob);
      this.photoUrl.set(this.currentObjectUrl);
    } catch { this.clearPhoto(); }
  }
  private clearPhoto(): void {
    if (this.currentObjectUrl) URL.revokeObjectURL(this.currentObjectUrl);
    this.currentObjectUrl = undefined;
    this.photoUrl.set(null);
  }
}
