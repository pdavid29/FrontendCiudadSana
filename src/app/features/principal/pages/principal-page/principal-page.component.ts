import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero-wrap">
      <div class="hero-main">
        <div class="hero-copy">
          <span class="eyebrow"
            ><span class="eyebrow-line"></span> PARTICIPACIÓN QUE TRANSFORMA</span
          >
          <h1>Una ciudad mejor<br />comienza con <em>tu voz.</em></h1>
          <p>
            Reporta situaciones de tu barrio y sigue cada paso de su atención. Juntos construimos
            una ciudad más segura, limpia y amable.
          </p>
          <div class="hero-actions">
            <a class="button button-primary button-large" routerLink="/registro"
              >Reportar una situación <span>→</span></a
            ><a class="button button-text button-large" routerLink="/como-funciona"
              >Conoce cómo funciona <span>↗</span></a
            >
          </div>
          <div class="hero-trust">
            <div class="avatar-stack"><i>CR</i><i>JM</i><i>AL</i><i>+</i></div>
            <span>Tu participación mejora nuestros barrios</span>
          </div>
        </div>
        <div class="hero-art" aria-label="Ilustración de una ciudad con parque y edificios">
          <div class="art-sky">
            <span class="sun"></span>
            <div class="cloud cloud-one"></div>
            <div class="cloud cloud-two"></div>
            <div class="building building-a"><i></i><i></i><i></i></div>
            <div class="building building-b"><i></i><i></i><i></i><i></i></div>
            <div class="building building-c"><i></i><i></i></div>
            <div class="tree tree-a"><i></i></div>
            <div class="tree tree-b"><i></i></div>
            <div class="street"></div>
            <div class="art-person"><i></i></div>
            <div class="report-pin"><b>✓</b><span>Reporte recibido</span></div>
            <span class="art-label">Una ciudad que escucha</span>
          </div>
        </div>
      </div>
      <div class="proof-strip">
        <div><strong>01</strong><span>Cuéntanos qué sucede</span></div>
        <i></i>
        <div><strong>02</strong><span>Hacemos seguimiento</span></div>
        <i></i>
        <div><strong>03</strong><span>Te contamos el resultado</span></div>
        <span class="proof-mark">CS</span>
      </div>
    </section>
    <section class="how-section">
      <div class="section-heading">
        <span class="eyebrow">FÁCIL, CLARO Y CERCANO</span>
        <h2>Tu reporte, paso a paso</h2>
        <p>Una ruta sencilla para ayudar a mejorar el lugar donde vivimos.</p>
      </div>
      <div class="steps-grid">
        <article class="step-card">
          <span class="step-number">01</span>
          <div class="step-icon">＋</div>
          <h3>Registra tu reporte</h3>
          <p>Describe la situación, indícanos dónde ocurre y agrega una fotografía si lo deseas.</p>
        </article>
        <article class="step-card">
          <span class="step-number">02</span>
          <div class="step-icon">⌖</div>
          <h3>Lo revisamos</h3>
          <p>El equipo responsable valida la información y la asigna al área correspondiente.</p>
        </article>
        <article class="step-card">
          <span class="step-number">03</span>
          <div class="step-icon">✓</div>
          <h3>Sigue su atención</h3>
          <p>Consulta el estado y el historial del reporte desde tu espacio ciudadano.</p>
        </article>
      </div>
    </section>
    <section class="callout-band">
      <div>
        <span class="eyebrow">TU BARRIO CUENTA</span>
        <h2>¿Viste algo que podemos mejorar?</h2>
        <p>Tu mirada nos ayuda a priorizar lo que importa en cada comunidad.</p>
      </div>
      <a routerLink="/acceso" class="button button-light">Ingresar a mi espacio <span>→</span></a>
    </section>
  `,
})
export class PrincipalPageComponent {}
