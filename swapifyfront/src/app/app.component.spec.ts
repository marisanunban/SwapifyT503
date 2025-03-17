import { TestBed } from '@angular/core/testing';
import { LoginRegisterComponent } from './login-register/login-register.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginRegisterComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(LoginRegisterComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'PruebaDiseno' title`, () => {
    const fixture = TestBed.createComponent(LoginRegisterComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('PruebaDiseno');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(LoginRegisterComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, PruebaDiseno');
  });
});
