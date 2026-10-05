# Clima

Aplicación web responsive para consultar el clima actual de una ciudad. Está hecha con HTML, CSS y JavaScript sin dependencias ni claves de API.

## Ejecutar

Abre `index.html` en un navegador. Si tu navegador restringe las solicitudes desde archivos locales, inicia un servidor estático desde esta carpeta, por ejemplo:

```bash
python -m http.server 8000
```

Luego visita <http://localhost:8000>.

## Datos

La búsqueda de ciudades usa la API de geocodificación de [Open-Meteo](https://open-meteo.com/en/docs/geocoding-api). El clima actual se obtiene de su [API de pronóstico](https://open-meteo.com/en/docs). No hace falta una clave para uso no comercial.
