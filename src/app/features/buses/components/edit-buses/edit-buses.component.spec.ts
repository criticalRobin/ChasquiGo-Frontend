import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditBusesComponent } from './edit-buses.component';

describe('EditBusesComponent', () => {
  let component: EditBusesComponent;
  let fixture: ComponentFixture<EditBusesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBusesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditBusesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
