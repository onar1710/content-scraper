# content-scraper-cli

CLI para extraer contenido de URLs y generar un JSON listo para pasarle a tu IA y que cree artículos.

## Instalación global

```bash
npm install -g content-scraper-cli
```

## Uso

```bash
content-scraper
```

El CLI te pregunta interactivamente:

1. **Las URLs** separadas por coma
2. **El nombre** del archivo JSON de salida

### Ejemplo

```
📎 Ingresa las URLs separadas por coma:
> https://blog.com/articulo-1, https://otro.com/post-2, https://web.com/guia

💾 Nombre del archivo JSON de salida: mi-investigacion

✅ blog.com/articulo-1 — 12 párrafos, 1240 palabras
✅ otro.com/post-2     — 8 párrafos, 890 palabras
✅ web.com/guia        — 20 párrafos, 2100 palabras

──────────────────────────────────────────────────
  RESUMEN
──────────────────────────────────────────────────
  ✅ URLs exitosas:   3
  📄 Archivo JSON:   /tu-proyecto/mi-investigacion.json
──────────────────────────────────────────────────
```

## Qué extrae

De cada URL extrae:

- `titulo` — Título de la página
- `descripcion` — Meta descripción
- `autor` — Autor si está disponible
- `fecha` — Fecha de publicación
- `idioma` — Idioma del sitio
- `keywords` — Keywords meta
- `estructura.h1` — Todos los H1
- `estructura.h2` — Todos los H2
- `estructura.h3` — Todos los H3
- `parrafos` — Todos los párrafos con más de 40 caracteres
- `listas` — Listas ul/ol del contenido
- `total_parrafos` — Cantidad de párrafos
- `total_palabras` — Total de palabras

## JSON de salida

```json
{
  "generado_en": "2024-01-15T10:30:00.000Z",
  "total_fuentes": 3,
  "instrucciones_para_ia": [
    "Usa este JSON como base para crear un artículo original.",
    "..."
  ],
  "fuentes": [
    {
      "url": "https://...",
      "titulo": "...",
      "descripcion": "...",
      "estructura": {
        "h1": ["..."],
        "h2": ["...", "..."],
        "h3": ["..."]
      },
      "parrafos": ["...", "..."],
      "listas": [["item1", "item2"]]
    }
  ]
}
```

## Notas importantes

- Funciona mejor con blogs, sitios de noticias y artículos normales
- Algunos sitios con protección anti-bot pueden bloquear la petición
- No extrae imágenes intencionalmente
- No usa ninguna API de pago, todo gratis

## Publico en npm
Created by Omar Fuentes
https://omarfuentes.com
```

## Licencia

MIT
