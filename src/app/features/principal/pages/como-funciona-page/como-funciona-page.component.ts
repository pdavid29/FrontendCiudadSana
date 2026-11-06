import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  standalone: true,
  imports: [RouterLink],
  template: `<section class="guide-page">
    <span class="eyebrow">GUÍA CIUDADANA</span>
    <h1>¿Cómo funciona Ciudad Sana?</h1>
    <p class="lead">
      Un canal sencillo para compartir situaciones de tu entorno y conocer cómo avanzan.
    </p>
    <div class="guide-grid">
      <article>
        <span>1</span>
        <h2>Crea tu espacio</h2>
        <p>
          Regístrate con tu nombre y correo. Tu cuenta ciudadana te permite consultar tus propios
          reportes.
        </p>
      </article>
      <article>
        <span>2</span>
        <h2>Describe la situación</h2>
        <p>
          Elige una categoría, escribe una descripción clara y ubica el lugar. Puedes indicar
          evidencias disponibles.
        </p>
      </article>
      <article>
        <span>3</span>
        <h2>Consulta el historial</h2>
        <p>
          En cada reporte verás cambios de estado y observaciones compartidas durante la atención.
        </p>
      </article>
    </div>
    <div class="notice-box">
      <strong>Protección de la información</strong>
      <p>
        Tu cuenta y tus reportes se gestionan desde la plataforma Ciudad Sana. Comparte únicamente
        la información necesaria para atender la situación.
      </p>
    </div>
    <a class="button button-primary" routerLink="/registro"
      >Crear cuenta ciudadana <span>→</span></a
    >
  </section>`,
})
export class ComoFuncionaPageComponent {}
