import { Component } from '@angular/core';
@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="site-footer">
      <div class="footer-inner">
        <div>
          <strong>Ciudad Sana</strong>
          <p>Una ciudad mejor también comienza con tu voz.</p>
        </div>
        <div class="footer-right">
          <span>Derechos reservados</span><span>© 2026 Ciudad Sana</span>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
