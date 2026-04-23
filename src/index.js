#!/usr/bin/env node

import axios from "axios";
import * as cheerio from "cheerio";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Utilidades ────────────────────────────────────────────────────────────────

function limpiarTexto(texto) {
  return texto
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ")
    .trim();
}

function esURLValida(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ─── Headers para simular navegador real ───────────────────────────────────────

function getHeaders() {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0",
  };
}

// ─── Scraper principal ──────────────────────────────────────────────────────────

async function scrapearURL(url) {
  const response = await axios.get(url, {
    headers: getHeaders(),
    timeout: 15000,
    maxRedirects: 5,
  });

  const $ = cheerio.load(response.data);

  // Eliminar elementos que no son contenido
  $(
    "script, style, nav, footer, header, aside, .sidebar, .menu, .ad, .advertisement, .cookie, .popup, .modal, noscript, iframe"
  ).remove();

  // ── Título ──
  const titulo =
    limpiarTexto(
      $("title").text() ||
        $("h1").first().text() ||
        $('meta[property="og:title"]').attr("content") ||
        ""
    );

  // ── Meta descripción ──
  const descripcion = limpiarTexto(
    $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      ""
  );

  // ── H1 ──
  const h1 = [];
  $("h1").each((_, el) => {
    const texto = limpiarTexto($(el).text());
    if (texto && texto.length > 2) h1.push(texto);
  });

  // ── H2 ──
  const h2 = [];
  $("h2").each((_, el) => {
    const texto = limpiarTexto($(el).text());
    if (texto && texto.length > 2) h2.push(texto);
  });

  // ── H3 ──
  const h3 = [];
  $("h3").each((_, el) => {
    const texto = limpiarTexto($(el).text());
    if (texto && texto.length > 2) h3.push(texto);
  });

  // ── Párrafos ──
  const parrafos = [];
  $("p").each((_, el) => {
    const texto = limpiarTexto($(el).text());
    // Solo párrafos con contenido real (más de 40 caracteres)
    if (texto && texto.length > 40) {
      parrafos.push(texto);
    }
  });

  // ── Listas ──
  const listas = [];
  $("ul, ol").each((_, lista) => {
    const items = [];
    $(lista)
      .find("li")
      .each((_, li) => {
        const texto = limpiarTexto($(li).text());
        if (texto && texto.length > 3) items.push(texto);
      });
    if (items.length > 0) listas.push(items);
  });

  // ── Keywords meta ──
  const keywords =
    $('meta[name="keywords"]').attr("content") || "";

  // ── Autor ──
  const autor =
    $('meta[name="author"]').attr("content") ||
    $('[rel="author"]').first().text() ||
    $(".author").first().text() ||
    $(".byline").first().text() ||
    "";

  // ── Fecha de publicación ──
  const fecha =
    $('meta[property="article:published_time"]').attr("content") ||
    $("time").first().attr("datetime") ||
    $("time").first().text() ||
    "";

  // ── Idioma ──
  const idioma = $("html").attr("lang") || "";

  return {
    url,
    titulo,
    descripcion,
    autor: limpiarTexto(autor),
    fecha: limpiarTexto(fecha),
    idioma,
    keywords,
    estructura: {
      h1,
      h2,
      h3,
    },
    parrafos,
    listas,
    total_parrafos: parrafos.length,
    total_palabras: parrafos.join(" ").split(/\s+/).length,
  };
}

// ─── Guardar JSON ───────────────────────────────────────────────────────────────

async function guardarJSON(datos, nombreArchivo) {
  const resultado = {
    generado_en: new Date().toISOString(),
    total_fuentes: datos.length,
    instrucciones_para_ia: [
      "Usa este JSON como base para crear un artículo original.",
      "Analiza los títulos, subtítulos y párrafos de cada fuente.",
      "Crea contenido nuevo inspirado en estas fuentes, no copies textualmente.",
      "Mantén la estructura H1 > H2 > H3 para mejor SEO.",
      "El artículo debe tener introducción, desarrollo y conclusión.",
    ],
    fuentes: datos,
  };

  await fs.writeJSON(nombreArchivo, resultado, { spaces: 2 });
  return nombreArchivo;
}

