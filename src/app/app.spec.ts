import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('places all showcase fields in shared responsive grids', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    for (const selector of [
      'app-input',
      'app-money-input',
      'app-date-picker',
      'app-select',
      'app-autocomplete',
    ]) {
      expect(
        compiled.querySelector(selector)?.parentElement?.classList.contains('field-grid'),
      ).toBe(true);
    }
  });

  it('should render the UI kit showcase', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-button')).toBeTruthy();
    expect(compiled.querySelector('app-spinner')).toBeTruthy();
    expect(compiled.querySelector('app-input')).toBeTruthy();
    expect(compiled.querySelector('app-select')).toBeTruthy();
    expect(compiled.querySelector('app-autocomplete')).toBeTruthy();
  });
});
