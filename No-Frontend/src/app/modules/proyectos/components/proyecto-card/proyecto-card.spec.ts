import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProyectoCard } from './proyecto-card';

describe('ProyectoCard', () => {
  let component: ProyectoCard;
  let fixture: ComponentFixture<ProyectoCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProyectoCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProyectoCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