// ─── Banner ─────────────────────────────────────────────────────────────────────

function mostrarBanner() {
  console.log("\n");
  console.log(
    chalk.cyan("╔══════════════════════════════════════════════╗")
  );
  console.log(
    chalk.cyan("║") +
      chalk.bold.white("        CONTENT SCRAPER CLI  v1.0.0          ") +
      chalk.cyan("║")
  );
  console.log(
    chalk.cyan("║") +
      chalk.gray("   Extrae contenido → genera JSON para IA      ") +
      chalk.cyan("║")
  );
  console.log(
    chalk.cyan("╚══════════════════════════════════════════════╝")
  );
  console.log("\n");
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  mostrarBanner();

  // Preguntar URLs
  const { urlsInput } = await inquirer.prompt([
    {
      type: "input",
      name: "urlsInput",
      message: chalk.yellow("📎 Ingresa las URLs separadas por coma:"),
      validate: (input) => {
        if (!input || input.trim() === "") {
          return "Debes ingresar al menos una URL";
        }
        const urls = input.split(",").map((u) => u.trim());
        const invalidas = urls.filter((u) => !esURLValida(u));
        if (invalidas.length > 0) {
          return `URLs inválidas: ${invalidas.join(", ")}`;
        }
        return true;
      },
    },
  ]);

  // Preguntar nombre del archivo de salida
  const { nombreArchivo } = await inquirer.prompt([
    {
      type: "input",
      name: "nombreArchivo",
      message: chalk.yellow("💾 Nombre del archivo JSON de salida:"),
      default: `contenido-${Date.now()}.json`,
      validate: (input) => {
        if (!input || input.trim() === "") return "Ingresa un nombre";
        return true;
      },
    },
  ]);

  const urls = urlsInput.split(",").map((u) => u.trim()).filter(Boolean);
  const resultados = [];
  const errores = [];

  console.log("\n");

  // Scrapear cada URL
  for (const url of urls) {
    const spinner = ora({
      text: chalk.blue(`Analizando: ${url}`),
      color: "cyan",
    }).start();

    try {
      const datos = await scrapearURL(url);
      resultados.push(datos);
      spinner.succeed(
        chalk.green(`✅ ${url}`) +
          chalk.gray(
            ` — ${datos.total_parrafos} párrafos, ${datos.total_palabras} palabras`
          )
      );
    } catch (error) {
      errores.push({ url, error: error.message });
      spinner.fail(
        chalk.red(`❌ ${url}`) + chalk.gray(` — ${error.message}`)
      );
    }

    // Pequeña pausa entre requests para no saturar
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (resultados.length === 0) {
    console.log(
      "\n" +
        chalk.red("No se pudo extraer contenido de ninguna URL.") +
        "\n"
    );
    process.exit(1);
  }

  // Guardar JSON
  const archivoFinal = nombreArchivo.endsWith(".json")
    ? nombreArchivo
    : `${nombreArchivo}.json`;

  const rutaFinal = path.resolve(process.cwd(), archivoFinal);
  await guardarJSON(resultados, rutaFinal);

  console.log("\n");
  console.log(chalk.cyan("─".repeat(50)));
  console.log(chalk.bold.white("  RESUMEN"));
  console.log(chalk.cyan("─".repeat(50)));
  console.log(
    chalk.green(`  ✅ URLs exitosas:  `) + chalk.white(resultados.length)
  );
  if (errores.length > 0) {
    console.log(
      chalk.red(`  ❌ URLs fallidas:   `) + chalk.white(errores.length)
    );
  }
  console.log(
    chalk.yellow(`  📄 Archivo JSON:   `) + chalk.white(rutaFinal)
  );
  console.log(chalk.cyan("─".repeat(50)));
  console.log(
    "\n" +
      chalk.gray(
        "  Ahora puedes darle ese JSON a tu IA para generar el artículo."
      ) +
      "\n"
  );
}

main().catch((err) => {
  console.error(chalk.red("\n❌ Error inesperado:"), err.message);
  process.exit(1);
});
