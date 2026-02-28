import {
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { PermissionService } from '../services/permission.service';

interface PermissionCheck {
  modulo: string;
  accion: string;
}

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input('appHasPermission') permission?: PermissionCheck;

  private sub?: Subscription;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.render();
    this.sub = this.permissionService.permisos$.subscribe(() => this.render());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private render(): void {
    this.viewContainer.clear();

    if (!this.permission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      return;
    }

    const visible = this.permissionService.tienePermiso(
      this.permission.modulo,
      this.permission.accion
    );

    if (visible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
