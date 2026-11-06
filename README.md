# Frontend web CiudadSana

Aplicación Angular responsive. Esta configuración local consume el backend de IntelliJ en `http://localhost:8081`, configurado en `src/environments/environment.ts`.

La cabecera usa el nombre tipográfico Ciudad Sana y no muestra un símbolo temporal. Si se incorpora el logo institucional, guarda el archivo en `frontend/public/assets/logo-ciudad-sana.svg` y actualiza el enlace de marca en `src/app/shared/components/header/header.component.ts`.

```powershell
npm ci
npm start
```

El acceso, registro, perfil, fotografías, categorías, barrios, usuarios, estadísticas y reportes usan los servicios de CiudadSana. El registro solicita los campos de `usuario` y carga los catálogos de documento/sexo desde PostgreSQL. La creación de reportes solicita GPS, categoría, barrio y fotografía. Las imágenes se guardan en disco por el backend; sus metadatos se registran en `public.evidencia` y la ruta relativa queda en PostgreSQL.

En el perfil se puede cargar una fotografía JPG, PNG o WebP de hasta 5 MB. El archivo se guarda en `backend/uploads/perfiles/`. Las evidencias se guardan en `backend/uploads/evidencias/`. En producción, configura un volumen persistente o almacenamiento de objetos antes de desplegar.

Para otro puerto local o una URL desplegada, cambia `apiBaseUrl` en `src/environments/environment.ts` y reconstruye. No coloques secretos en el frontend.
